import { logger } from '@next/common';
import { asyncParallelMap } from '@/helpers/asyncParallelMap.js';
import { generateIdentifier } from '@/helpers/identifier.js';
import { createQueue } from '@/helpers/queueUtil.js';
import { resolveProfessors } from '@/helpers/resolveProfessors.js';
import type {
  EnrollmentDocument,
  EnrollmentModel,
  TeacherModel,
} from '@/types/models.js';

export async function updateTeachers(
  payload: { json: unknown },
  teacherModel: TeacherModel,
  enrollmentModel: EnrollmentModel,
) {
  const data = payload.json;

  const teachers = await teacherModel.find({});

  const updateTeacherInEnrollments = async (enrollment: EnrollmentDocument) => {
    const keys = ['ra', 'year', 'quad', 'disciplina'];

    const key = {
      ra: enrollment.ra,
      year: enrollment.year,
      quad: enrollment.quad,
      disciplina: enrollment.disciplina,
    };

    const identifier = generateIdentifier(key, keys);

    try {
      const insertOpts = { new: true, upsert: true };
      await enrollmentModel.findOneAndUpdate(
        { identifier },
        {
          //TODO: Find out if the teoria and pratica fields objectId are being populated
          teoria: resolveProfessors(enrollment.teoria, teachers),
          pratica: resolveProfessors(enrollment.pratica, teachers),
        },
        insertOpts,
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  return asyncParallelMap(
    data as EnrollmentDocument[],
    updateTeacherInEnrollments,
    10,
  );
}

export const updateTeachersQueue = createQueue('Update:TeachersEnrollments');

export const addTeachersToQueue = async (payload: { json: unknown }) => {
  await updateTeachersQueue.add('Update:TeachersEnrollments', payload);
};

export const updateTeachersWorker = async (
  job: { data: { json: unknown } },
  teacherModel: TeacherModel,
  enrollmentModel: EnrollmentModel,
) => {
  const { json } = job.data;
  await updateTeachers({ json }, teacherModel, enrollmentModel);
};
