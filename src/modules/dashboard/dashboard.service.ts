import { Doctor } from '../../models/doctor.model';
import { Patient, PATIENT_CONDITIONS } from '../../models/patient.model';

export interface DashboardQuery {
  days: number;
  tz: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Formats a date as a bucket key in the given timezone ("YYYY-MM-DD" or "YYYY-MM"). */
const bucketKey = (date: Date, tz: string, monthly: boolean) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return monthly ? `${get('year')}-${get('month')}` : `${get('year')}-${get('month')}-${get('day')}`;
};

/** Every bucket key in the window, so days/months without data still show as 0 on the chart. */
const allBuckets = (start: Date, end: Date, tz: string, monthly: boolean) => {
  const keys = new Set<string>();
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    keys.add(bucketKey(new Date(t), tz, monthly));
  }
  keys.add(bucketKey(end, tz, monthly));
  return [...keys];
};

const pctChange = (current: number, previous: number) =>
  previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 1000) / 10;

const getStats = async ({ days, tz }: DashboardQuery) => {
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * DAY_MS);
  start.setUTCHours(0, 0, 0, 0);
  const prevStart = new Date(start.getTime() - days * DAY_MS);

  // Long windows are bucketed by month to keep the chart readable.
  const monthly = days > 90;
  const format = monthly ? '%Y-%m' : '%Y-%m-%d';

  const trendPipeline = (dateField: string) => [
    { $match: { [dateField]: { $gte: start, $lte: now } } },
    { $group: { _id: { $dateToString: { format, date: `$${dateField}`, timezone: tz } }, count: { $sum: 1 } } },
  ];

  // Every aggregation is independent -> run them all concurrently. Totals use
  // collection metadata (estimatedDocumentCount) instead of a full scan.
  const [
    totalDoctors,
    totalPatients,
    newPatients,
    prevPatients,
    newDoctors,
    criticalPatients,
    topDoctors,
    byCondition,
    bySpecialization,
    patientTrend,
    doctorTrend,
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),
    Patient.countDocuments({ admittedAt: { $gte: start, $lte: now } }),
    Patient.countDocuments({ admittedAt: { $gte: prevStart, $lt: start } }),
    Doctor.countDocuments({ createdAt: { $gte: start, $lte: now } }),
    Patient.countDocuments({ condition: 'critical' }),
    Doctor.find().sort({ patientCount: -1, _id: -1 }).limit(8).select('name specialization patientCount').lean(),
    Patient.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$condition', count: { $sum: 1 } } }]),
    Doctor.aggregate<{ _id: string; doctors: number; patients: number }>([
      { $group: { _id: '$specialization', doctors: { $sum: 1 }, patients: { $sum: '$patientCount' } } },
      { $sort: { patients: -1 } },
      { $limit: 8 },
    ]),
    Patient.aggregate<{ _id: string; count: number }>(trendPipeline('admittedAt')),
    Doctor.aggregate<{ _id: string; count: number }>(trendPipeline('createdAt')),
  ]);

  const patientMap = new Map(patientTrend.map((b) => [b._id, b.count]));
  const doctorMap = new Map(doctorTrend.map((b) => [b._id, b.count]));
  const conditionMap = new Map(byCondition.map((b) => [b._id, b.count]));

  return {
    range: { from: start, to: now, days, granularity: monthly ? 'month' : 'day' },
    summary: {
      totalDoctors,
      totalPatients,
      avgPatientsPerDoctor: totalDoctors ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0,
      criticalPatients,
      newPatients,
      newPatientsChange: pctChange(newPatients, prevPatients),
      newDoctors,
    },
    trend: allBuckets(start, now, tz, monthly).map((date) => ({
      date,
      patients: patientMap.get(date) ?? 0,
      doctors: doctorMap.get(date) ?? 0,
    })),
    patientsPerDoctor: topDoctors.map((d) => ({
      id: d._id,
      name: d.name,
      specialization: d.specialization,
      patients: d.patientCount,
    })),
    patientsByCondition: PATIENT_CONDITIONS.map((condition) => ({
      condition,
      count: conditionMap.get(condition) ?? 0,
    })),
    specializations: bySpecialization.map((s) => ({
      specialization: s._id,
      doctors: s.doctors,
      patients: s.patients,
    })),
  };
};

export const dashboardService = { getStats };
