import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { SchoolAdminAllQueriesCard } from '../components/SchoolAdminAllQueriesCard';

export const SchoolAdminSettingsQueries = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <SchoolAdminAllQueriesCard standalone />
        </div>
      </div>
    </div>
  );
};
