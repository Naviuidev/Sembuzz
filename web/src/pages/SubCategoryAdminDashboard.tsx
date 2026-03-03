import { useEffect } from 'react';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';

export const SubCategoryAdminDashboard = () => {
  const { user, refreshUser } = useSubCategoryAdminAuth();

  // Refresh user data when component mounts to get latest subcategories
  useEffect(() => {
    const refresh = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };
    refresh();
  }, [refreshUser]);

  // Get categories with subcategories (from new structure or fallback to old)
  const categoriesData = user?.categoriesWithSubcategories && user.categoriesWithSubcategories.length > 0
    ? user.categoriesWithSubcategories
    : (user?.categoryName ? [{
        id: user.categoryId,
        name: user.categoryName,
        subcategories: user.subCategories && user.subCategories.length > 0
          ? user.subCategories.map(sc => ({ id: sc.id, name: sc.name }))
          : [{ id: user.subCategoryId, name: user.subCategoryName }],
      }] : []);

  return (
    <SubCategoryAdminLayout>
      {/* Welcome Section */}
      <div className="mb-4 d-flex justify-content-between align-items-start">
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '0.5rem'
          }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{
            color: '#6c757d',
            fontSize: '1rem',
            marginBottom: 0
          }}>
            Manage your categories and subcategories
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await refreshUser();
            } catch (error) {
              console.error('Failed to refresh:', error);
            }
          }}
          className="btn"
          style={{
            backgroundColor: '#1a1f2e',
            border: 'none',
            borderRadius: '50px',
            padding: '0.5rem 1.5rem',
            color: '#fff',
            fontWeight: '500',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2d3748';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1f2e';
          }}
          title="Refresh to see latest subcategories"
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Categories and Subcategories Table */}
      <div className="card" style={{ borderRadius: '0px' }}>
        <div className="card-body">
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '1.5rem'
          }}>
            Categories & Subcategories Access
          </h2>
          
          {categoriesData.length > 0 ? (
            <div className="table-responsive">
              <table className="table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ 
                      color: '#1a1f2e', 
                      fontWeight: '600', 
                      padding: '1rem',
                      borderBottom: '2px solid #dee2e6',
                      backgroundColor: '#f8f9fa'
                    }}>
                      Category
                    </th>
                    <th style={{ 
                      color: '#1a1f2e', 
                      fontWeight: '600', 
                      padding: '1rem',
                      borderBottom: '2px solid #dee2e6',
                      backgroundColor: '#f8f9fa'
                    }}>
                      Subcategories
                    </th>
                    <th style={{ 
                      color: '#1a1f2e', 
                      fontWeight: '600', 
                      padding: '1rem',
                      borderBottom: '2px solid #dee2e6',
                      backgroundColor: '#f8f9fa'
                    }}>
                      Category Admin
                    </th>
                    <th style={{ 
                      color: '#1a1f2e', 
                      fontWeight: '600', 
                      padding: '1rem',
                      borderBottom: '2px solid #dee2e6',
                      backgroundColor: '#f8f9fa'
                    }}>
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesData.map((category) => (
                    <tr key={category.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ 
                        padding: '1rem',
                        verticalAlign: 'middle',
                        fontWeight: '500',
                        color: '#1a1f2e'
                      }}>
                        {category.name}
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        {category.subcategories.length > 0 ? (
                          <div>
                            {category.subcategories.map((subcategory) => (
                              <span
                                key={subcategory.id}
                                style={{
                                  display: 'inline-block',
                                  backgroundColor: '#e9ecef',
                                  color: '#1a1f2e',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  marginRight: '0.5rem',
                                  marginBottom: '0.25rem'
                                }}
                              >
                                {subcategory.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No subcategories</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        verticalAlign: 'middle',
                        color: '#1a1f2e'
                      }}>
                        {user?.categoryAdmin?.name || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '1rem',
                        verticalAlign: 'middle',
                        color: '#6c757d'
                      }}>
                        {user?.categoryAdmin?.email || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#6c757d'
            }}>
              <i className="bi bi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
              <p style={{ margin: 0 }}>No categories or subcategories assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </SubCategoryAdminLayout>
  );
};
