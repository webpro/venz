import { clientOnly } from '@solidjs/start';
import Shell from '../components/Shell';

const Chart = clientOnly(() => import('../components/Chart'));

export default function ChartPage() {
  return (
    <Shell>
      <Chart />
    </Shell>
  );
}
