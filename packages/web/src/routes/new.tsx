import { clientOnly } from '@solidjs/start';
import Shell from '../components/Shell';

const ConfigurationForm = clientOnly(() => import('../components/Config'));

export default function NewConfiguration() {
  return (
    <Shell>
      <ConfigurationForm isNew={true} />
    </Shell>
  );
}
