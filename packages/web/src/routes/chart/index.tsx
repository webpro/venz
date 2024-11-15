import { useNavigate } from '@solidjs/router';

export default function ChartPage() {
  const navigate = useNavigate();
  return navigate('/', { replace: true });
}
