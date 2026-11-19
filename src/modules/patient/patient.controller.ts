import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { patientService } from './patient.service';

export const listPatients = catchAsync(async (_req, res) => {
  const { items, meta } = await patientService.list(res.locals.validated.query);
  sendResponse(res, { message: 'Patients retrieved', data: items, meta });
});

export const getPatient = catchAsync(async (req, res) => {
  sendResponse(res, { message: 'Patient retrieved', data: await patientService.getById(req.params.id) });
});

export const updatePatient = catchAsync(async (req, res) => {
  const patient = await patientService.update(req.params.id, req.body);
  sendResponse(res, { message: 'Patient updated', data: patient });
});

export const deletePatient = catchAsync(async (req, res) => {
  const result = await patientService.remove(req.params.id);
  sendResponse(res, { message: 'Patient deleted', data: result });
});
