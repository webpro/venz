import { Container, getContainer } from '@cloudflare/containers';

interface Env {
  CDN_CONTAINER: DurableObjectNamespace<CdnContainer>;
}

export class CdnContainer extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = '10m';

  override onStart() {
    console.log('CDN container started');
  }

  override onError(error: unknown) {
    console.error('CDN container error:', error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.CDN_CONTAINER);
    return container.fetch(request);
  },
};
