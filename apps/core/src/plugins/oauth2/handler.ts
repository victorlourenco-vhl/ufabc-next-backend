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
  // default state is dev
  const { env = '', userId } = request.query;
  const { token } =
    await this[provider].getAccessTokenFromAuthorizationCodeFlow(request);

  const oauthUser = await providers[provider].getUserDetails(token);
  const user = await createIfNotExists(oauthUser, userId);

  const productionURL = env === 'prod' ? WEB_URL : WEB_URL_LOCAL;
  const stagingURL = env === 'staging' ? WEB_URL_STAGING : WEB_URL;
  const baseURL = env === 'staging' ? stagingURL : productionURL;

  return reply.redirect(`${baseURL}/login?token=${user.generateJWT()}`);
}
