import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminMessageConfigPanel } from '../components/SubCategoryAdminMessageConfigPanel';

const TEXT_DARK = '#1a1f2e';

export const SubCategoryAdminPrivacy = () => {
  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: TEXT_DARK,
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          Privacy — Message config
        </h1>
        <p style={{ color: '#6c757d', fontSize: '1rem', margin: 0 }}>
          Request a group chat for a school club. Category and school admins will review your request.
        </p>
      </div>
      <SubCategoryAdminMessageConfigPanel />
    </SubCategoryAdminLayout>
  );
};
