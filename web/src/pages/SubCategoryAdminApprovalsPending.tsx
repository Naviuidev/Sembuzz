import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminApprovalsPendingPanel } from '../components/SubCategoryAdminApprovalsPendingPanel';

export const SubCategoryAdminApprovalsPending = () => {
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
          Approvals pending
        </h1>
      </div>
      <SubCategoryAdminApprovalsPendingPanel />
    </SubCategoryAdminLayout>
  );
};
