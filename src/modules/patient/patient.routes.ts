import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import * as controller from './patient.controller';
import * as v from './patient.validation';

const router = Router();

router.get('/', validate(v.listPatientsSchema), controller.listPatients);

router
  .route('/:id')
  .get(validate(v.getPatientSchema), controller.getPatient)
  .patch(validate(v.updatePatientSchema), controller.updatePatient)
  .delete(validate(v.deletePatientSchema), controller.deletePatient);

export default router;
