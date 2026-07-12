import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { SchoolAdminAllQueriesCard } from '../components/SchoolAdminAllQueriesCard';

export const SchoolAdminSettingsQueries = () => {
  return (
    <div className="admin-shell" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="admin-shell-body">
        <SchoolAdminSidebar />
        <div className="admin-main">
          <SchoolAdminAllQueriesCard standalone />
        </div>
      </div>
    </div>
  );
};
