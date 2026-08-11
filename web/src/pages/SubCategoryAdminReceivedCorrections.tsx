import { useNavigate } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminReceivedCorrectionsPanel } from '../components/SubCategoryAdminReceivedCorrectionsPanel';
import type { RevertedEvent } from '../services/subcategory-admin-events.service';

export const SubCategoryAdminReceivedCorrections = () => {
  const navigate = useNavigate();

  const handleMakeCorrections = (event: RevertedEvent) => {
    navigate('/subcategory-admin/post-event', { state: { resubmitEvent: event } });
  };

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
          Received corrections
        </h1>
      </div>
      <SubCategoryAdminReceivedCorrectionsPanel onMakeCorrections={handleMakeCorrections} />
    </SubCategoryAdminLayout>
  );
};
