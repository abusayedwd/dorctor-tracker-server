import { Router } from 'express';
import { authenticate, authorize } from './middlewares/auth';
import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import doctorRoutes from './modules/doctor/doctor.routes';
import patientRoutes from './modules/patient/patient.routes';
import seedRoutes from './modules/seed/seed.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/seed', seedRoutes);

// Everything below requires a signed-in admin.
router.use(authenticate, authorize('admin'));
router.use('/dashboard', dashboardRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);

export default router;
