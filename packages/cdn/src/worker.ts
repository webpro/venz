import { Container } from '@cloudflare/containers';
import type { DurableObjectNamespace, ExecutionContext } from '@cloudflare/workers-types';

export class CdnContainer extends Container {
  defaultPort = 8080;
  maxInstances = 1;
  sleepAfter = '2m';
}

interface Env {
  CDN_CONTAINER: DurableObjectNamespace;
}

const SINGLETON = 'cdn';

function getStub(env: Env) {
  const id = env.CDN_CONTAINER.idFromName(SINGLETON);
  return env.CDN_CONTAINER.get(id);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return getStub(env).fetch(request);
    }

    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) {
      const inm = request.headers.get('if-none-match');
      const etag = cached.headers.get('etag');
      if (inm && etag && inm === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etag,
            'Cache-Control': cached.headers.get('cache-control') ?? '',
          },
        });
      }
      return cached;
    }

    const response = await getStub(env).fetch(request);

    if (response.status === 200 && response.headers.get('cache-control')?.includes('max-age=')) {
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  },
};
