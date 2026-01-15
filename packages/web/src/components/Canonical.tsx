import { Link } from '@solidjs/meta';
import { useLocation } from '@solidjs/router';
import { origin } from '../util/helpers';

export function Canonical() {
  const location = useLocation();
  const canonical = new URL(location.pathname, origin);
  return <Link rel="canonical" href={canonical.toString()} />;
}
