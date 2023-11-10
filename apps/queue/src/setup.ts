import { logger } from '@next/common';
import gracefullyShutdown from 'close-with-grace';
import { createWorker } from './helpers/queueUtil.js';
import { sendEmailWorker } from './jobs/confirmationEmail/email.js';
import { updateEnrollmentsWorker } from './jobs/enrollments/updateEnrollments.js';
import { updateUserEnrollmentsWorker } from './jobs/enrollments/updateUserEnrollments.js';
import { syncWorker } from './jobs/matriculas/sync.js';

const emailWorker = createWorker('Send:Email', sendEmailWorker);
const enrollmentsWorker = createWorker(
  'Update:Enrollments',
  // @ts-expect-error
  updateEnrollmentsWorker,
);
const userEnrollmentsWorker = createWorker(
  'Update:UserEnrollments',
  updateUserEnrollmentsWorker,
);

const syncMatriculasWorker = createWorker('Sync:Matriculas', syncWorker, {
  concurrency: 50,
});

emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

enrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

userEnrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

syncMatriculasWorker.on('completed', (job) => {
  logger.info(`Job ${job.queueName} completed`);
});

gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    logger.fatal({ err }, 'error starting app');
  }
  logger.info({ signal }, 'Gracefully shutting down workers');

  await Promise.all([
    emailWorker.close(),
    enrollmentsWorker.close(),
    userEnrollmentsWorker.close(),
    syncMatriculasWorker.close(),
  ]);
});
