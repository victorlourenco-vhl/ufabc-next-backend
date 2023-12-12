import { logger } from '@next/common';
import { UfabcUser } from '../sign-up-schema.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function raUpdate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = request.user;

    const { ra } = UfabcUser.parse(request.body);
    if (!user) {
      throw new Error('User not found');
    }

    user.set({ ra });
    logger.info({ ra }, 'Successfully update RA');

    await user.save();
    return reply.send(user);
  } catch (error: unknown) {
    request.log.error({ error }, 'Error saving user RA');
    throw error;
  }
}
