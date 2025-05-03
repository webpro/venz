import { clientOnly } from '@solidjs/start';
import Shell from '../../components/Shell';

const ConfigurationForm = clientOnly(() => import('../../components/Config'));

export default function ConfigurationManager() {
  return (
    <Shell>
      <ConfigurationForm />
    </Shell>
  );
}
