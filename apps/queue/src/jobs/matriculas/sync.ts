import { ofetch } from 'ofetch';
import { logger } from '@next/common';
import { createQueue } from '@/helpers/queueUtil.js';
import type { JobsOptions } from 'bullmq';

async function syncMatricula() {
  try {
    const { access_key } = process.env;
    const syncTrigger = `http://localhost:5000/v2/private/matriculas/sync?operation=alunos_matriculados&access_key=${access_key}`;
    await ofetch(syncTrigger);
  } catch (error) {
    logger.error({ error, msg: 'Unknown error Syncing matrículas' });
    throw error;
  }
}

export const syncQueue = createQueue('Sync:Matriculas');

export const addSyncToQueue = async () => {
  const TWO_MINUTES = 1_000 * 120;
  const opts = {
    repeat: {
      every: TWO_MINUTES,
    },
  } satisfies JobsOptions;
  await syncQueue.add('Sync:Matriculas', 'nothing', opts);
};

export const syncWorker = async () => {
  try {
    await syncMatricula();
  } catch (error) {
    logger.error({ error }, 'SyncWorker: Error Syncing');
    throw error;
  }
};
