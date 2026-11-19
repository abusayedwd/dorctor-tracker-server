import Joi from 'joi';
import type { RequestSchema } from '../../middlewares/validate';
import { idParam, listQueryKeys, objectId, phone } from '../../utils/validators';
import { patientCreateBody, patientListQuery } from '../patient/patient.validation';

const doctorFields = {
  name: Joi.string().trim().min(2).max(100),
  specialization: Joi.string().trim().min(2).max(100),
  hospital: Joi.string().trim().min(2).max(150),
  phone,
  email: Joi.string().trim().lowercase().email(),
};

export const listDoctorsSchema: RequestSchema = {
  query: Joi.object({
    ...listQueryKeys(['createdAt', 'name', 'patientCount']),
    specialization: Joi.string().trim().max(100),
    hospital: Joi.string().trim().max(150),
  }),
};

export const getDoctorSchema: RequestSchema = { params: idParam };

export const createDoctorSchema: RequestSchema = {
  body: Joi.object({
    name: doctorFields.name.required(),
    specialization: doctorFields.specialization.required(),
    hospital: doctorFields.hospital.required(),
    phone: doctorFields.phone.required(),
    email: doctorFields.email.required(),
  }),
};

export const updateDoctorSchema: RequestSchema = {
  params: idParam,
  body: Joi.object(doctorFields).min(1),
};

export const deleteDoctorSchema: RequestSchema = { params: idParam };

export const doctorPatientsSchema: RequestSchema = {
  params: idParam,
  query: patientListQuery.fork(['doctor'], (schema) => schema.forbidden()),
};

export const addDoctorPatientSchema: RequestSchema = {
  params: idParam,
  body: patientCreateBody,
};

export const removeDoctorPatientSchema: RequestSchema = {
  params: Joi.object({ id: objectId.required(), patientId: objectId.required() }),
};
