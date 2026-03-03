import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';

export const CategoryAdminCategory = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'normal',
              color: '#1a1f2e',
              marginBottom: '0.5rem'
            }}>
              Category Management
            </h1>
            <p style={{
              color: '#6c757d',
              fontSize: '1rem',
              marginBottom: 0
            }}>
              Manage your category and subcategories
            </p>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <div className="text-center py-5">
                <i className="bi bi-folder" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}></i>
                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>Category management will be implemented here</p>
                <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>This feature is coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
