import { clientOnly } from '@solidjs/start';
import Shell from '../components/Shell';

const Commands = clientOnly(() => import('../components/Chart'));

export default function ChartPage() {
  return (
    <Shell>
      <Commands />
    </Shell>
  );
}
