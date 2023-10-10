import { logger } from '@ufabcnext/common';
import { createWorker } from './helpers/queueUtil';
import { sendEmailWorker } from './jobs/confirmationEmail/email';
import gracefullyShutdown from 'close-with-grace';
import { updateEnrollmentsWorker } from './jobs/enrollments/updateEnrollments';
import { updateUserEnrollmentsWorker } from './jobs/enrollments/updateUserEnrollments';

const emailWorker = createWorker('Email:Send', sendEmailWorker);
const enrollmentsWorker = createWorker(
  'Update:Enrollments',
  updateEnrollmentsWorker,
);
const userEnrollmentsWorker = createWorker(
  'Update:UserEnrollments',
  updateUserEnrollmentsWorker,
);

emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

enrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

userEnrollmentsWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
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
  ]);
});
