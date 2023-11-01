import { logger } from '@next/common';
import { asyncParallelMap } from '@/helpers/asyncParallelMap.js';
import { generateIdentifier } from '@/helpers/identifier.js';
import { createQueue } from '@/helpers/queueUtil.js';
import type {
  Enrollment,
  EnrollmentDocument,
  EnrollmentModel,
} from '@/types/models.js';

function updateEnrollments(
  payload: { json: EnrollmentDocument[] },
  enrollmentModel: EnrollmentModel,
) {
  const data = payload.json;
  // for the record: if it has an _id it is obligatory a Document
  const updateEnrollment = async (enrollment: EnrollmentDocument) => {
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
      const {
        ra,
        year,
        quad,
        disciplina,
        identifier: ignored,
        _id,
        ...updateData
      } = enrollment;
      // this piece of code right here is a MASSIVE query
      // for the record: since its inserting it needs to be a document and being a document means
      // it has and id
      await enrollmentModel.findOneAndUpdate(
        { identifier },
        { $set: updateData },
        insertOpts,
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  return asyncParallelMap(data, updateEnrollment, 10);
}

export const updateEnrollmentsQueue = createQueue('Update:Enrollments');

export const addEnrollmentsToQueue = async (payload: {
  json: Enrollment[];
}) => {
  await updateEnrollmentsQueue.add('Update:Enrollments', payload);
};

export const updateEnrollmentsWorker = async (
  job: {
    data: { json: EnrollmentDocument[] };
  },
  enrollmentModel: EnrollmentModel,
) => {
  const payload = job.data;
  try {
    await updateEnrollments(payload, enrollmentModel);
  } catch (error) {
    logger.error(
      { error },
      'updateEnrollmentsWorker: Error updating enrollments',
    );
    throw error;
  }
};
