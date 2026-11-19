import { Types, type FilterQuery, type SortOrder } from 'mongoose';
import { Doctor } from '../../models/doctor.model';
import { Patient, type Gender, type IPatient, type PatientCondition } from '../../models/patient.model';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, dateRange, escapeRegex, toPagination, type PageQuery } from '../../utils/query';

export interface PatientListQuery extends PageQuery {
  search?: string;
  condition?: PatientCondition;
  gender?: Gender;
  doctor?: string;
  from?: Date;
  to?: Date;
}

export type PatientInput = Omit<IPatient, 'doctor' | 'createdAt' | 'updatedAt' | 'admittedAt'> & {
  admittedAt?: Date;
};

const DOCTOR_SUMMARY = 'name specialization hospital';

const assertDoctorExists = async (doctorId: string) => {
  const exists = await Doctor.exists({ _id: doctorId });
  if (!exists) throw ApiError.notFound('Doctor not found');
};

const adjustPatientCount = (doctorId: Types.ObjectId | string, by: number) =>
  Doctor.updateOne({ _id: doctorId }, { $inc: { patientCount: by } });

const list = async (query: PatientListQuery) => {
  const filter: FilterQuery<IPatient> = {};

  if (query.doctor) filter.doctor = new Types.ObjectId(query.doctor);
  if (query.condition) filter.condition = query.condition;
  if (query.gender) filter.gender = query.gender;

  const admittedAt = dateRange(query.from, query.to);
  if (admittedAt) filter.admittedAt = admittedAt;

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { diagnosis: rx }];
  }

  const direction: SortOrder = query.order === 'asc' ? 1 : -1;
  const sort: Record<string, SortOrder> = { [query.sortBy]: direction, _id: direction };
  const { skip, limit } = toPagination(query);

  const [items, total] = await Promise.all([
    // populate() resolves all doctors of the page in ONE extra `$in` query (no N+1).
    Patient.find(filter).sort(sort).skip(skip).limit(limit).populate('doctor', DOCTOR_SUMMARY).lean(),
    Patient.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(query.page, limit, total) };
};

const getById = async (id: string) => {
  const patient = await Patient.findById(id).populate('doctor', DOCTOR_SUMMARY).lean();
  if (!patient) throw ApiError.notFound('Patient not found');
  return patient;
};

const create = async (doctorId: string, data: PatientInput) => {
  await assertDoctorExists(doctorId);
  const patient = await Patient.create({ ...data, doctor: doctorId });
  await adjustPatientCount(doctorId, 1);
  return patient;
};

const update = async (id: string, data: Partial<PatientInput> & { doctor?: string }) => {
  const current = await Patient.findById(id).select('doctor').lean();
  if (!current) throw ApiError.notFound('Patient not found');

  const reassigned = data.doctor && data.doctor !== current.doctor.toString();
  if (reassigned) await assertDoctorExists(data.doctor!);

  const patient = await Patient.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('doctor', DOCTOR_SUMMARY)
    .lean();

  if (reassigned) {
    await Promise.all([adjustPatientCount(current.doctor, -1), adjustPatientCount(data.doctor!, 1)]);
  }
  return patient;
};

/** Deletes a patient. When `doctorId` is given the patient must belong to that doctor. */
const remove = async (id: string, doctorId?: string) => {
  const filter: FilterQuery<IPatient> = { _id: id };
  if (doctorId) filter.doctor = doctorId;

  const patient = await Patient.findOneAndDelete(filter).select('doctor').lean();
  if (!patient) throw ApiError.notFound('Patient not found');

  await adjustPatientCount(patient.doctor, -1);
  return { id };
};

export const patientService = { list, getById, create, update, remove };
