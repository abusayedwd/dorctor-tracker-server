import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../../config/env';
import { Doctor } from '../../models/doctor.model';
import { GENDERS, Patient, PATIENT_CONDITIONS } from '../../models/patient.model';
import { RefreshToken } from '../../models/refreshToken.model';
import { User } from '../../models/user.model';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const router = Router();

// ─── Seed helpers (same logic as seed.ts script) ────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
let state = 42;
const rand = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const phone = () => `+8801${int(3, 9)}${String(int(0, 99999999)).padStart(8, '0')}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
const FIRST = ['Ayesha','Rahim','Nusrat','Tanvir','Farhana','Imran','Sadia','Arif','Mehnaz','Kamal','Lamia','Shafiq','Riya','Hasan','Tania','Naveed','Sumaiya','Zahid','Priya','Omar','Elena','James','Sofia','Daniel','Maya','Lucas','Aisha','Noah','Leila','Ethan'];
const LAST = ['Rahman','Hossain','Ahmed','Islam','Chowdhury','Karim','Akter','Sarker','Khan','Das','Roy','Begum','Miah','Siddique','Patel','Carter','Nguyen','Silva','Haddad','Moreno'];
const SPECIALIZATIONS = ['Cardiology','Neurology','Orthopedics','Pediatrics','Dermatology','Oncology','Gastroenterology','Endocrinology','Psychiatry','General Medicine'];
const HOSPITALS = ['Evercare Hospital','Square Hospital','United Hospital','Labaid Specialized Hospital','Ibn Sina Hospital','Popular Medical Center'];
const DIAGNOSES: Record<string, string[]> = {
  Cardiology: ['Hypertension','Arrhythmia','Coronary artery disease','Heart failure'],
  Neurology: ['Migraine','Epilepsy','Peripheral neuropathy','Post-stroke care'],
  Orthopedics: ['Fractured radius','Osteoarthritis','ACL tear','Lower back pain'],
  Pediatrics: ['Bronchiolitis','Childhood asthma','Viral fever','Growth monitoring'],
  Dermatology: ['Eczema','Psoriasis','Acne vulgaris','Fungal infection'],
  Oncology: ['Breast cancer follow-up','Lymphoma','Chemotherapy cycle','Lung nodule review'],
  Gastroenterology: ['GERD','Irritable bowel syndrome','Hepatitis B','Peptic ulcer'],
  Endocrinology: ['Type 2 diabetes','Hypothyroidism','PCOS','Thyroid nodule'],
  Psychiatry: ['Generalized anxiety','Depression','Insomnia','ADHD review'],
  'General Medicine': ['Seasonal flu','Dengue fever','Typhoid','Routine check-up'],
};
const CONDITION_WEIGHTS = ['stable','stable','stable','stable','recovering','recovering','recovering','under_observation','under_observation','critical','discharged','discharged'] as (typeof PATIENT_CONDITIONS)[number][];
const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/seed
 * Protected by a secret key header: x-seed-secret
 * Only works in non-production OR when SEED_SECRET env var is set.
 */
router.post(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const secret = process.env.SEED_SECRET;
    if (!secret || req.headers['x-seed-secret'] !== secret) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const now = Date.now();
    state = 42; // reset PRNG for deterministic output

    await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({}), RefreshToken.deleteMany({})]);

    await User.deleteOne({ email: config.seedAdmin.email });
    await User.create({ ...config.seedAdmin, role: 'admin' });

    const doctors = await Doctor.insertMany(
      Array.from({ length: 40 }, (_, i) => {
        const name = fullName();
        const createdAt = new Date(now - int(30, 400) * DAY_MS);
        return {
          name: `Dr. ${name}`,
          specialization: SPECIALIZATIONS[i % SPECIALIZATIONS.length],
          hospital: pick(HOSPITALS),
          phone: phone(),
          email: `${slug(name)}.${i + 1}@doctortracker.com`,
          createdAt,
          updatedAt: createdAt,
        };
      }),
    );

    const patients = Array.from({ length: 900 }, () => {
      const doctor = doctors[Math.floor(Math.pow(rand(), 1.6) * doctors.length)];
      const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 365);
      const admittedAt = new Date(now - daysAgo * DAY_MS - int(0, DAY_MS - 1));
      const name = fullName();
      return {
        name,
        age: int(1, 90),
        gender: pick(GENDERS.slice(0, 2)) as (typeof GENDERS)[number],
        phone: phone(),
        email: rand() > 0.3 ? `${slug(name)}${int(1, 999)}@mail.com` : undefined,
        condition: pick(CONDITION_WEIGHTS),
        diagnosis: pick(DIAGNOSES[doctor.specialization] ?? ['General consultation']),
        doctor: doctor._id,
        admittedAt,
        createdAt: admittedAt,
        updatedAt: admittedAt,
      };
    });
    await Patient.insertMany(patients);

    const counts = await Patient.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
    ]);
    await Doctor.bulkWrite(
      counts.map((c) => ({ updateOne: { filter: { _id: c._id }, update: { $set: { patientCount: c.count } } } })),
    );

    await Promise.all([Doctor.syncIndexes(), Patient.syncIndexes(), User.syncIndexes(), RefreshToken.syncIndexes()]);

    sendResponse(res, { message: `Seeded 40 doctors and 900 patients. Admin: ${config.seedAdmin.email}`, data: null });
  }),
);

export default router;
