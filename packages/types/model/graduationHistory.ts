import type { Types } from 'mongoose';

export type GraduationHistory = {
  ra: number;
  coefficients: Record<string, unknown>;
  disciplinas: Record<string, unknown>;
  curso: string;
  grade: string;
  graduation: Types.ObjectId;
};
