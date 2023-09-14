import { asyncParallelMap } from '@/helpers/asyncParallelMap';
import { generateIdentifier } from '@/helpers/identifier';
import { createQueue } from '@/helpers/queueUtil';
import { logger } from '@ufabcnext/common';
import { EnrollmentModel } from '@ufabcnext/models';
import { type Enrollment } from '@ufabcnext/types';
import * as _ from 'lodash';

async function updateEnrollments(payload: { json: Enrollment[] }) {
  //this happens because in the legacy code, the payload is an object
  //with a json property, and the json property is an array of something that I don't know
  const data = payload.json;
  //TODO: discover if doc is and Enrollment with or without an _id property (Enrollment || Enrollment & { _id: Types.ObjectId })
  const updateEnroll = async (doc: Enrollment) => {
    const keys = ['ra', 'year', 'quad', 'disciplina'];

    const key = {
      ra: doc.ra,
      year: doc.year,
      quad: doc.quad,
      disciplina: doc.disciplina,
    };

    const identifier = generateIdentifier(key, keys);

    try {
      await EnrollmentModel.findOneAndUpdate(
        {
          identifier: identifier,
        },
        //I'm using lodash here because the legacy code implies that Enrollment comes with an _id or id property
        //and I haven't found out if this is just a precaution or if it's really necessary
        //TODO: discover if this is necessary
        _.omit(doc, ['identifier', 'id', '_id']),
        {
          new: true,
          upsert: true,
        },
      );
    } catch (error) {
      logger.error(error);
    }
  };

  return asyncParallelMap(data, updateEnroll, 10);
}

export const updateEnrollmentsQueue = createQueue('Update:Enrollments');

export const addEnrollmentsToQueue = async (payload: {
  json: Enrollment[];
}) => {
  await updateEnrollmentsQueue.add('Update:Enrollments', payload);
};

export const updateEnrollmentsWorker = async (job: {
  data: { json: Enrollment[] };
}) => {
  const payload = job.data;
  try {
    await updateEnrollments(payload);
  } catch (error) {
    logger.error(
      { error },
      'updateEnrollmentsWorker: Error updating enrollments',
    );
    throw error;
  }
};
