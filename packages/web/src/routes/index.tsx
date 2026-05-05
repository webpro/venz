import { clientOnly } from '@solidjs/start';
import { useSearchParams, useLocation } from '@solidjs/router';
import { Meta } from '@solidjs/meta';
import Shell from '../components/Shell';
import { cdnOrigin } from '../util/helpers';
import { useSetOgImage } from '../stores/og-image';

const Chart = clientOnly(() => import('../components/Chart'));

export default function ChartPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const chromeless = searchParams.chrome === '0';
  const setOgImage = useSetOgImage();

  const params = new URLSearchParams(location.search);
  params.delete('chrome');
  const hasData = params.has('data');
  if (hasData) {
    setOgImage(`${cdnOrigin}/i/chart.webp?pad=24&${params}`);
  }

  if (chromeless) {
    return <Chart />;
  }

  return (
    <Shell>
      {hasData && (
        <>
          <Meta property="og:image:width" content="1200" />
          <Meta property="og:image:height" content="630" />
          <Meta property="og:image:type" content="image/webp" />
          <Meta name="twitter:card" content="summary_large_image" />
        </>
      )}
      <Chart />
    </Shell>
  );
}
