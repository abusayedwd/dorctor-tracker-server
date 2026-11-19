import type { FilterQuery, SortOrder } from 'mongoose';
import { Doctor, type IDoctor } from '../../models/doctor.model';
import { Patient } from '../../models/patient.model';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, dateRange, escapeRegex, toPagination, type PageQuery } from '../../utils/query';

export interface DoctorListQuery extends PageQuery {
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: Date;
  to?: Date;
}

type DoctorInput = Pick<IDoctor, 'name' | 'specialization' | 'hospital' | 'phone' | 'email'>;

const list = async (query: DoctorListQuery) => {
  const filter: FilterQuery<IDoctor> = {};

  if (query.specialization) filter.specialization = query.specialization;
  if (query.hospital) filter.hospital = query.hospital;

  const createdAt = dateRange(query.from, query.to);
  if (createdAt) filter.createdAt = createdAt;

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { specialization: rx }, { hospital: rx }, { phone: rx }];
  }

  const direction: SortOrder = query.order === 'asc' ? 1 : -1;
  // `_id` tie-breaker keeps pagination stable when sort values are equal.
  const sort: Record<string, SortOrder> = { [query.sortBy]: direction, _id: direction };
  const { skip, limit } = toPagination(query);

  // Page + total run in parallel; `lean()` skips hydration for read-only data.
  const [items, total] = await Promise.all([
    Doctor.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Doctor.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(query.page, limit, total) };
};

/** Distinct values for the filter dropdowns (served from the single-field index prefixes). */
const filterOptions = async () => {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  return { specializations: specializations.sort(), hospitals: hospitals.sort() };
};

const getById = async (id: string) => {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');
  return doctor;
};

const create = (data: DoctorInput) => Doctor.create(data);

const update = async (id: string, data: Partial<DoctorInput>) => {
  const doctor = await Doctor.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');
  return doctor;
};

/** Deletes a doctor together with their patients (a patient cannot exist without a doctor). */
const remove = async (id: string) => {
  const doctor = await Doctor.findById(id).select('_id').lean();
  if (!doctor) throw ApiError.notFound('Doctor not found');
  const { deletedCount } = await Patient.deleteMany({ doctor: id });
  await Doctor.deleteOne({ _id: id });
  return { id, deletedPatients: deletedCount };
};

export const doctorService = { list, filterOptions, getById, create, update, remove };
