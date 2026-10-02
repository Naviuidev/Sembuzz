import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { CreateSchoolDto } from '../services/schools.service';
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

export const CreateSchool = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateSchoolDto>({
    schoolName: '',
    country: 'US', // Fixed to USA
    state: '',
    city: '',
    domain: '',
    image: undefined,
    selectedFeatures: [],
    adminEmail: '',
    adsAdminEmail: '',
    tenure: undefined,
    filtersVisibility: 'BOTH',
  });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: features, isLoading: featuresLoading, isError: featuresError } = useQuery({
    queryKey: ['features'],
    queryFn: schoolsService.getFeatures,
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    data: {
      message?: string;
      refNum: string;
      tempPassword: string;
      adminEmail: string;
      emailSent: boolean;
      emailError?: string;
      adsAdminEmail?: string;
      adsTempPassword?: string;
      adsEmailSent?: boolean;
      adsEmailError?: string;
    } | null;
  }>({
    isOpen: false,
    data: null,
  });

  const createMutation = useMutation({
    mutationFn: schoolsService.create,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      if (response.credentials) {
        setSuccessModal({
          isOpen: true,
          data: {
            message: response.message,
            refNum: response.credentials.refNum,
            tempPassword: response.credentials.tempPassword,
            adminEmail: response.credentials.adminEmail,
            emailSent: response.emailSent || false,
            emailError: response.emailError,
            adsAdminEmail: response.credentials.adsAdminEmail,
            adsTempPassword: response.credentials.adsTempPassword,
            adsEmailSent: response.credentials.adsEmailSent ?? response.credentials.adsAdminEmailSent,
            adsEmailError: response.credentials.adsEmailError ?? response.credentials.adsAdminEmailError,
          },
        });
      } else {
        navigate('/super-admin/dashboard');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create school. Please try again.';
      setErrorModal({ isOpen: true, message: errorMessage });
    },
  });

  const handleFeatureToggle = (featureCode: string) => {
    setFormData((prev) => {
      const removing = prev.selectedFeatures.includes(featureCode);
      const selectedFeatures = removing
        ? prev.selectedFeatures.filter((f) => f !== featureCode)
        : [...prev.selectedFeatures, featureCode];
      const next = { ...prev, selectedFeatures };
      if (featureCode === FILTERS_CODE) {
        if (removing) {
          next.filtersVisibility = undefined;
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

  const hasGroupMessaging = formData.selectedFeatures.includes(GROUP_MESSAGING_CODE);
  const hasIndividualMessaging = formData.selectedFeatures.includes(INDIVIDUAL_MESSAGING_CODE);
  const hasFilters = formData.selectedFeatures.includes(FILTERS_CODE);
  const hasAnyMessaging = hasGroupMessaging || hasIndividualMessaging || hasFilters;

  const renderFeatureCard = (feature: Feature) => {
    const selected = formData.selectedFeatures.includes(feature.code);
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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorModal({ isOpen: true, message: 'Please select a valid image file' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorModal({ isOpen: true, message: 'Image size must be less than 5MB' });
        return;
      }
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, image: base64String });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateDomainMatch = (): boolean => {
    if (!formData.domain || !formData.adminEmail) {
      return true; // Let other validations handle empty fields
    }
    const emailDomain = formData.adminEmail.split('@')[1];
    if (!emailDomain) {
      return false;
    }
    // Normalize school domain: strip leading @ and dots for comparison (e.g. @gmail.com or gmail.com → gmail.com)
    const normalizedSchoolDomain = (formData.domain || '').replace(/^@?\.?/, '').toLowerCase().trim();
    return emailDomain.toLowerCase().trim() === normalizedSchoolDomain;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.selectedFeatures.length === 0) {
      setErrorModal({ isOpen: true, message: 'Please select at least one feature' });
      return;
    }
    if (!formData.state) {
      setErrorModal({ isOpen: true, message: 'Please select a state' });
      return;
    }
    if (!formData.city) {
      setErrorModal({ isOpen: true, message: 'Please select a city' });
      return;
    }
    if (!formData.domain) {
      setErrorModal({ isOpen: true, message: 'Please enter a domain name' });
      return;
    }
    if (!formData.adminEmail) {
      setErrorModal({ isOpen: true, message: 'Please enter an admin email' });
      return;
    }
    if (formData.selectedFeatures.includes('ADS') && !formData.adsAdminEmail?.trim()) {
      setErrorModal({ isOpen: true, message: 'Please enter Ads Admin email when Ads feature is selected.' });
      return;
    }
    if (formData.selectedFeatures.includes(FILTERS_CODE) && !formData.filtersVisibility) {
      setErrorModal({
        isOpen: true,
        message: 'Please choose when filter options should appear (before login, after login, or both).',
      });
      return;
    }
    // Validate domain match
    if (!validateDomainMatch()) {
      const emailDomain = formData.adminEmail.split('@')[1] || 'invalid';
      setErrorModal({
        isOpen: true,
        message: `Admin email domain (${emailDomain}) must match the school domain (${formData.domain})`,
      });
      return;
    }
    // Send adsAdminEmail only when ADS is selected (backend requires it only in that case)
    const payload: CreateSchoolDto = {
      ...formData,
      adsAdminEmail: formData.selectedFeatures.includes('ADS') ? (formData.adsAdminEmail?.trim() || undefined) : undefined,
      filtersVisibility: formData.selectedFeatures.includes(FILTERS_CODE)
        ? formData.filtersVisibility
        : undefined,
    };
    createMutation.mutate(payload);
  };

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const closeSuccess = () => {
    setSuccessModal({ isOpen: false, data: null });
    navigate('/super-admin/dashboard');
  };

  return (
    <SuperAdminLayout>
      {successModal.isOpen && successModal.data ? (
        <div className="admin-modal-overlay" onClick={closeSuccess} role="presentation">
          <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h3 className="admin-modal__title">School created successfully</h3>
              </div>
              {successModal.data.message ? (
                <p className="admin-modal__text">{successModal.data.message}</p>
              ) : null}

              {!successModal.data.emailSent ? (
                <div className="alert alert-warning mb-3 rounded-3">
                  <i className="bi bi-exclamation-triangle me-2" aria-hidden />
                  <strong>Email not sent:</strong> {successModal.data.emailError || 'SMTP configuration issue'}
                  <br />
                  <small>Save the credentials below and send them manually to the admin.</small>
                </div>
              ) : null}

              <div className="admin-credential-field">
                <strong>Reference number</strong>
                <div className="admin-credential-value">{successModal.data.refNum}</div>
              </div>

              {!successModal.data.adsEmailSent && successModal.data.adsEmailError && successModal.data.adsAdminEmail ? (
                <div className="alert alert-warning mb-3 rounded-3">
                  <i className="bi bi-exclamation-triangle me-2" aria-hidden />
                  <strong>Ads Admin email not sent:</strong> {successModal.data.adsEmailError}
                </div>
              ) : null}

              <div className={successModal.data.adsAdminEmail ? 'row g-3' : ''}>
                <div className={successModal.data.adsAdminEmail ? 'col-md-6' : 'col-12'}>
                  <div className="admin-credential-block">
                    <h4>School Admin</h4>
                    <div className="admin-credential-box">
                      <div className="admin-credential-field">
                        <strong>School Admin email</strong>
                        <div className="admin-credential-value">{successModal.data.adminEmail}</div>
                      </div>
                      <div className="admin-credential-field">
                        <strong>Temporary password</strong>
                        <div className="admin-credential-value admin-credential-value--secret">
                          {successModal.data.tempPassword}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {successModal.data.adsAdminEmail ? (
                  <div className="col-md-6">
                    <div className="admin-credential-block">
                      <h4>Ads Admin</h4>
                      <div className="admin-credential-box">
                        <div className="admin-credential-field">
                          <strong>Ads Admin email</strong>
                          <div className="admin-credential-value">{successModal.data.adsAdminEmail}</div>
                        </div>
                        <div className="admin-credential-field">
                          <strong>Temporary password</strong>
                          <div className="admin-credential-value admin-credential-value--secret">
                            {successModal.data.adsTempPassword ?? '—'}
                          </div>
                        </div>
                        <small className="admin-form-hint d-block mt-2">
                          Ads Admin can log in at /ads-admin/login to manage banner and sponsored ads.
                        </small>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={closeSuccess}>
                  Go to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {errorModal.isOpen ? (
        <div
          className="admin-modal-overlay"
          onClick={() => setErrorModal({ isOpen: false, message: '' })}
          role="presentation"
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div className="admin-modal__body">
              <div className="admin-modal__head">
                <i className="bi bi-exclamation-triangle-fill admin-modal__icon admin-modal__icon--error" aria-hidden />
                <h3 className="admin-modal__title">Could not create school</h3>
              </div>
              <p className="admin-modal__text">{errorModal.message}</p>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => setErrorModal({ isOpen: false, message: '' })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <header className="admin-page-header">
        <h1 className="admin-page-title">Create new school</h1>
        <p className="admin-page-subtitle">
          Add a school, choose features, and invite the School Admin (and Ads Admin if needed).
        </p>
      </header>

      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__header">
          <h2 className="admin-panel__title">School setup</h2>
        </div>
        <div className="admin-panel__body">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-section">
              <h3 className="admin-form-section-title">School information</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="create-school-name">
                    School name *
                  </label>
                  <input
                    id="create-school-name"
                    type="text"
                    className="form-control"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="Greenwood High School"
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="create-school-country">
                    Country
                  </label>
                  <input
                    id="create-school-country"
                    type="text"
                    className="form-control"
                    value="United States"
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="create-school-state">
                    State *
                  </label>
                  <select
                    id="create-school-state"
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
                  <label className="admin-form-label" htmlFor="create-school-city">
                    City *
                  </label>
                  <select
                    id="create-school-city"
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
                  <label className="admin-form-label" htmlFor="create-school-domain">
                    Domain name *
                  </label>
                  <input
                    id="create-school-domain"
                    type="text"
                    className="form-control"
                    required
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g., school.edu"
                  />
                  <small className="admin-form-hint">Must match the domain of the admin email.</small>
                </div>
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="create-school-tenure">
                    Tenure of project (months)
                  </label>
                  <input
                    id="create-school-tenure"
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
                <div className="col-12">
                  <label className="admin-form-label" htmlFor="create-school-image">
                    School image
                  </label>
                  <input
                    id="create-school-image"
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <small className="admin-form-hint">Max 5MB. JPG, PNG, or GIF.</small>
                  {imagePreview ? (
                    <div className="admin-image-preview">
                      <img src={imagePreview} alt="School preview" />
                      <button
                        type="button"
                        className="admin-btn-danger-soft"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, image: undefined });
                        }}
                      >
                        Remove image
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section-title">Select features *</h3>
              {featuresLoading ? (
                <p className="admin-form-section-lead mb-0">Loading features…</p>
              ) : null}
              {featuresError ? (
                <p className="admin-form-hint admin-form-hint--error">
                  Unable to load features. Make sure the backend is running and refresh the page.
                </p>
              ) : null}
              {!featuresLoading && !featuresError && (!features || features.length === 0) ? (
                <p className="admin-form-section-lead mb-0">
                  No features available. Run the feature seed on the backend (npm run prisma:seed).
                </p>
              ) : null}

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
                        <strong>Filters</strong> — Category and feed filter controls on web and mobile based
                        on the visibility option below.
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
                          name="filtersVisibility"
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

              {formData.selectedFeatures.length === 0 ? (
                <p className="admin-form-hint admin-form-hint--error mt-2 mb-0">
                  Please select at least one feature.
                </p>
              ) : null}
            </div>

            <div className="admin-form-section">
              <h3 className="admin-form-section-title">School Admin information</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="admin-form-label" htmlFor="create-school-admin-email">
                    School Admin email *
                  </label>
                  <input
                    id="create-school-admin-email"
                    type="email"
                    className={`form-control${
                      formData.domain && formData.adminEmail && !validateDomainMatch() ? ' is-invalid' : ''
                    }`}
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@school.edu"
                  />
                  <small className="admin-form-hint">
                    Reference number is auto-generated. A temporary password is emailed and shown after
                    creation.
                  </small>
                  {formData.domain && formData.adminEmail && !validateDomainMatch() ? (
                    <small className="admin-form-hint admin-form-hint--error">
                      Email domain must match the school domain ({formData.domain}).
                    </small>
                  ) : null}
                </div>
              </div>
            </div>

            {formData.selectedFeatures.includes('ADS') ? (
              <div className="admin-form-section">
                <h3 className="admin-form-section-title">Ads Admin information</h3>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="admin-form-label" htmlFor="create-ads-admin-email">
                      Ads Admin email *
                    </label>
                    <input
                      id="create-ads-admin-email"
                      type="email"
                      className="form-control"
                      value={formData.adsAdminEmail ?? ''}
                      onChange={(e) => setFormData({ ...formData, adsAdminEmail: e.target.value })}
                      placeholder="ads@school.edu"
                    />
                    <small className="admin-form-hint">
                      Manages banner and sponsored ads. Temporary password is emailed and shown after
                      creation.
                    </small>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="admin-form-actions">
              <button type="button" className="admin-btn-secondary" onClick={() => navigate('/super-admin/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create school'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </SuperAdminLayout>
  );
};
