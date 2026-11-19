import Joi from 'joi';
import type { RequestSchema } from '../../middlewares/validate';
import { GENDERS, PATIENT_CONDITIONS } from '../../models/patient.model';
import { idParam, listQueryKeys, objectId, phone } from '../../utils/validators';

export const PATIENT_SORT_FIELDS = ['admittedAt', 'name', 'age', 'createdAt'];

const patientFields = {
  name: Joi.string().trim().min(2).max(100),
  age: Joi.number().integer().min(0).max(130),
  gender: Joi.string().valid(...GENDERS),
  phone,
  email: Joi.string().trim().lowercase().email().allow(''),
  condition: Joi.string().valid(...PATIENT_CONDITIONS),
  diagnosis: Joi.string().trim().max(300).allow(''),
  admittedAt: Joi.date().iso().max('now'),
};

/** Body for creating a patient under a doctor (doctor comes from the URL). */
export const patientCreateBody = Joi.object({
  ...patientFields,
  name: patientFields.name.required(),
  age: patientFields.age.required(),
  gender: patientFields.gender.required(),
  phone: patientFields.phone.required(),
});

export const patientListQuery = Joi.object({
  ...listQueryKeys(PATIENT_SORT_FIELDS, 'admittedAt'),
  condition: Joi.string().valid(...PATIENT_CONDITIONS),
  gender: Joi.string().valid(...GENDERS),
  doctor: objectId,
});

export const listPatientsSchema: RequestSchema = { query: patientListQuery };

export const getPatientSchema: RequestSchema = { params: idParam };

export const updatePatientSchema: RequestSchema = {
  params: idParam,
  body: Joi.object({ ...patientFields, doctor: objectId }).min(1),
};

export const deletePatientSchema: RequestSchema = { params: idParam };
