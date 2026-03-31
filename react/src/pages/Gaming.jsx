import { useApi } from '../hooks/useApi';
import { CategoryPage } from './Music';
export default function Gaming() {
  const { data, loading, error } = useApi('/api/trending?type=gaming');
  return <CategoryPage title="Gaming" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#00b4d8" />;
}
