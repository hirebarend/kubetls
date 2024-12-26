import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { findOrder, getContainer } from '../core';

export const WELL_KNOWN_ACME_CHALLENGE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const order = await findOrder(request.headers.host || '');

    if (!order) {
      reply.status(404).send({
        fqdn: request.headers.host,
        message: 'unable to find certificate signing request',
      });

      return;
    }

    const challengeKeyAuthorization: string =
      await container.acmeClient.getChallengeKeyAuthorization(order.challenge);

    reply.status(200).send(challengeKeyAuthorization);
  },
  method: 'GET',
  url: '/.well-known/acme-challenge/:token',
  schema: {
    params: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
        },
      },
    },
  },
};
