import { z } from 'zod';
import { Config } from '@/config/config.js';
import type { preValidationHookHandler } from 'fastify';

const accessKeySchema = z.string().min(6).max(12);

export const isAdminValidator: preValidationHookHandler = (
  request,
  _reply,
  done,
) => {
  const accessKey = accessKeySchema.parse(request.query);
  if (accessKey !== Config.ACCESS_KEY) {
    request.log.info({
      msg: 'Who was here',
      ip: request.ip,
      remoteIp: request.raw.socket.remoteAddress,
    });
    throw new Error('You should not be here');
  }
  done();
};
