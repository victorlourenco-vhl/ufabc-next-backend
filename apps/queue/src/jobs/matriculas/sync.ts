import { logger } from '@next/common';
import { createQueue } from '@/helpers/queueUtil.js';
import type { Job } from 'bullmq';

type SyncFunction = (params: unknown) => Promise<void>;

async function syncMatricula(sync: SyncFunction) {
  try {
    // get every FUCKING thing
    // this will be a problem, cause it comes from the core
    await sync({ query: {} });
  } catch (error) {
    logger.error({ error, msg: 'Unknown error Syncing matrículas' });
    throw error;
  }
}

export const syncQueue = createQueue('Sync:Matriculas');

export const addSyncToQueue = async (payload: {
  json: Record<string, unknown>;
}) => {
  await syncQueue.add('Sync:Matriculas', payload);
};

export const syncWorker = async (job: Job<unknown>) => {
  const payload = job.data;
  try {
    await syncMatricula(payload);
  } catch (error) {
    logger.error({ error }, 'SyncWorker: Error Syncing');
    throw error;
  }
};
