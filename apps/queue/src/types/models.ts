import type { ObjectId } from 'mongoose';

// Set all types here, to remove some baggage the code has on the models
export type Graduation = {
  locked: boolean;
  creditsBreakdown: {
    year?: number;
    quad?: number;
    choosableCredits?: number;
  }[];
  curso?: string;
  grade?: string;
  mandatory_credits_number?: number;
  limited_credits_number?: number;
  free_credits_number?: number;
  credits_total?: number;
};
export type GraduationDocument = Graduation & { _id: ObjectId };

export type HistoryDiscipline = {
  ano: number;
  categoria: string;
  situacao: string;
  periodo: number;
  creditos: number;
  conceito: string;
  codigo: string;
  disciplina: string;
  identifier: string;
};
