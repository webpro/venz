import { clientOnly } from '@solidjs/start';
import Shell from '../../components/Shell';
import { Title } from '@solidjs/meta';

const ConfigurationForm = clientOnly(() => import('../../components/Config'));

export default function ConfigurationManager() {
  return (
    <Shell>
      <Title>Configurations | Venz</Title>
      <ConfigurationForm />
    </Shell>
  );
}
