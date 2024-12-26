import * as acme from 'acme-client';

(async () => {
  const emailAddress: string = 'john.doe@example.com';

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

  console.log(accountUrl);

  console.log(accountKey);
})();
