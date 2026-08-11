import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminApprovedPanel } from '../components/SubCategoryAdminApprovedPanel';

export const SubCategoryAdminApproved = () => {
  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '0.5rem',
          }}
        >
          Approved
        </h1>
      </div>
      <SubCategoryAdminApprovedPanel />
    </SubCategoryAdminLayout>
  );
};
