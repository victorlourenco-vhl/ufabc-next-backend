import { logger } from '@ufabcnext/common';
import { createQueue } from '@/helpers/queueUtil';
import { createToken } from '../../helpers/createToken';
import { Config } from '../../config/config';
import { sesSendEmail } from '../../integration/ses';
import type { Job } from 'bullmq';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  const emailTemplate = Config.EMAIL_CONFIRMATION_TEMPLATE;
  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
    body: {
      url: `${Config.WEB_URL}/confirm?token=${token}`,
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
