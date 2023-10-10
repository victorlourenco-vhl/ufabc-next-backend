import { asyncParallelMap } from '@/helpers/asyncParallelMap';
import {
  calculateCoefficients,
  type historyDiscipline,
} from '@/helpers/calculateCoefficients';
import { generateIdentifier } from '@/helpers/identifier';
import { createQueue } from '@/helpers/queueUtil';
import { modifyPayload } from '@/helpers/validateSubjects';
import { logger } from '@ufabcnext/common';
import {
  EnrollmentModel,
  GraduationHistoryModel,
  GraduationModel,
  SubjectModel,
} from '@ufabcnext/models';
import type { Graduation, History } from '@ufabcnext/types';
import type { Job } from 'bullmq';
import * as _ from 'lodash';
import type { Types } from 'mongoose';

export async function updateUserEnrollments(doc: History) {
  if (!doc.disciplinas) {
    return;
  }

  //TODO: maybe make the ternary stuff into a function
  const disciplinesArr = (
    Array.isArray(doc.disciplinas) ? doc.disciplinas : [doc.disciplinas]
  ).filter(Boolean);

  let graduation:
    | (Graduation & {
        _id: Types.ObjectId;
      })
    | null = null;

  if (doc.curso && doc.grade) {
    graduation = await GraduationModel.findOne({
      curso: doc.curso,
      grade: doc.grade,
    }).lean(true);
  }

  const coefficients = calculateCoefficients(
    disciplinesArr as historyDiscipline[],
    graduation,
  );

  await GraduationHistoryModel.findOneAndUpdate(
    {
      curso: checkAndFixCourseName(doc.curso),
      grade: doc.grade,
      ra: doc.ra,
    },
    {
      curso: checkAndFixCourseName(doc.curso),
      grade: doc.grade,
      ra: doc.ra,
      coefficients: coefficients,
      disciplinas: disciplinesArr,
      graduation: graduation ? graduation._id : null,
    },
    { upsert: true },
  );

  const updateOrCreateEnrollments = async (discipline: historyDiscipline) => {
    const disc = {
      ra: doc.ra,
      year: discipline.ano,
      quad: discipline.periodo,
      disciplina: discipline.disciplina,
    };

    const keys = ['ra', 'year', 'quad', 'disciplina'];

    const coef = getLastPeriod(
      doc.coefficients,
      discipline.ano,
      discipline.periodo,
    );

    const enrollmentPayload = {
      ra: disc.ra,
      year: disc.year,
      quad: disc.quad,
      disciplina: disc.disciplina,
      conceito: discipline.conceito,
      creditos: discipline.creditos,
      cr_acumulado: _.get(coef, 'cr_acumulado'),
      ca_acumulado: _.get(coef, 'ca_acumulado'),
      cp_acumulado: _.get(coef, 'cp_acumulado'),
    };

    //for some reason the cache that is supposed to be in the subject model is not working
    //TODO: fix the subject model cache
    const subjects = await SubjectModel.find({}).lean(true);
    const modifiedPayload = modifyPayload(enrollmentPayload, subjects, {});

    await EnrollmentModel.findOneAndUpdate(
      {
        identifier: discipline.identifier || generateIdentifier(disc, keys),
      },
      modifiedPayload,
      {
        new: true,
        upsert: true,
      },

      //TODO: Add cache for main teacher and subject
      //   if(enrollment.mainTeacher) {
      //   const cacheKey = `reviews_${enrollment.mainTeacher}`
      //   await app.redis.cache.del(cacheKey)
      // }
      //
      // if(enrollment.subject) {
      //   const cacheKey = `reviews_${enrollment.subject}`
      //   await app.redis.cache.del(cacheKey)
      // }
    );
  };
  return asyncParallelMap(
    disciplinesArr as historyDiscipline[],
    updateOrCreateEnrollments,
    10,
  );
}

function checkAndFixCourseName(courseName: string) {
  return courseName === 'Bacharelado em CIências e Humanidades'
    ? 'Bacharelado em Ciências e Humanidades'
    : courseName;
}

//TODO: replace _.get with a native function
function getLastPeriod(
  disciplines: Record<string, unknown>,
  year: number,
  quad: number,
  begin?: string,
) {
  if (!begin) {
    const firstYear = Object.keys(disciplines)[0]!;
    const firstMonth = Object.keys(disciplines[firstYear]!)[0];
    begin = `${firstYear}.${firstMonth}`;
  }

  if (quad == 1) {
    quad = 3;
    year -= 1;
  } else if (quad == 2 || quad == 3) {
    quad -= 1;
  }

  if (begin > `${year}.${quad}`) {
    return null;
  }

  const resp = _.get(disciplines, `${year}.${quad}`, null);
  if (resp === null) {
    return getLastPeriod(disciplines, year, quad, begin);
  }

  return resp;
}

export const updaterUserEnrollmentsQueue = createQueue(
  'Update:UserEnrollments',
);

export const addUserEnrollmentsToQueue = async (payload: Job<History>) => {
  await updaterUserEnrollmentsQueue.add('Update:UserEnrollments', payload);
};

export const updateUserEnrollmentsWorker = async (job: Job<History>) => {
  const payload = job.data;
  try {
    await updateUserEnrollments(payload);
  } catch (error) {
    logger.error(
      { error },
      'updateUserEnrollmentsWorker: Error updating user enrollments',
    );
    throw error;
  }
};
