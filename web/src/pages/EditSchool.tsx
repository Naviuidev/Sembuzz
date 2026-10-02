import { useState, useEffect, useMemo, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { UpdateSchoolDto } from '../services/schools.service';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { US_STATES, US_CITIES_BY_STATE } from '../data/countries-states';
import {
  FILTERS_CODE,
  FILTERS_VISIBILITY_OPTIONS,
  GROUP_MESSAGING_CODE,
  INDIVIDUAL_MESSAGING_CODE,
  MESSAGING_FEATURE_CODES,
  type MessagingFeatureCode,
  type FiltersVisibility,
} from '../constants/messagingFeatures';
import type { Feature } from '../services/schools.service';
import { StatusPopup } from '../components/StatusPopup';

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
    <div className="admin-search-wrap">
      <i className="bi bi-search admin-search-icon" aria-hidden />
      <input
        type="search"
        className="form-control admin-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SchoolPickerCard({ onClick, title, meta }: { onClick: () => void; title: string; meta?: ReactNode }) {
  return (
    <button type="button" className="admin-picker-card" onClick={onClick}>
      <p className="admin-picker-card__title">{title}</p>
      {meta ? <p className="admin-picker-card__meta">{meta}</p> : null}
    </button>
  );
}

type EditSchoolPanelProps = {
  /** When embedded in the dashboard hub, cancel returns to the schools tab. */
  onCancel?: () => void;
};

export function EditSchoolPanel({ onCancel }: EditSchoolPanelProps = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<UpdateSchoolDto>({
    schoolName: '',
    country: 'US',
    state: '',
    city: '',
    selectedFeatures: [],
    adminEmail: '',
    tenure: undefined,
    filtersVisibility: undefined,
  });
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.refNum.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

  const { data: school, isLoading: isLoadingSchool } = useQuery({
    queryKey: ['school', selectedSchoolId],
    queryFn: () => schoolsService.getById(selectedSchoolId),
    enabled: !!selectedSchoolId,
  });

  const { data: features } = useQuery({
    queryKey: ['features'],
    queryFn: schoolsService.getFeatures,
  });

  // Populate form when school is selected
  useEffect(() => {
    if (school) {
      setFormData({
        schoolName: school.name,
        country: school.country || 'US',
        state: school.state || '',
        city: school.city,
        selectedFeatures: school.enabledFeatures.map((f) => f.code),
        adminEmail: school.admin?.email || '',
        tenure: school.tenure,
        filtersVisibility: school.filtersVisibility ?? undefined,
      });
    }
  }, [school]);

  const handleStateChange = (state: string) => {
    setFormData((prev) => ({
      ...prev,
      state,
      city: '', // Clear city when state changes
    }));
  };

  const availableCities = formData.state 
    ? US_CITIES_BY_STATE[formData.state] || []
    : [];

  const handleFeatureToggle = (featureCode: string) => {
    setFormData((prev) => {
      const list = prev.selectedFeatures ?? [];
      const removing = list.includes(featureCode);
      const selectedFeatures = removing ? list.filter((f) => f !== featureCode) : [...list, featureCode];
      const next = { ...prev, selectedFeatures };
      if (featureCode === FILTERS_CODE) {
        if (removing) {
          next.filtersVisibility = null;
        } else if (!next.filtersVisibility) {
          next.filtersVisibility = 'BOTH';
        }
      }
      return next;
    });
  };

  const platformFeatures =
    features?.filter(
      (f) => !MESSAGING_FEATURE_CODES.includes(f.code as (typeof MESSAGING_FEATURE_CODES)[number]),
    ) ?? [];
  const messagingFeatures =
    features
      ?.filter((f) => MESSAGING_FEATURE_CODES.includes(f.code as MessagingFeatureCode))
      .sort(
        (a, b) =>
          MESSAGING_FEATURE_CODES.indexOf(a.code as MessagingFeatureCode) -
          MESSAGING_FEATURE_CODES.indexOf(b.code as MessagingFeatureCode),
      ) ?? [];

  const hasGroupMessaging = formData.selectedFeatures?.includes(GROUP_MESSAGING_CODE) ?? false;
  const hasIndividualMessaging =
    formData.selectedFeatures?.includes(INDIVIDUAL_MESSAGING_CODE) ?? false;
  const hasFilters = formData.selectedFeatures?.includes(FILTERS_CODE) ?? false;
  const hasAnyMessaging = hasGroupMessaging || hasIndividualMessaging || hasFilters;

  const renderFeatureCard = (feature: Feature) => {
    const selected = formData.selectedFeatures?.includes(feature.code) ?? false;
    return (
      <div key={feature.id} className="col-md-4 col-sm-6">
        <div
          className={`admin-feature-card form-check${selected ? ' is-selected' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => handleFeatureToggle(feature.code)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFeatureToggle(feature.code);
            }
          }}
        >
          <input
            type="checkbox"
            className="form-check-input"
            checked={selected}
            onChange={() => handleFeatureToggle(feature.code)}
            onClick={(e) => e.stopPropagation()}
          />
          <label className="form-check-label">{feature.name}</label>
        </div>
      </div>
    );
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => schoolsService.update(selectedSchoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', selectedSchoolId] });
      setPopupType('success');
      setPopupMessage('School updated successfully!');
      setPopupShow(true);
    },
    onError: (error: any) => {
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to update school');
      setPopupShow(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => schoolsService.delete(selectedSchoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setShowDeleteConfirm(false);
      setPopupType('success');
      setPopupMessage('School deleted successfully!');
      setPopupShow(true);
      setSelectedSchoolId('');
      setFormData({
        schoolName: '',
        country: 'US',
        state: '',
        city: '',
        selectedFeatures: [],
        adminEmail: '',
        tenure: undefined,
      });
    },
    onError: (error: any) => {
      setShowDeleteConfirm(false);
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to delete school');
      setPopupShow(true);
    },
  });

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const resetSelection = () => {
    setSelectedSchoolId('');
    setFormData({
      schoolName: '',
      country: 'US',
      state: '',
      city: '',
      selectedFeatures: [],
      adminEmail: '',
      tenure: undefined,
      filtersVisibility: undefined,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      alert('Please select a school to edit');
      return;
    }
    if (formData.selectedFeatures?.length === 0) {
      alert('Please select at least one feature');
      return;
    }
    if (!formData.state) {
      alert('Please select a state');
      return;
    }
    if (!formData.city) {
      alert('Please select a city');
      return;
    }
    if (formData.selectedFeatures?.includes(FILTERS_CODE) && !formData.filtersVisibility) {
      alert('Please choose when filter options should appear (before login, after login, or both).');
      return;
    }
    const payload: UpdateSchoolDto = {
      ...formData,
      filtersVisibility: formData.selectedFeatures?.includes(FILTERS_CODE)
        ? formData.filtersVisibility ?? 'BOTH'
        : null,
    };
    updateMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (!selectedSchoolId) {
      alert('Please select a school to delete');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    navigate('/super-admin/dashboard');
  };

  return (
    <>
      <section className="admin-panel" style={panelStyle}>
        {!selectedSchoolId ? (
          <div className="admin-panel__body">
            <div className="mb-4">
              <AdminSearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search schools by name or ref number…"
              />
            </div>
            {filteredSchools.length > 0 ? (
              <div className="row g-3">
                {filteredSchools.map((s) => (
                  <div key={s.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <SchoolPickerCard
                      title={s.name}
                      meta={s.refNum ? `Ref: ${s.refNum}` : undefined}
                      onClick={() => setSelectedSchoolId(s.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">
                <p>{searchQuery ? 'No schools match your search.' : 'No schools available.'}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">{school?.name ?? 'Edit school'}</h2>
              <button type="button" className="admin-btn-secondary" onClick={resetSelection}>
                <i className="bi bi-arrow-left me-2" aria-hidden />
                Back to list
              </button>
            </div>
            <div className="admin-panel__body">
              <form className="admin-form" onSubmit={handleSubmit}>
                {isLoadingSchool ? (
                  <div className="admin-loading-state">Loading school data…</div>
                ) : (
                  <>
                    <div className="admin-form-section">
                      <h3 className="admin-form-section-title">School information</h3>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-school-name">
                            School name *
                          </label>
                          <input
                            id="edit-school-name"
                            type="text"
                            className="form-control"
                            required
                            value={formData.schoolName}
                            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                            placeholder="Greenwood High School"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-school-country">
                            Country
                          </label>
                          <input
                            id="edit-school-country"
                            type="text"
                            className="form-control"
                            value="United States"
                            disabled
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-school-state">
                            State *
                          </label>
                          <select
                            id="edit-school-state"
                            className="form-select"
                            required
                            value={formData.state}
                            onChange={(e) => handleStateChange(e.target.value)}
                          >
                            <option value="">Select state</option>
                            {US_STATES.map((state) => (
                              <option key={state.code} value={state.code}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-school-city">
                            City *
                          </label>
                          <select
                            id="edit-school-city"
                            className="form-select"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            disabled={!formData.state}
                          >
                            <option value="">{formData.state ? 'Select city' : 'Select state first'}</option>
                            {availableCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-school-tenure">
                            Tenure of project (months)
                          </label>
                          <input
                            id="edit-school-tenure"
                            type="number"
                            className="form-control"
                            min={1}
                            value={formData.tenure ?? ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                tenure: e.target.value ? parseInt(e.target.value, 10) : undefined,
                              })
                            }
                            placeholder="e.g., 12"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-section">
                      <h3 className="admin-form-section-title">Select features *</h3>
                      {platformFeatures.length > 0 ? (
                        <>
                          <p className="admin-form-section-lead">Platform features</p>
                          <div className="row g-3 mb-3">{platformFeatures.map(renderFeatureCard)}</div>
                        </>
                      ) : null}
                      {messagingFeatures.length > 0 ? (
                        <>
                          <p className="admin-form-section-lead d-flex align-items-center gap-2">
                            <i className="bi bi-chat-dots" aria-hidden />
                            Messaging options
                          </p>
                          <div className="row g-3">{messagingFeatures.map(renderFeatureCard)}</div>
                        </>
                      ) : null}
                      {hasAnyMessaging ? (
                        <div className="admin-form-callout">
                          <strong>Messaging pipeline for this school</strong>
                          <ul>
                            {hasGroupMessaging ? (
                              <li>
                                <strong>Group messages</strong> — School Admin can create club/group chats.
                              </li>
                            ) : null}
                            {hasIndividualMessaging ? (
                              <li>
                                <strong>Individual messages</strong> — School Admin can allow personal student
                                chats.
                              </li>
                            ) : null}
                            {hasFilters ? (
                              <li>
                                <strong>Filters</strong> — Category and feed filter controls based on the
                                visibility option below.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      ) : null}
                      {hasFilters ? (
                        <div className="mt-3 pt-3 border-top border-light-subtle">
                          <p className="admin-form-section-lead">When should filter options appear?</p>
                          <div className="admin-form-radio-group">
                            {FILTERS_VISIBILITY_OPTIONS.map((opt) => (
                              <label key={opt.value} className="admin-form-radio">
                                <input
                                  type="radio"
                                  name="filtersVisibilityEdit"
                                  className="form-check-input mt-1"
                                  checked={formData.filtersVisibility === opt.value}
                                  onChange={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      filtersVisibility: opt.value as FiltersVisibility,
                                    }))
                                  }
                                />
                                <span>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {formData.selectedFeatures?.length === 0 ? (
                        <p className="admin-form-hint admin-form-hint--error mt-2 mb-0">
                          Please select at least one feature.
                        </p>
                      ) : null}
                    </div>

                    <div className="admin-form-section">
                      <h3 className="admin-form-section-title">School Admin information</h3>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="admin-form-label" htmlFor="edit-admin-email">
                            Admin email *
                          </label>
                          <input
                            id="edit-admin-email"
                            type="email"
                            className="form-control"
                            required
                            value={formData.adminEmail}
                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                            placeholder="admin@school.edu"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-form-actions admin-form-actions--between">
                      <button
                        type="button"
                        className="admin-btn-danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting…' : 'Delete school'}
                      </button>
                      <div className="admin-form-actions__group">
                        <button type="button" className="admin-btn-secondary" onClick={handleCancel}>
                          Cancel
                        </button>
                        <button type="submit" className="admin-btn-primary" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? 'Updating…' : 'Save changes'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </>
        )}
      </section>

      {showDeleteConfirm ? (
        <div
          className="admin-modal-overlay"
          onClick={() => !deleteMutation.isPending && setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div
            className="admin-modal admin-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Delete school?</h3>
              {deleteMutation.isPending ? (
                <div className="admin-loading-state py-4">
                  <span className="spinner-border spinner-border-sm text-danger me-2" role="status" />
                  Deleting school and all related data…
                </div>
              ) : (
                <>
                  <p className="admin-modal__text">
                    Are you sure you want to delete <strong>{school?.name}</strong>? This cannot be undone.
                  </p>
                  <p className="admin-form-hint">The following will be permanently removed:</p>
                  <ul className="admin-form-hint mb-3">
                    <li>School Admin and Ads Admin accounts</li>
                    <li>Posts, ads, categories, and subcategories</li>
                    <li>All admins and data linked to this school</li>
                  </ul>
                  <div className="admin-modal__footer">
                    <button type="button" className="admin-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="admin-btn-danger" onClick={confirmDelete}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </>
  );
}

export const EditSchool = () => (
  <SuperAdminLayout>
    <header className="admin-page-header">
      <h1 className="admin-page-title">Edit school</h1>
      <p className="admin-page-subtitle">Search and select a school to edit details, features, and admin email.</p>
    </header>
    <EditSchoolPanel />
  </SuperAdminLayout>
);
