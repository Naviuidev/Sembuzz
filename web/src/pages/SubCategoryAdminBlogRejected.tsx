import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminBlogRejectedPanel } from '../components/SubCategoryAdminBlogRejectedPanel';

export const SubCategoryAdminBlogRejected = () => (
  <SubCategoryAdminLayout>
    <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
      Blogs — rejected
    </h1>
    <SubCategoryAdminBlogRejectedPanel />
  </SubCategoryAdminLayout>
);
