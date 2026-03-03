import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { CategoryAdminNavbar } from '../components/CategoryAdminNavbar';
import { CategoryAdminSidebar } from '../components/CategoryAdminSidebar';
import { categoryAdminCategoriesService } from '../services/category-admin-categories.service';
import { subCategoryAdminsService, type SubCategoryAdmin } from '../services/subcategory-admins.service';

/** Subcategories this admin has access to (primary + many-to-many) */
function getSubCategoryNames(admin: SubCategoryAdmin): string[] {
  const names: string[] = [];
  if (admin.subCategory?.name) names.push(admin.subCategory.name);
  if (admin.subCategories?.length) {
    admin.subCategories.forEach((sc) => {
      if (sc.subCategory?.name && !names.includes(sc.subCategory.name)) {
        names.push(sc.subCategory.name);
      }
    });
  }
  return names;
}

export const CategoryAdminDashboard = () => {
  const { user, token } = useCategoryAdminAuth();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['category-admin-categories', user?.id],
    queryFn: async () => {
      try {
        const list = await categoryAdminCategoriesService.getMyCategories();
        if (list && list.length > 0) return list;
      } catch {
        // ignore: fall back to primary
      }
      const primary = await categoryAdminCategoriesService.getMyCategory();
      return primary ? [primary] : [];
    },
    enabled: !!user?.categoryId,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const { data: subCategoryAdmins = [], isLoading: adminsLoading, error: adminsError } = useQuery({
    queryKey: ['category-admin', 'subcategory-admins', user?.id],
    queryFn: () => subCategoryAdminsService.getAll(),
    enabled: !!token,
  });
  const subcategoryCount = categories.reduce((sum, cat) => sum + (cat.subcategories?.length ?? 0), 0);
  const allSubcategories = categories.flatMap((cat) => (cat.subcategories ?? []).map((sc) => ({ ...sc, categoryName: cat.name })));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <CategoryAdminNavbar />
      <div className="d-flex">
        <CategoryAdminSidebar />
        <div style={{ flex: 1, padding: '2rem', minHeight: 'calc(100vh - 60px)' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '0.5rem'
          }}>
            Dashboard
          </h1>
          <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: '2rem' }}>
            Overview of your category and subcategory admins you have given access to.
          </p>

          {/* 1. Categories you're associated with (all assigned by school admin) */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '1rem'
              }}>
                Categories you are associated with
              </h2>
              {categoriesLoading ? (
                <p style={{ color: '#6c757d', margin: 0 }}>Loading…</p>
              ) : categories.length === 0 ? (
                <p style={{ color: '#6c757d', margin: 0 }}>{user?.categoryName ?? '—'}</p>
              ) : (
                <div className="row g-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="col-12 col-md-6 col-lg-4">
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '0px',
                        border: '1px solid #eee',
                      }}>
                        <p style={{ color: '#1a1f2e', fontWeight: '600', margin: 0, fontSize: '1rem' }}>{cat.name}</p>
                        <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                          {cat.school?.name ?? user?.schoolName ?? '—'}
                        </p>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-2">
                            {cat.subcategories.map((sc) => (
                              <span
                                key={sc.id}
                                className="badge bg-secondary"
                                style={{ borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                {sc.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Subcategories across all your categories */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '1rem'
              }}>
                Subcategories
              </h2>
              {categoriesLoading ? (
                <p style={{ color: '#6c757d', margin: 0 }}>Loading…</p>
              ) : (
                <>
                  <p style={{ color: '#1a1f2e', marginBottom: '1rem' }}>
                    There are <strong>{subcategoryCount}</strong> subcategor{subcategoryCount === 1 ? 'y' : 'ies'} across your {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}.
                  </p>
                  {allSubcategories.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {allSubcategories.map((sc) => (
                        <span
                          key={sc.id}
                          className="badge bg-secondary"
                          style={{ borderRadius: '4px', padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          {sc.name}
                          {'categoryName' in sc && sc.categoryName && (
                            <span style={{ opacity: 0.85, marginLeft: '0.25rem' }}> ({sc.categoryName})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 3. Subcategory admins you've given access to – table */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '0.5rem'
              }}>
                Subcategory admins you have given access to
              </h2>
              <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                People who have access to post and manage content for subcategories under your category.
              </p>
              {adminsError && (
                <div className="alert alert-warning mb-3" style={{ borderRadius: '0px' }}>
                  {(adminsError as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (adminsError as Error).message}
                </div>
              )}
              {adminsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-secondary" role="status" />
                  <p className="mt-2 mb-0" style={{ color: '#6c757d' }}>Loading…</p>
                </div>
              ) : subCategoryAdmins.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-people" style={{ fontSize: '2.5rem', color: '#6c757d', marginBottom: '0.5rem' }} />
                  <p style={{ color: '#6c757d', margin: 0 }}>No subcategory admins yet.</p>
                  <Link to="/category-admin/privacy" className="btn btn-primary btn-sm mt-2" style={{ borderRadius: '0px' }}>
                    Add subcategory admin
                  </Link>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                          <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Name</th>
                          <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Email</th>
                          <th style={{ color: '#1a1f2e', fontWeight: '600', padding: '1rem', backgroundColor: '#f8f9fa' }}>Subcategories they have access to</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subCategoryAdmins.map((admin) => {
                          const subNames = getSubCategoryNames(admin);
                          return (
                            <tr key={admin.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                              <td style={{ padding: '1rem', verticalAlign: 'middle', color: '#1a1f2e' }}>{admin.name}</td>
                              <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{admin.email}</td>
                              <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                                {subNames.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {subNames.map((name) => (
                                      <span
                                        key={name}
                                        className="badge bg-light text-dark border"
                                        style={{ borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Link
                    to="/category-admin/privacy"
                    className="btn btn-outline-secondary btn-sm mt-3"
                    style={{ borderRadius: '0px' }}
                  >
                    Manage subcategory admins
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '1rem'
              }}>
                Quick actions
              </h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <Link
                    to="/category-admin/pending-approvals"
                    className="card border-0 shadow-sm text-decoration-none"
                    style={{ borderRadius: '0px', transition: 'all 0.3s', backgroundColor: 'white' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-clock-history" style={{ fontSize: '1.5rem', color: '#1a1f2e', marginRight: '1rem' }} />
                        <div>
                          <h3 style={{ color: '#1a1f2e', fontSize: '1.1rem', margin: 0 }}>Pending approvals</h3>
                          <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: 0 }}>Review posts from subcategory admins</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link
                    to="/category-admin/queries"
                    className="card border-0 shadow-sm text-decoration-none"
                    style={{ borderRadius: '0px', transition: 'all 0.3s', backgroundColor: 'white' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-chat-left-text" style={{ fontSize: '1.5rem', color: '#1a1f2e', marginRight: '1rem' }} />
                        <div>
                          <h3 style={{ color: '#1a1f2e', fontSize: '1.1rem', margin: 0 }}>Queries</h3>
                          <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: 0 }}>View and respond to queries</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
