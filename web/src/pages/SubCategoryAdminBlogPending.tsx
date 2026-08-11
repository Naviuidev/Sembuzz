import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminBlogPendingPanel } from '../components/SubCategoryAdminBlogPendingPanel';

export const SubCategoryAdminBlogPending = () => (
  <SubCategoryAdminLayout>
    <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
      Blogs — pending approval
    </h1>
    <SubCategoryAdminBlogPendingPanel />
  </SubCategoryAdminLayout>
);
