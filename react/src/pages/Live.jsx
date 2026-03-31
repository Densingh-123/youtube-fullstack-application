import { useApi } from '../hooks/useApi';
import { CategoryPage } from './Music';
export default function Live() {
  const { data, loading, error } = useApi('/api/trending?type=live');
  return <CategoryPage title="Live" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#ff0000" />;
}
