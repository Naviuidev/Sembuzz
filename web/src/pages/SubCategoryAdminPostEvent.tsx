import { Navigate, useSearchParams } from 'react-router-dom';

/** @deprecated Use `/subcategory-admin/posts` */
export const SubCategoryAdminPostEvent = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const next = tab ? `/subcategory-admin/posts?tab=${encodeURIComponent(tab)}` : '/subcategory-admin/posts';
  return <Navigate to={next} replace />;
};
