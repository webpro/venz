import { clientOnly } from '@solidjs/start';
import Shell from '../../components/Shell';

const ConfigurationForm = clientOnly(() => import('../../components/Config'));

export default function BenchmarkDetail() {
  return (
    <Shell>
      <ConfigurationForm />
    </Shell>
  );
}
