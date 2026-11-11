import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import { masterAdminQueriesService } from '../services/master-admin-queries.service';
import {
  SupportRequestType,
  MeetingType,
  TimeZone,
  type SupportRequestDto,
} from '../services/support.service';
import type {
  CategoryAdminQueryItem,
  RaisedToSuperAdminQueryItem,
  SubCategoryAdminQueryItem,
} from '../services/school-admin-queries.service';

const SUPPORT_HERO_IMAGE =
  'https://media.istockphoto.com/id/1469792786/vector/customer-support-3d-illustration-personal-assistant-service-person-advisor-and-helpful.jpg?s=612x612&w=0&k=20&c=1pq_S8sYDPF6bFz2H74QCuKRzsNfR7wcAFKJ4yQ06Y0=';

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
];

const HUB_OPTIONS = [
  {
    id: 'all' as const,
    title: 'All queries',
    description: 'Every query received for this school (category, subcategory, and school channels).',
    icon: 'bi-inboxes',
  },
  {
    id: 'raise' as const,
    title: 'Raise a query',
    description: 'Contact the developer for bugs, features, UI changes, or schedule a meeting.',
    icon: 'bi-envelope-paper',
  },
];

const REQUEST_OPTIONS: { type: SupportRequestType; label: string }[] = [
  { type: SupportRequestType.RAISE_ISSUE, label: 'Raise an Issue with the Software' },
  { type: SupportRequestType.INTEGRATE_FEATURE, label: 'Needs to Integrate New Feature' },
  { type: SupportRequestType.UI_CHANGE, label: 'UI Change Request' },
  { type: SupportRequestType.UPSCALE_PLATFORM, label: 'Upscale the Platform' },
  { type: SupportRequestType.CUSTOM_MESSAGE, label: 'Custom Message' },
  { type: SupportRequestType.SCHEDULE_MEETING, label: 'Schedule Meeting' },
];

type HubMode = (typeof HUB_OPTIONS)[number]['id'];
type InboxSource = 'category_admin' | 'subcategory_admin' | 'super_admin';

type QueryRow =
  | (CategoryAdminQueryItem & { _source: 'category_admin' })
  | (SubCategoryAdminQueryItem & { _source: 'subcategory_admin' })
  | (RaisedToSuperAdminQueryItem & { _source: 'super_admin' });

const typeLabel: Record<string, string> = {
  custom_message: 'Custom message',
  schedule_meeting: 'Schedule a meeting',
};

const channelLabel: Record<InboxSource, string> = {
  category_admin: 'Category admin → School',
  subcategory_admin: 'Subcategory admin → School',
  super_admin: 'School → Super Admin',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function supportTypeLabel(type: SupportRequestType): string {
  return REQUEST_OPTIONS.find((o) => o.type === type)?.label ?? 'Support request';
}

export function MasterAdminRaiseRequestPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [schoolId, setSchoolId] = useState(() => searchParams.get('schoolId')?.trim() ?? '');
  const [hubMode, setHubMode] = useState<HubMode | null>(null);
  const [viewQuery, setViewQuery] = useState<QueryRow | null>(null);
  const [replyQuery, setReplyQuery] = useState<QueryRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [selectedSupportType, setSelectedSupportType] = useState<SupportRequestType | null>(null);
  const [description, setDescription] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [timeZone, setTimeZone] = useState<TimeZone | null>(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchool = schoolOptions.find((s) => s.id === schoolId);

  const { data: inbox, isLoading: inboxLoading } = useQuery({
    queryKey: ['master-admin', 'queries', schoolId],
    queryFn: () => masterAdminQueriesService.listInbox(schoolId),
    enabled: Boolean(schoolId),
  });

  const allRows = useMemo((): QueryRow[] => {
    const rows: QueryRow[] = [
      ...(inbox?.fromCategoryAdmins ?? []).map((q) => ({ ...q, _source: 'category_admin' as const })),
      ...(inbox?.fromSubCategoryAdmins ?? []).map((q) => ({ ...q, _source: 'subcategory_admin' as const })),
      ...(inbox?.toSuperAdmin ?? []).map((q) => ({ ...q, _source: 'super_admin' as const })),
    ];
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inbox]);

  const resetSupportForm = () => {
    setSelectedSupportType(null);
    setDescription('');
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setFormError(null);
  };

  const closeSupportPanel = () => {
    setShowSupportPanel(false);
    resetSupportForm();
  };

  const handleSchoolChange = (id: string) => {
    setSchoolId(id);
    setHubMode(null);
    setViewQuery(null);
    closeSupportPanel();
  };

  useEffect(() => {
    const fromUrl = searchParams.get('schoolId')?.trim();
    if (fromUrl && fromUrl !== schoolId) {
      handleSchoolChange(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL school only
  }, [searchParams]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!replyQuery || !schoolId || !replyMessage.trim()) throw new Error('Missing reply');
      if (replyQuery._source === 'category_admin') {
        return masterAdminQueriesService.replyToCategoryAdmin(schoolId, replyQuery.id, replyMessage.trim());
      }
      if (replyQuery._source === 'subcategory_admin') {
        return masterAdminQueriesService.replyToSubcategoryAdmin(schoolId, replyQuery.id, replyMessage.trim());
      }
      throw new Error('Cannot reply to this query type here');
    },
    onSuccess: () => {
      setReplyQuery(null);
      setReplyMessage('');
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'queries', schoolId] });
    },
  });

  const sendDeveloperMutation = useMutation({
    mutationFn: (data: SupportRequestDto) => masterAdminQueriesService.sendDeveloperRequest(schoolId, data),
    onSuccess: (data: { message?: string; meetingLink?: string }) => {
      setPopupType('success');
      setPopupMessage(
        data?.meetingLink
          ? 'Meeting scheduled! Developer will receive the details by email.'
          : 'Support request sent successfully! Developer will get in touch with you shortly.',
      );
      setPopupShow(true);
      closeSupportPanel();
    },
    onError: (error: unknown) => {
      setPopupType('error');
      setPopupMessage(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to send support request.',
      );
      setPopupShow(true);
    },
  });

  const needsDescription =
    selectedSupportType === SupportRequestType.RAISE_ISSUE ||
    selectedSupportType === SupportRequestType.UI_CHANGE ||
    selectedSupportType === SupportRequestType.UPSCALE_PLATFORM;

  const isSubmitDisabled =
    sendDeveloperMutation.isPending ||
    !selectedSupportType ||
    (selectedSupportType === SupportRequestType.RAISE_ISSUE && !description) ||
    (selectedSupportType === SupportRequestType.UI_CHANGE && !description) ||
    (selectedSupportType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
    (selectedSupportType === SupportRequestType.CUSTOM_MESSAGE && !customMessage.trim()) ||
    (selectedSupportType === SupportRequestType.SCHEDULE_MEETING &&
      (!meetingType || !meetingDate || !timeZone || !timeSlot));

  const handleDeveloperSubmit = () => {
    if (!selectedSupportType || !schoolId) return;
    setFormError(null);
    const requestData: SupportRequestDto = { type: selectedSupportType };

    if (needsDescription && description) {
      requestData.description = description;
    } else if (selectedSupportType === SupportRequestType.CUSTOM_MESSAGE && customMessage.trim()) {
      requestData.customMessage = customMessage.trim();
    } else if (selectedSupportType === SupportRequestType.SCHEDULE_MEETING) {
      if (!meetingType || !meetingDate || !timeZone || !timeSlot) {
        setFormError('Please fill all meeting details including date.');
        return;
      }
      requestData.meetingType = meetingType;
      requestData.meetingDate = meetingDate;
      requestData.timeZone = timeZone;
      requestData.timeSlot = timeSlot;
    } else if (selectedSupportType === SupportRequestType.INTEGRATE_FEATURE) {
      /* no extra fields */
    } else {
      setFormError('Please complete the required fields.');
      return;
    }

    sendDeveloperMutation.mutate(requestData);
  };

  const handleSupportTypeSelect = (type: SupportRequestType) => {
    setSelectedSupportType(type);
    setDescription('');
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setFormError(null);
  };

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub">
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <ServerSchoolHeader hubMode={hubMode} selectedSchool={selectedSchool} onBack={() => setHubMode(null)} />
        </header>

        <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
          <div className="admin-panel__body">
            <label className="admin-form-label" htmlFor="ma-raise-school">
              Select school
            </label>
            <select
              id="ma-raise-school"
              className="form-select admin-form-control master-admin-posts-school-filter__select"
              value={schoolId}
              onChange={(e) => handleSchoolChange(e.target.value)}
              disabled={schoolsLoading}
            >
              <option value="">Choose school…</option>
              {schoolOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {!schoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">Select a school to view queries or raise a request.</p>
            </div>
          </section>
        ) : !hubMode ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="admin-form-hint mb-3">
                School: <strong>{selectedSchool?.name}</strong> — choose what you want to do.
              </p>
              <div className="admin-raise-request-recipients" role="list">
                {HUB_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    className="admin-raise-request-recipient"
                    onClick={() => {
                      setHubMode(item.id);
                      if (item.id === 'raise') {
                        setShowSupportPanel(false);
                        resetSupportForm();
                      }
                    }}
                  >
                    <span className="admin-raise-request-recipient__icon" aria-hidden>
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <span className="admin-raise-request-recipient__body">
                      <span className="admin-raise-request-recipient__title">{item.title}</span>
                      <span className="admin-raise-request-recipient__desc">{item.description}</span>
                    </span>
                    <i className="bi bi-chevron-right admin-raise-request-recipient__chevron" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : hubMode === 'all' ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="admin-form-hint mb-3">
                All shared queries for <strong>{selectedSchool?.name}</strong> ({inboxLoading ? '…' : allRows.length}{' '}
                total).
              </p>
              {inboxLoading ? (
                <p className="master-admin-detail-muted mb-0">Loading queries…</p>
              ) : allRows.length === 0 ? (
                <p className="master-admin-detail-muted mb-0">No queries received for this school yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th>From</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRows.map((q) => (
                        <tr key={`${q._source}-${q.id}`}>
                          <td>{channelLabel[q._source]}</td>
                          <td>
                            {q._source === 'category_admin' && (
                              <>
                                <span className="admin-table__strong">{q.categoryAdmin.name}</span>
                                <span className="admin-form-hint d-block">{q.categoryAdmin.category.name}</span>
                              </>
                            )}
                            {q._source === 'subcategory_admin' && (
                              <>
                                <span className="admin-table__strong">{q.subCategoryAdmin.name}</span>
                                <span className="admin-form-hint d-block">
                                  {q.subCategoryAdmin.category.name} / {q.subCategoryAdmin.subCategory.name}
                                </span>
                              </>
                            )}
                            {q._source === 'super_admin' && (
                              <span className="admin-table__strong">School admin</span>
                            )}
                          </td>
                          <td>{typeLabel[q.type] ?? q.type}</td>
                          <td>
                            <span
                              className={`admin-pill admin-pill--${q.status === 'responded' ? 'status-done' : 'status-pending'}`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td>{formatDate(q.createdAt)}</td>
                          <td className="text-end">
                            <button type="button" className="admin-btn-secondary btn-sm me-1" onClick={() => setViewQuery(q)}>
                              View
                            </button>
                            {(q._source === 'category_admin' || q._source === 'subcategory_admin') &&
                            q.status !== 'responded' ? (
                              <button type="button" className="admin-btn-primary btn-sm" onClick={() => setReplyQuery(q)}>
                                Reply
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="admin-raise-request">
            <div className={`admin-raise-request__hero${showSupportPanel ? ' is-dimmed' : ''}`}>
              <img src={SUPPORT_HERO_IMAGE} alt="Customer support" className="admin-raise-request__image" />
              <p className="admin-form-hint text-center px-3 mb-2">
                Raising on behalf of <strong>{selectedSchool?.name}</strong>
              </p>
              <button
                type="button"
                className="admin-btn-primary admin-raise-request__cta"
                onClick={() => setShowSupportPanel(true)}
                disabled={showSupportPanel}
              >
                Contact Developer
              </button>
            </div>

            {showSupportPanel ? (
              <section className="admin-panel admin-raise-request__panel" style={panelStyle} aria-label="Support email">
                <div className="admin-panel__header">
                  <div>
                    <h2 className="admin-panel__title mb-0">Support email</h2>
                    <p className="admin-form-hint mb-0 mt-1">
                      School: <strong>{selectedSchool?.name}</strong>
                    </p>
                  </div>
                  <button type="button" className="admin-modal__close" onClick={closeSupportPanel} aria-label="Close">
                    <i className="bi bi-x-lg" aria-hidden />
                  </button>
                </div>

                <div className="admin-panel__body admin-form">
                  <div className="admin-notice admin-notice--info admin-support-greeting mb-0">
                    Hello! How can I help you today? Please select an option below.
                  </div>

                  {!selectedSupportType ? (
                    <div className="admin-support-options mt-3">
                      {REQUEST_OPTIONS.map(({ type, label }) => (
                        <button
                          key={type}
                          type="button"
                          className="admin-support-option"
                          onClick={() => handleSupportTypeSelect(type)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="admin-notice admin-notice--info admin-support-selected mt-3 mb-0">
                        Selected: <strong>{supportTypeLabel(selectedSupportType)}</strong>
                      </div>

                      {selectedSupportType === SupportRequestType.INTEGRATE_FEATURE ? (
                        <div className="admin-notice admin-notice--info mt-3 mb-0">
                          Developer will get in touch with you shortly.
                        </div>
                      ) : null}

                      {needsDescription ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="ma-support-description">
                            Please describe your request
                          </label>
                          <textarea
                            id="ma-support-description"
                            className="form-control admin-form-control"
                            rows={6}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter your comments here…"
                          />
                        </div>
                      ) : null}

                      {selectedSupportType === SupportRequestType.CUSTOM_MESSAGE ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="ma-support-custom">
                            Your message
                          </label>
                          <textarea
                            id="ma-support-custom"
                            className="form-control admin-form-control"
                            rows={6}
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Enter your custom message here…"
                          />
                        </div>
                      ) : null}

                      {selectedSupportType === SupportRequestType.SCHEDULE_MEETING ? (
                        <>
                          <div className="admin-form-section">
                            <span className="admin-form-label">Select meeting platform</span>
                            <div className="admin-segment-row">
                              <button
                                type="button"
                                className={`admin-segment-btn${meetingType === MeetingType.GOOGLE_MEET ? ' is-active' : ''}`}
                                onClick={() => setMeetingType(MeetingType.GOOGLE_MEET)}
                              >
                                Google Meet
                              </button>
                              <button
                                type="button"
                                className={`admin-segment-btn${meetingType === MeetingType.ZOOM ? ' is-active' : ''}`}
                                onClick={() => setMeetingType(MeetingType.ZOOM)}
                              >
                                Zoom
                              </button>
                            </div>
                          </div>
                          {meetingType ? (
                            <>
                              <label className="admin-form-label" htmlFor="ma-support-date">
                                Meeting date
                              </label>
                              <input
                                id="ma-support-date"
                                type="date"
                                className="form-control admin-form-control"
                                value={meetingDate}
                                onChange={(e) => setMeetingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                              />
                              <label className="admin-form-label" htmlFor="ma-support-tz">
                                Time zone
                              </label>
                              <select
                                id="ma-support-tz"
                                className="form-select admin-form-control"
                                value={timeZone ?? ''}
                                onChange={(e) => setTimeZone(e.target.value as TimeZone)}
                              >
                                <option value="">Select time zone</option>
                                <option value={TimeZone.US}>US</option>
                                <option value={TimeZone.INDIA}>India</option>
                              </select>
                              <label className="admin-form-label" htmlFor="ma-support-slot">
                                Time slot
                              </label>
                              <select
                                id="ma-support-slot"
                                className="form-select admin-form-control"
                                value={timeSlot}
                                onChange={(e) => setTimeSlot(e.target.value)}
                              >
                                <option value="">Select time slot</option>
                                {TIME_SLOTS.map((slot) => (
                                  <option key={slot} value={slot}>
                                    {slot}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : null}
                        </>
                      ) : null}

                      {formError ? <p className="admin-form-hint admin-form-hint--error mb-0">{formError}</p> : null}

                      <div className="admin-form-actions admin-form-actions--between">
                        <button type="button" className="admin-btn-secondary" onClick={resetSupportForm}>
                          Back
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          onClick={handleDeveloperSubmit}
                          disabled={isSubmitDisabled}
                        >
                          {sendDeveloperMutation.isPending ? 'Sending…' : 'Send email'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      {viewQuery ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setViewQuery(null)}>
          <div className="admin-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={() => setViewQuery(null)}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <h3 className="admin-modal__title">Query details</h3>
              <p className="admin-form-hint">
                <strong>Channel:</strong> {channelLabel[viewQuery._source]}
              </p>
              <p className="admin-form-hint">
                <strong>Type:</strong> {typeLabel[viewQuery.type] ?? viewQuery.type}
              </p>
              <p className="admin-form-hint">
                <strong>Status:</strong> {viewQuery.status}
              </p>
              {'description' in viewQuery && viewQuery.description ? (
                <p className="small" style={{ whiteSpace: 'pre-wrap' }}>
                  {viewQuery.description}
                </p>
              ) : null}
              {'customMessage' in viewQuery && viewQuery.customMessage ? (
                <p className="small" style={{ whiteSpace: 'pre-wrap' }}>
                  {String(viewQuery.customMessage)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {replyQuery ? (
        <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={() => setReplyQuery(null)}>
          <div className="admin-modal" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__body">
              <h3 className="admin-modal__title">Reply</h3>
              <textarea
                className="form-control admin-form-control"
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Your reply…"
              />
              <div className="admin-modal__footer mt-3">
                <button type="button" className="admin-btn-secondary" onClick={() => setReplyQuery(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  onClick={() => replyMutation.mutate()}
                >
                  Send reply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </MasterAdminLayout>
  );
}

function ServerSchoolHeader({
  hubMode,
  selectedSchool,
  onBack,
}: {
  hubMode: HubMode | null;
  selectedSchool?: { name: string };
  onBack: () => void;
}) {
  return (
    <div className="master-admin-posts-page__header-row">
      <div>
        <h1 className="admin-page-title mb-1">Raise request</h1>
        <p className="admin-page-subtitle mb-0">
          {hubMode === 'all'
            ? 'All queries received for the selected school.'
            : hubMode === 'raise'
              ? 'Raise a query to the developer for this school.'
              : 'Select a school, then view all queries or raise a new request.'}
        </p>
        {selectedSchool && hubMode ? (
          <p className="admin-form-hint mb-0 mt-2">
            <button type="button" className="btn btn-link p-0 align-baseline me-2" onClick={onBack}>
              ← Back to options
            </button>
            School: <strong>{selectedSchool.name}</strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}
