import { currentQuad, logger } from '@next/common';
import { createQueue } from '@/helpers/queueUtil.js';
import type { DisciplinaModel } from '@/types/models.js';
import type { Job, JobsOptions } from 'bullmq';

type SyncParams = {
  enrollmentId: string;
  enrollment: Record<string, number[]>;
  DisciplinaModel?: DisciplinaModel;
};

async function syncMatricula({
  enrollmentId,
  enrollment,
  DisciplinaModel,
}: SyncParams) {
  try {
    const season = currentQuad();
    await DisciplinaModel!.findOneAndUpdate(
      {
        disciplina_id: enrollmentId,
        season,
      },
      { ['alunos_matriculados']: enrollment[enrollmentId] },
      { upsert: true, new: true },
    );
  } catch (error) {
    logger.error({ error, msg: 'Unknown error Syncing matrículas' });
    throw error;
  }
}

export const syncQueue = createQueue('Sync:Matriculas');

export const addSyncToQueue = async (payload: SyncParams) => {
  const TWO_MINUTES = 1_000 * 120;
  const opts = {
    repeat: {
      every: TWO_MINUTES,
    },
  } satisfies JobsOptions;
  await syncQueue.add('Sync:Matriculas', payload, opts);
};

export const syncWorker = async (job: Job<SyncParams>) => {
  try {
    const { enrollment, enrollmentId, DisciplinaModel } = job.data;
    await syncMatricula({ enrollment, enrollmentId, DisciplinaModel });
  } catch (error) {
    logger.error({ error }, 'SyncWorker: Error Syncing');
    throw error;
  }
};
