import * as kubernetesClient from '@kubernetes/client-node';

export const KUBE_CONFIG = new kubernetesClient.KubeConfig();

KUBE_CONFIG.loadFromDefault();

export const APP_PREFIX = 'kubetls';

export const KUBERNETES_CLIENT_CORE_V1_API = KUBE_CONFIG.makeApiClient(
  kubernetesClient.CoreV1Api,
);
