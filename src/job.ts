import * as acme from 'acme-client';
import { HttpChallenge } from 'acme-client/types/rfc8555';
import axios from 'axios';
import {
  disposeContainer,
  findOrders,
  getContainer,
  persistCertificateAndKey,
} from './core';

export async function job() {
  const orders = await findOrders();

  for (const order of orders) {
    await handle(order);
  }

  await disposeContainer();
}

export async function handle(order: {
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
}): Promise<void> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('orders');

  await container.acmeClient.completeChallenge(order.challenge);

  await new Promise((resolve) => setTimeout(resolve, 750));

  order.order = (await axios.get<acme.Order>(order.order.url)).data;

  if (order.order.status !== 'ready') {
    return;
  }

  const fqdn: string =
    order.order.identifiers.find((x) => x.type === 'dns')?.value || '';

  const [key, csr] = await acme.crypto.createCsr({
    altNames: [fqdn],
  });

  order.order = await container.acmeClient.finalizeOrder(order.order, csr);

  const certificate: string = await container.acmeClient.getCertificate(
    order.order,
  );

  await persistCertificateAndKey(fqdn, certificate, key);

  await collection.deleteOne({
    fqdn,
  });
}
