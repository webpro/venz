import { clientOnly } from '@solidjs/start';
import Shell from '../components/Shell';
import { Title } from '@solidjs/meta';

const ConfigurationForm = clientOnly(() => import('../components/Config'));

export default function NewConfiguration() {
  return (
    <Shell>
      <Title>New Configuration | Venz</Title>
      <ConfigurationForm isNew={true} />
    </Shell>
  );
}
