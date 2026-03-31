import { useApi } from '../hooks/useApi';
import { CategoryPage } from './Music';
export default function News() {
  const { data, loading, error } = useApi('/api/trending?type=news');
  return <CategoryPage title="News" icon="" loading={loading} error={error} videos={data?.videos || []} accentColor="#e63946" />;
}
