import { WEB_URL, WEB_URL_LOCAL, WEB_URL_STAGING } from '@next/constants';
import { createIfNotExists } from './query.js';
import type { Config } from '@/config/config.js';
import type { ProviderName, Providers } from '@next/types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type Querystring = {
  inApp: string;
  userId: string;
  env: Config['NODE_ENV'];
};

export async function handleOauth(
  this: FastifyInstance,
  provider: ProviderName,
  request: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply,
  providers: Providers,
) {
  const { inApp = '', userId = '', env = 'dev' } = request.query;
  const { token } =
    await this[provider].getAccessTokenFromAuthorizationCodeFlow(request);
  const oauthUser = await providers[provider].getUserDetails(token);
  const user = await createIfNotExists(oauthUser, userId);

  const productionURL = env === 'dev' ? WEB_URL_LOCAL : WEB_URL;
  const STAGING_URL = env === 'staging' ? WEB_URL_STAGING : WEB_URL;

  const baseUrl = env === 'staging' ? STAGING_URL : productionURL;
  // first key checks if user is in mobile
  const redirectBase =
    inApp.split('?')[0] === 'true' ? 'ufabcnext://login?' : `${baseUrl}/login?`;

  return reply.redirect(`${redirectBase}token=${user.generateJWT()}`);
}
