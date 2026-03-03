import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { schoolAdminStudentsService, type SchoolStudent } from '../services/school-admin-students.service';
import { categoryAdminsService, type CategoryAdmin } from '../services/category-admins.service';
import {
  schoolAdminSubcategoryAdminsService,
  type SchoolAdminSubCategoryAdmin,
} from '../services/school-admin-subcategory-admins.service';

const cardStyle = {
  border: '1px solid #dee2e6',
  borderRadius: '0px',
  backgroundColor: 'white',
  overflow: 'hidden' as const,
};

type ActiveSection = 'students' | 'category' | 'subcategory' | null;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

export const SchoolAdminTotalUsers = () => {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [categoryAdmins, setCategoryAdmins] = useState<CategoryAdmin[]>([]);
  const [subcategoryAdmins, setSubcategoryAdmins] = useState<SchoolAdminSubCategoryAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      schoolAdminStudentsService.getApproved().then((a) => a),
      schoolAdminStudentsService.getAutomated().then((a) => a),
      categoryAdminsService.getAll(),
      schoolAdminSubcategoryAdminsService.getAll(),
    ])
      .then(([approved, automated, catAdmins, subAdmins]) => {
        setStudents([...approved, ...automated]);
        setCategoryAdmins(catAdmins);
        setSubcategoryAdmins(subAdmins);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message || (typeof err?.message === 'string' ? err.message : 'Failed to load.');
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleBanStudent = async (s: SchoolStudent) => {
    setActioningId(s.id);
    try {
      await schoolAdminStudentsService.ban(s.id);
      setStudents((prev) => prev.map((u) => (u.id === s.id ? { ...u, status: 'banned' } : u)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to ban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  const handleUnbanStudent = async (s: SchoolStudent) => {
    setActioningId(s.id);
    try {
      await schoolAdminStudentsService.unban(s.id);
      setStudents((prev) => prev.map((u) => (u.id === s.id ? { ...u, status: 'active' } : u)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to unban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  const handleBanCategoryAdmin = async (a: CategoryAdmin) => {
    setActioningId(a.id);
    try {
      await categoryAdminsService.ban(a.id);
      setCategoryAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: false } : x)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to ban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  const handleUnbanCategoryAdmin = async (a: CategoryAdmin) => {
    setActioningId(a.id);
    try {
      await categoryAdminsService.unban(a.id);
      setCategoryAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: true } : x)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to unban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  const handleBanSubcategoryAdmin = async (a: SchoolAdminSubCategoryAdmin) => {
    setActioningId(a.id);
    try {
      await schoolAdminSubcategoryAdminsService.ban(a.id);
      setSubcategoryAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: false } : x)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to ban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  const handleUnbanSubcategoryAdmin = async (a: SchoolAdminSubCategoryAdmin) => {
    setActioningId(a.id);
    try {
      await schoolAdminSubcategoryAdminsService.unban(a.id);
      setSubcategoryAdmins((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: true } : x)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to unban.';
      setError(msg);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Total users
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Students and admins in your school. Ban an admin to revoke their admin access.
            </p>
          </div>

          {/* Summary count cards - same flow as Edit School: click card → cards hide, data shows with Back to List */}
          {!activeSection && (
            <div className="row g-3 justify-content-center mb-4">
              <div className="col-md-3 col-sm-6">
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    border: '1px solid rgb(26, 31, 46)',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: '0.3s',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setActiveSection('students')}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSection('students')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Total students
                  </span>
                  <span style={{ color: '#1a1f2e', fontWeight: '700', fontSize: '1.5rem' }}>
                    {loading ? '—' : students.length}
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    border: '1px solid rgb(26, 31, 46)',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: '0.3s',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setActiveSection('category')}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSection('category')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Category admins
                  </span>
                  <span style={{ color: '#1a1f2e', fontWeight: '700', fontSize: '1.5rem' }}>
                    {loading ? '—' : categoryAdmins.length}
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    border: '1px solid rgb(26, 31, 46)',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: '0.3s',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => setActiveSection('subcategory')}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSection('subcategory')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <span style={{ color: '#1a1f2e', fontWeight: '500', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Subcategory admins
                  </span>
                  <span style={{ color: '#1a1f2e', fontWeight: '700', fontSize: '1.5rem' }}>
                    {loading ? '—' : subcategoryAdmins.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-4" style={{ borderRadius: '0px' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" />
              <p className="mt-2 mb-0 text-muted">Loading…</p>
            </div>
          ) : activeSection === 'students' ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  Total students / users
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Back to List
                </button>
              </div>
              <div className="card border-0 shadow-sm" style={cardStyle}>
                <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                  <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1f2e' }}>
                    <i className="bi bi-people me-2" />
                    Total students / users
                  </h5>
                  <span className="badge bg-secondary rounded-pill">{students.length}</span>
                </div>
              <div className="card-body p-0">
                {students.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No students yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {students.map((s) => (
                      <li
                        key={s.id}
                        className="list-group-item d-flex align-items-center justify-content-between flex-wrap gap-2"
                        style={{ borderLeft: 'none', borderRight: 'none' }}
                      >
                        <div>
                          <span style={{ fontWeight: '500' }}>{s.name || s.email}</span>
                          <span className="text-muted small ms-2">{s.email}</span>
                          <span className="text-muted small ms-2">· {formatDate(s.createdAt)}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {s.status === 'banned' && (
                            <span className="badge bg-danger">Banned</span>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              borderRadius: '50px',
                              padding: '0.35rem 0.75rem',
                              fontWeight: '500',
                              ...(s.status === 'banned'
                                ? { backgroundColor: '#e7f5ec', color: '#198754', border: '1px solid #198754' }
                                : { backgroundColor: '#fff5f5', color: '#dc3545', border: '1px solid #dc3545' }),
                            }}
                            disabled={actioningId === s.id}
                            onClick={() => (s.status === 'banned' ? handleUnbanStudent(s) : handleBanStudent(s))}
                          >
                            {actioningId === s.id ? '…' : s.status === 'banned' ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </>
          ) : activeSection === 'category' ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  Category admins
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Back to List
                </button>
              </div>
              <div className="card border-0 shadow-sm" style={cardStyle}>
                <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                  <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1f2e' }}>
                    <i className="bi bi-person-badge me-2" />
                    Category admins
                  </h5>
                  <span className="badge bg-secondary rounded-pill">{categoryAdmins.length}</span>
                </div>
              <div className="card-body p-0">
                {categoryAdmins.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No category admins yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {categoryAdmins.map((a) => (
                      <li
                        key={a.id}
                        className="list-group-item d-flex align-items-center justify-content-between flex-wrap gap-2"
                        style={{ borderLeft: 'none', borderRight: 'none' }}
                      >
                        <div>
                          <span style={{ fontWeight: '500' }}>{a.name}</span>
                          <span className="text-muted small ms-2">{a.email}</span>
                          <span className="text-muted small ms-2">
                            · {a.category?.name ?? '—'} · {formatDate(a.createdAt)}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {!a.isActive && <span className="badge bg-danger">Banned</span>}
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              borderRadius: '50px',
                              padding: '0.35rem 0.75rem',
                              fontWeight: '500',
                              ...(a.isActive
                                ? { backgroundColor: '#fff5f5', color: '#dc3545', border: '1px solid #dc3545' }
                                : { backgroundColor: '#e7f5ec', color: '#198754', border: '1px solid #198754' }),
                            }}
                            disabled={actioningId === a.id}
                            onClick={() =>
                              a.isActive ? handleBanCategoryAdmin(a) : handleUnbanCategoryAdmin(a)
                            }
                          >
                            {actioningId === a.id ? '…' : a.isActive ? 'Ban' : 'Unban'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </>
          ) : activeSection === 'subcategory' ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                  Subcategory admins
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1rem',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Back to List
                </button>
              </div>
              <div className="card border-0 shadow-sm" style={cardStyle}>
                <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3">
                  <h5 className="mb-0" style={{ fontWeight: '600', color: '#1a1f2e' }}>
                    <i className="bi bi-person-gear me-2" />
                    Subcategory admins
                  </h5>
                  <span className="badge bg-secondary rounded-pill">{subcategoryAdmins.length}</span>
                </div>
              <div className="card-body p-0">
                {subcategoryAdmins.length === 0 ? (
                  <p className="text-muted small mb-0 p-3">No subcategory admins yet.</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {subcategoryAdmins.map((a) => (
                      <li
                        key={a.id}
                        className="list-group-item d-flex align-items-center justify-content-between flex-wrap gap-2"
                        style={{ borderLeft: 'none', borderRight: 'none' }}
                      >
                        <div>
                          <span style={{ fontWeight: '500' }}>{a.name}</span>
                          <span className="text-muted small ms-2">{a.email}</span>
                          <span className="text-muted small ms-2">
                            · {a.category?.name ?? '—'} / {a.subCategory?.name ?? '—'} · {formatDate(a.createdAt)}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {!a.isActive && <span className="badge bg-danger">Banned</span>}
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              borderRadius: '50px',
                              padding: '0.35rem 0.75rem',
                              fontWeight: '500',
                              ...(a.isActive
                                ? { backgroundColor: '#fff5f5', color: '#dc3545', border: '1px solid #dc3545' }
                                : { backgroundColor: '#e7f5ec', color: '#198754', border: '1px solid #198754' }),
                            }}
                            disabled={actioningId === a.id}
                            onClick={() =>
                              a.isActive
                                ? handleBanSubcategoryAdmin(a)
                                : handleUnbanSubcategoryAdmin(a)
                            }
                          >
                            {actioningId === a.id ? '…' : a.isActive ? 'Ban' : 'Unban'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
