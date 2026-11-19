import { Schema, Types, model } from 'mongoose';

export const PATIENT_CONDITIONS = ['stable', 'critical', 'recovering', 'under_observation', 'discharged'] as const;
export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export interface IPatient {
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: PatientCondition;
  diagnosis?: string;
  doctor: Types.ObjectId;
  /** Date the patient was admitted / registered under the doctor. Drives date filters & trends. */
  admittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true },
    condition: { type: String, enum: PATIENT_CONDITIONS, default: 'stable' },
    diagnosis: { type: String, trim: true, maxlength: 300 },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    admittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

/*
 * Indexes follow the list endpoints' query shapes (Equality, Sort, Range).
 * `_id` is the pagination tie-breaker, so it closes every sort index.
 *  - patients of one doctor, newest first     -> { doctor, admittedAt, _id }
 *  - filter by condition + date sort/range    -> { condition, admittedAt, _id }
 *  - global list / dashboard date trend       -> { admittedAt, _id }
 *  - name sort                                -> { name, _id }
 */
patientSchema.index({ doctor: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ condition: 1, admittedAt: -1, _id: -1 });
patientSchema.index({ admittedAt: -1, _id: -1 });
patientSchema.index({ name: 1, _id: 1 });

export const Patient = model<IPatient>('Patient', patientSchema);
