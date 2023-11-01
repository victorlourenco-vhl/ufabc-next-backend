import type { Model, ObjectId } from 'mongoose';

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

export type Disciplina = {
  identifier: string;
  obrigatorias: number[];
  alunos_matriculados: number[];
  before_kick: number[];
  after_kick: number[];
  year?: number;
  quad?: number;
  turno?: string;
  disciplina?: string;
  season?: string;
  teoria?: ObjectId;
  pratica?: ObjectId;
  campus?: string;
  turma?: string;
  subject?: ObjectId;
  codigo?: string;
  disciplina_id?: number;
  vagas?: number;
  ideal_quad?: boolean;
};

export type Teacher = {
  alias: string[];
  name: string;
};

export type Enrollment = {
  year: number;
  quad: number;
  comments?: string;
  type?: 'teoria' | 'pratica';
  ra: number;
  creditos?: number;
  turno?: string;
  disciplina?: string;
  season?: string;
  mainTeacher?: ObjectId;
  teoria?: ObjectId;
  pratica?: ObjectId;
  identifier?: string;
  campus?: string;
  turma?: string;
  conceito?: string;
  ca_acumulado?: number;
  cr_acumulado?: number;
  cp_acumulado?: number;
  subject?: ObjectId;
};
export type EnrollmentDocument = Enrollment & { _id: ObjectId };
export type EnrollmentModel = Model<EnrollmentDocument>;

export type SubjectDocument = {
  _id: ObjectId;
  name: string;
  search?: string;
  creditos?: number;
};

export type History = {
  ra?: number | undefined;
  disciplinas?: any;
  coefficients?: any;
  curso?: string | undefined;
  grade?: string | undefined;
};
