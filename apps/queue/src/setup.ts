import { logger } from '@ufabcnext/common';
import { createWorker } from './helpers/queueUtil';
import { sendEmailWorker } from './jobs/confirmationEmail/email';
import gracefullyShutdown from 'close-with-grace';

const emailWorker = createWorker('Email:Send', sendEmailWorker);

emailWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed`);
});

gracefullyShutdown({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    logger.fatal({ err }, 'error starting app');
  }
  logger.info({ signal }, 'Gracefully shutting down workers');
  await emailWorker.close();
});
