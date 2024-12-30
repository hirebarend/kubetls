import * as acme from 'acme-client';
import { HttpChallenge } from 'acme-client/types/rfc8555';
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

  const fqdn: string =
    order.order.identifiers.find((x) => x.type === 'dns')?.value || '';

  const challenge = await container.acmeClient.completeChallenge(
    order.challenge,
  );

  if (challenge.status !== 'valid') {
    return;
  }

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
