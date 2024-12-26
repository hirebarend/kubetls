import * as acme from 'acme-client';
import { HttpChallenge } from 'acme-client/types/rfc8555';
import axios from 'axios';
import { Collection } from 'mongodb';
import { getContainer } from '../core';

export async function getAcmeClient(
  collection: Collection<{
    account: {
      key: string;
      url: string;
    };
    name: string;
  }>,
  name: string,
) {
  if (process.env.ACME_ACCOUNT_KEY && process.env.ACME_ACCOUNT_URL) {
    return new acme.Client({
      accountKey: atob(process.env.ACME_ACCOUNT_KEY),
      accountUrl: process.env.ACME_ACCOUNT_URL,
      backoffAttempts: 1,
      directoryUrl: acme.directory.letsencrypt.production,
    });
  }

  const document = await collection.findOne({ name });

  if (!document) {
    const emailAddress: string = process.env.ACME_EMAIL_ADDRESS || '';

    const accountKey: string = (await acme.crypto.createPrivateKey()).toString(
      'base64',
    );

    const client = new acme.Client({
      accountKey: atob(accountKey),
      backoffAttempts: 1,
      directoryUrl: acme.directory.letsencrypt.production,
    });

    await client.createAccount({
      contact: [`mailto:${emailAddress}`],
      termsOfServiceAgreed: true,
    });

    const accountUrl: string = client.getAccountUrl();

    await collection.insertOne({
      account: {
        key: accountKey,
        url: accountUrl,
      },
      name,
    });

    return new acme.Client({
      accountKey: atob(accountKey),
      accountUrl: accountUrl,
      backoffAttempts: 1,
      directoryUrl: acme.directory.letsencrypt.production,
    });
  }

  return new acme.Client({
    accountKey: atob(document.account.key),
    accountUrl: document.account.url,
    backoffAttempts: 1,
    directoryUrl: acme.directory.letsencrypt.production,
  });
}

export async function createOrder(fqdn: string): Promise<{
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
}> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('orders');

  const order: acme.Order = await container.acmeClient.createOrder({
    identifiers: [
      {
        type: 'dns',
        value: fqdn,
      },
    ],
  });

  const authorizations: Array<acme.Authorization> =
    await container.acmeClient.getAuthorizations(order);

  const authorization: acme.Authorization | null =
    authorizations.find((x) => x.identifier.type === 'dns') || null;

  if (!authorization) {
    throw new Error('unable to find authorization');
  }

  const challenge: HttpChallenge | undefined = authorization.challenges.find(
    (x) => x.type === 'http-01',
  );

  if (!challenge) {
    throw new Error('unable to find challenge');
  }

  const token: string =
    await container.acmeClient.getChallengeKeyAuthorization(challenge);

  await collection.insertOne({
    authorization: authorization.url,
    challenge: challenge.url,
    fqdn,
    order: order.url,
    token,
  });

  return {
    order,
    authorization,
    challenge,
    token,
  };
}

export async function findOrder(fqdn: string): Promise<{
  order: acme.Order;
  authorization: acme.Authorization;
  challenge: HttpChallenge;
  token: string;
} | null> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('orders');

  const document = await collection.findOne({
    fqdn,
  });

  if (!document) {
    return null;
  }

  return {
    order: (await axios.get<acme.Order>(document.order)).data,
    authorization: (await axios.get<acme.Authorization>(document.authorization))
      .data,
    challenge: (await axios.get<HttpChallenge>(document.challenge)).data,
    token: document.token,
  };
}

export async function findOrders(): Promise<
  Array<{
    order: acme.Order;
    authorization: acme.Authorization;
    challenge: HttpChallenge;
    token: string;
  }>
> {
  const container = await getContainer();

  const collection = container.db.collection<{
    fqdn: string;
    order: string;
    authorization: string;
    challenge: string;
    token: string;
  }>('orders');

  const documents = await collection.find({}).toArray();

  const orders = [];

  for (const document of documents) {
    orders.push({
      order: (await axios.get<acme.Order>(document.order)).data,
      authorization: (
        await axios.get<acme.Authorization>(document.authorization)
      ).data,
      challenge: (await axios.get<HttpChallenge>(document.challenge)).data,
      token: document.token,
    });
  }

  return orders;
}
