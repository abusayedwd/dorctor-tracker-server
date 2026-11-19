import { Schema, model } from 'mongoose';

export interface IDoctor {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  /**
   * Denormalised counter kept in sync by the patient service ($inc on
   * create/delete/reassign). Lets lists and the dashboard show "patients per
   * doctor" without a $lookup/count over the patients collection.
   */
  patientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    specialization: { type: String, required: true, trim: true, maxlength: 100 },
    hospital: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    patientCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

/*
 * Indexes follow the list endpoint's query shapes (ESR rule: Equality, Sort, Range).
 * Every sort ends with `_id` as a tie-breaker for stable pagination, so `_id` is
 * part of each index — otherwise MongoDB falls back to an in-memory SORT stage.
 * (asc/desc both work: an index can be walked in reverse.)
 *  - default listing sorted by newest            -> { createdAt, _id }
 *  - filter by specialization / hospital + sort  -> { specialization, createdAt, _id }, { hospital, createdAt, _id }
 *  - "most patients" sort / dashboard top list   -> { patientCount, _id }
 *  - name sort                                   -> { name, _id }
 */
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ patientCount: -1, _id: -1 });
doctorSchema.index({ name: 1, _id: 1 });

export const Doctor = model<IDoctor>('Doctor', doctorSchema);
