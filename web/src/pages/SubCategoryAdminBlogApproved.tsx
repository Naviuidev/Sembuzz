import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminBlogApprovedPanel } from '../components/SubCategoryAdminBlogApprovedPanel';

export const SubCategoryAdminBlogApproved = () => (
  <SubCategoryAdminLayout>
    <h1 className="mb-4" style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e' }}>
      Blogs — approved
    </h1>
    <SubCategoryAdminBlogApprovedPanel />
  </SubCategoryAdminLayout>
);
