import { Container, getRandom } from '@cloudflare/containers';
import type { DurableObjectNamespace } from '@cloudflare/workers-types';

const INSTANCE_COUNT = 1;

export class CdnContainer extends Container {
  defaultPort = 8080;
  maxInstances = INSTANCE_COUNT;
  sleepAfter = '10m';
}

interface Env {
  CDN_CONTAINER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = await getRandom(env.CDN_CONTAINER, INSTANCE_COUNT);
    return await container.fetch(request);
  },
};
