import { getVersion, upgradeV1 } from '@venz/shared/spec';

/** Location of the v2 equivalent of a v1 image URL, which renders the same image (`undefined` for v2 URLs) */
export function getV1Redirect(url: URL): string | undefined {
  if (getVersion(url.searchParams) !== 1) return undefined;
  const params = upgradeV1(url.searchParams);
  params.delete('embed');
  return params.size > 0 ? `${url.pathname}?${params}` : url.pathname;
}
