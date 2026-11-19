import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { patientService } from '../patient/patient.service';
import { doctorService } from './doctor.service';

export const listDoctors = catchAsync(async (_req, res) => {
  const { items, meta } = await doctorService.list(res.locals.validated.query);
  sendResponse(res, { message: 'Doctors retrieved', data: items, meta });
});

export const getFilterOptions = catchAsync(async (_req, res) => {
  sendResponse(res, { message: 'Doctor filter options', data: await doctorService.filterOptions() });
});

export const getDoctor = catchAsync(async (req, res) => {
  sendResponse(res, { message: 'Doctor retrieved', data: await doctorService.getById(req.params.id) });
});

export const createDoctor = catchAsync(async (req, res) => {
  const doctor = await doctorService.create(req.body);
  sendResponse(res, { statusCode: 201, message: 'Doctor created', data: doctor });
});

export const updateDoctor = catchAsync(async (req, res) => {
  const doctor = await doctorService.update(req.params.id, req.body);
  sendResponse(res, { message: 'Doctor updated', data: doctor });
});

export const deleteDoctor = catchAsync(async (req, res) => {
  const result = await doctorService.remove(req.params.id);
  sendResponse(res, { message: 'Doctor deleted', data: result });
});

export const listDoctorPatients = catchAsync(async (req, res) => {
  const { items, meta } = await patientService.list({ ...res.locals.validated.query, doctor: req.params.id });
  sendResponse(res, { message: 'Doctor patients retrieved', data: items, meta });
});

export const addDoctorPatient = catchAsync(async (req, res) => {
  const patient = await patientService.create(req.params.id, req.body);
  sendResponse(res, { statusCode: 201, message: 'Patient added', data: patient });
});

export const removeDoctorPatient = catchAsync(async (req, res) => {
  const result = await patientService.remove(req.params.patientId, req.params.id);
  sendResponse(res, { message: 'Patient removed', data: result });
});
