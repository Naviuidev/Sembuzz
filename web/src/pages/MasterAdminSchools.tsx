import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import { imageSrc } from '../utils/image';

function AdminSearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="admin-search-wrap admin-search-wrap--wide master-admin-schools-search">
      <i className="bi bi-search admin-search-icon" aria-hidden />
      <input
        type="search"
        className="form-control admin-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

export const MasterAdminSchools = () => {
  const navigate = useNavigate();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [searchQuery, setSearchQuery] = useState('');

  const { data: schools = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: masterAdminSchoolsService.list,
  });

  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => {
      const haystack = [s.name, s.refNum, s.city, s.state ?? ''].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [schools, searchQuery]);

  return (
    <MasterAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Schools</h1>
        <p className="admin-page-subtitle">All schools created from Super Admin. Pick one to manage next.</p>
      </header>

      <section className="admin-panel master-admin-schools-panel" style={panelStyle}>
        <div className="admin-panel__body">
          <div className="d-flex justify-content-center mb-4">
            <AdminSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by school name, ref, or location…"
            />
          </div>

          {isLoading ? (
            <div className="row g-3 justify-content-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="col-6 col-md-4 col-lg-3">
                  <div className="admin-picker-card master-admin-school-card master-admin-school-card--skeleton" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="admin-empty-state">
              <p>Could not load schools. Please try again.</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="admin-empty-state">
              <p>{searchQuery.trim() ? 'No schools match your search.' : 'No schools yet.'}</p>
            </div>
          ) : (
            <div className="row g-3 justify-content-center">
              {filteredSchools.map((school) => {
                const logoUrl = school.image ? imageSrc(school.image) : '';
                return (
                  <div key={school.id} className="col-6 col-md-4 col-lg-3 d-flex justify-content-center">
                    <button
                      type="button"
                      className={`admin-picker-card master-admin-school-card${school.isActive ? '' : ' master-admin-school-card--inactive'}`}
                      onClick={() => navigate(`/master-admin/schools/${school.id}`)}
                    >
                      <span className="master-admin-school-card__logo" aria-hidden>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <i className="bi bi-building" />
                        )}
                      </span>
                      <p className="admin-picker-card__title mb-0">{school.name}</p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MasterAdminLayout>
  );
};
