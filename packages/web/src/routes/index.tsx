import { clientOnly } from '@solidjs/start';
import { useLocation } from '@solidjs/router';
import { getVersion, readSpec, upgradeV1 } from '@venz/shared/spec';
import { Meta } from '@solidjs/meta';
import Shell from '../components/Shell';
import { cdnOrigin } from '../util/helpers';
import { useSetOgImage } from '../stores/og-image';

const Chart = clientOnly(() => import('../components/Chart'));

export default function ChartPage() {
  const location = useLocation();
  const setOgImage = useSetOgImage();

  const params = new URLSearchParams(location.search);
  const chromeless = readSpec(params).embed;
  const hasData = params.has('data');
  if (hasData) {
    const image = getVersion(params) === 1 ? upgradeV1(params) : new URLSearchParams(params);
    image.delete('embed');
    setOgImage(`${cdnOrigin}/i/chart.webp?pad=24&${image}`);
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
