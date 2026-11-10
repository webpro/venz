import { createMiddleware } from '@solidjs/start/middleware';
import { getVersion, upgradeV1 } from '@venz/shared/spec';

// v1 chart page URLs moved permanently to their v2 equivalent, which renders the same chart
export default createMiddleware([
  event => {
    const { pathname, searchParams } = event.url;
    if ((pathname !== '/' && !pathname.startsWith('/chart/')) || getVersion(searchParams) !== 1) return;
    const params = upgradeV1(searchParams);
    const location = params.size > 0 ? `${pathname}?${params}` : pathname;
    return new Response(null, {
      status: 301,
      headers: { Location: location, 'Cache-Control': 'public, max-age=86400' },
    });
  },
]);
