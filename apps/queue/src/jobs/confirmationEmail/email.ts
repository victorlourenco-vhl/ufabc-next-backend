import { createToken } from '../../helpers/createToken';
import { Config } from '../../config/config';
import { sesSendEmail } from '../../integration/ses';
import { logger } from '@ufabcnext/common';
import type { Job } from 'bullmq';
import { createQueue } from '@/helpers/queueUtil';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  logger.info({ email: nextUser.email, ra: nextUser.ra }, 'sendConfirmation');
  const emailTemplate = Config.EMAIL_CONFIRMATION_TEMPLATE;
  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
    body: {
      //TODO: change this url to the real one
      url: `http://localhost:7500/confirm?token=${token}`,
    },
  };

  try {
    await sesSendEmail(nextUser, emailTemplate, emailRequest);
    return {
      dataId: `Returned value ${nextUser.ra}`,
      data: nextUser,
    };
  } catch (error) {
    logger.error({ error }, 'Error Sending email');
    throw error;
  }
}

export const emailQueue = createQueue('Send:Email');

export const addEmailToconfirmationQueue = async (user: UfabcUser) => {
  await emailQueue.add('Send:Email', user);
};

export const sendEmailWorker = async (job: Job<UfabcUser>) => {
  const user = job.data;

  try {
    const result = await sendConfirmationEmail(user);
    logger.info(`Email sent to ${result.data.ra}`);
  } catch (error) {
    logger.error({ error }, 'sendEmailWorker: Error sending email');
    throw error;
  }
};
