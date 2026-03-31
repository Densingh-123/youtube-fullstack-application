import { useApi } from '../hooks/useApi';
import { CategoryPage } from './Music';
export default function Films() {
  const { data, loading, error } = useApi('/api/trending?type=films');
  return <CategoryPage title="Films" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#7b2d8b" />;
}
