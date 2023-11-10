import { sync } from './handlers/sync.js';
import { isAdminValidator } from './isAdmin.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function privateRoutes(app: FastifyInstance) {
  app.get<{ Querystring: string }>(
    '/matriculas/sync',
    { preValidation: [isAdminValidator] },
    sync,
  );
}
