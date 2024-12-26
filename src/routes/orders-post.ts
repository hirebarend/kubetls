import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createOrder } from '../core';

export const ORDERS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{ Body: { fqdn: string } }>,
    reply: FastifyReply,
  ) => {
    const order = await createOrder(request.body.fqdn);

    reply.status(200).send(order);
  },
  method: 'POST',
  url: '/api/v1/orders',
  schema: {
    body: {
      type: 'object',
      properties: {
        fqdn: {
          type: 'string',
        },
      },
    },
  },
};
