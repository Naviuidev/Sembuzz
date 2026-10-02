import { useState, useMemo, type CSSProperties } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { School } from '../services/schools.service';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
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

export function SchoolInfoPanel() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;

  const [hoveredSchoolCard, setHoveredSchoolCard] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [selectedSchoolForEmail, setSelectedSchoolForEmail] = useState<School | null>(null);
  const [selectedEmailType, setSelectedEmailType] = useState('');
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.city.toLowerCase().includes(query) ||
        school.state?.toLowerCase().includes(query) ||
        school.refNum.toLowerCase().includes(query),
    );
  }, [schools, searchQuery]);

  const closeEmailModal = () => {
    setShowEmailPopup(false);
    setSelectedSchoolForEmail(null);
    setSelectedEmailType('');
  };

  const handleSchoolCardClick = (school: School) => {
    setSelectedSchoolForEmail(school);
    setSelectedEmailType('');
    setShowEmailPopup(true);
  };

  const sendEmailMutation = useMutation({
    mutationFn: ({ schoolId, emailType }: { schoolId: string; emailType: string }) =>
      schoolsService.sendEmail(schoolId, emailType),
    onSuccess: () => {
      setPopupType('success');
      setPopupMessage(`Email sent successfully to ${selectedSchoolForEmail?.admin?.email}`);
      setPopupShow(true);
      closeEmailModal();
    },
    onError: (error: unknown) => {
      setPopupType('error');
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setPopupMessage(msg || 'Failed to send email');
      setPopupShow(true);
    },
  });

  const handleSendEmail = () => {
    if (!selectedSchoolForEmail || !selectedEmailType) return;
    sendEmailMutation.mutate({
      schoolId: selectedSchoolForEmail.id,
      emailType: selectedEmailType,
    });
  };

  const emailOptions = [
    { value: 'complete_info', label: 'Send complete school info' },
    { value: 'features_selected', label: 'Send features selected' },
    { value: 'tenure_ends_soon', label: 'Send tenure ends soon intimation' },
    { value: 'refnum', label: 'Send reference number' },
  ];

  const getEmailPreview = () => {
    if (!selectedSchoolForEmail || !selectedEmailType) return null;

    switch (selectedEmailType) {
      case 'complete_info':
        return {
          subject: `Complete School Information - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            Location: `${selectedSchoolForEmail.city}${selectedSchoolForEmail.state ? `, ${selectedSchoolForEmail.state}` : ''}${selectedSchoolForEmail.country ? `, ${selectedSchoolForEmail.country}` : ''}`,
            Tenure: selectedSchoolForEmail.tenure ? `${selectedSchoolForEmail.tenure} months` : 'Not set',
            'School Admin': selectedSchoolForEmail.admin
              ? `${selectedSchoolForEmail.admin.name} (${selectedSchoolForEmail.admin.email})`
              : 'Not assigned',
            'Enabled Features':
              selectedSchoolForEmail.enabledFeatures.map((f) => f.name).join(', ') || 'None',
          },
        };
      case 'features_selected':
        return {
          subject: `Selected Features - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Enabled Features':
              selectedSchoolForEmail.enabledFeatures.map((f) => f.name).join(', ') || 'None',
          },
        };
      case 'tenure_ends_soon':
        return {
          subject: `Tenure Renewal Reminder - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Total Tenure': selectedSchoolForEmail.tenure
              ? `${selectedSchoolForEmail.tenure} months`
              : 'Not set',
            Message:
              'Your school tenure is ending soon. Please contact us to renew your tenure and continue enjoying our services.',
          },
        };
      case 'refnum':
        return {
          subject: `Reference Number - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            Message:
              'Please keep this reference number safe. You can use it to log in or for any support requests.',
          },
        };
      default:
        return null;
    }
  };

  const emailPreview = getEmailPreview();

  return (
    <>
      <section className="admin-panel" style={panelStyle}>
        <div className="admin-panel__body">
          <div className="mb-4">
            <AdminSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search schools by name, ref, city, or state…"
            />
          </div>

          {filteredSchools.length > 0 ? (
            <div className="row g-3">
              {filteredSchools.map((school) => (
                <div key={school.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div
                    className="admin-picker-card-wrap"
                    onMouseEnter={() => setHoveredSchoolCard(school)}
                    onMouseLeave={() => setHoveredSchoolCard(null)}
                  >
                    <button type="button" className="admin-picker-card" onClick={() => handleSchoolCardClick(school)}>
                      <p className="admin-picker-card__title">{school.name}</p>
                      <p className="admin-picker-card__meta">{school.refNum}</p>
                    </button>
                    {hoveredSchoolCard?.id === school.id ? (
                      <div className="admin-school-tooltip" role="tooltip">
                        <p className="admin-school-tooltip__title">{school.name}</p>
                        <p className="admin-school-tooltip__body">
                          {school.city}
                          {school.state ? `, ${school.state}` : ''}
                          {school.admin?.email ? (
                            <>
                              <br />
                              {school.admin.email}
                            </>
                          ) : null}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <p>{searchQuery ? 'No schools match your search.' : 'No schools available.'}</p>
            </div>
          )}
        </div>
      </section>

      {showEmailPopup && selectedSchoolForEmail ? (
        <div className="admin-modal-overlay" onClick={closeEmailModal} role="presentation">
          <div
            className="admin-modal admin-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" onClick={closeEmailModal} aria-label="Close">
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <h3 className="admin-modal__title pe-4">Send email · {selectedSchoolForEmail.name}</h3>

              <label className="admin-form-label" htmlFor="school-info-email-type">
                Email type
              </label>
              <select
                id="school-info-email-type"
                className="form-select mb-4"
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value)}
              >
                <option value="">Choose an option…</option>
                {emailOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {selectedEmailType && emailPreview ? (
                <div className="mb-4">
                  <p className="admin-form-label mb-2">Preview</p>
                  <div className="admin-email-preview">
                    <div className="admin-email-preview__row">
                      <span className="admin-email-preview__label">To:</span>
                      <span className="admin-email-preview__value">
                        {selectedSchoolForEmail.admin?.email || 'No admin email'}
                      </span>
                    </div>
                    <div className="admin-email-preview__row">
                      <span className="admin-email-preview__label">Subject:</span>
                      <span className="admin-email-preview__value">{emailPreview.subject}</span>
                    </div>
                    <div className="admin-email-preview__row">
                      <span className="admin-email-preview__label">Content</span>
                      <div className="admin-email-preview__content">
                        {Object.entries(emailPreview.content).map(([key, value]) => (
                          <div key={key} className="admin-email-preview__field">
                            <strong className="text-secondary">{key}</strong>
                            <div className="text-muted mt-1">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={closeEmailModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleSendEmail}
                  disabled={!selectedEmailType || sendEmailMutation.isPending}
                >
                  {sendEmailMutation.isPending ? 'Sending…' : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </>
  );
}

export const SchoolInfo = () => (
  <SuperAdminLayout>
    <header className="admin-page-header">
      <h1 className="admin-page-title">School information</h1>
      <p className="admin-page-subtitle">
        Select a school to send reference info, features, or tenure reminders to the School Admin.
      </p>
    </header>
    <SchoolInfoPanel />
  </SuperAdminLayout>
);
