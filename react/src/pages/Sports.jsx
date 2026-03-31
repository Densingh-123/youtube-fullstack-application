import { useApi } from '../hooks/useApi';
import { CategoryPage } from './Music';
export default function Sports() {
  const { data, loading, error } = useApi('/api/trending?type=sports');
  return <CategoryPage title="Sports" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#f77f00" />;
}
