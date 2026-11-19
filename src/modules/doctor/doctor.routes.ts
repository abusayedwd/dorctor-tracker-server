import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import * as controller from './doctor.controller';
import * as v from './doctor.validation';

const router = Router();

router.route('/').get(validate(v.listDoctorsSchema), controller.listDoctors).post(validate(v.createDoctorSchema), controller.createDoctor);

router.get('/filters', controller.getFilterOptions);

router
  .route('/:id')
  .get(validate(v.getDoctorSchema), controller.getDoctor)
  .patch(validate(v.updateDoctorSchema), controller.updateDoctor)
  .delete(validate(v.deleteDoctorSchema), controller.deleteDoctor);

router
  .route('/:id/patients')
  .get(validate(v.doctorPatientsSchema), controller.listDoctorPatients)
  .post(validate(v.addDoctorPatientSchema), controller.addDoctorPatient);

router.delete('/:id/patients/:patientId', validate(v.removeDoctorPatientSchema), controller.removeDoctorPatient);

export default router;
