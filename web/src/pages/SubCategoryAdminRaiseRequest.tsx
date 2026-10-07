import { useState, type CSSProperties } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  subcategoryAdminQueriesService,
  QueryType,
  MeetingType,
  TimeZone,
} from '../services/subcategory-admin-queries.service';

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

type Recipient = 'category_admin' | 'school_admin' | 'super_admin';

const RECIPIENTS: { id: Recipient; title: string; description: string; icon: string }[] = [
  {
    id: 'category_admin',
    title: 'Category Admin',
    description: 'Your category lead for approvals, access, and escalations',
    icon: 'bi-diagram-3',
  },
  {
    id: 'school_admin',
    title: 'School Admin',
    description: 'School-wide policies, users, and portal configuration',
    icon: 'bi-building',
  },
  {
    id: 'super_admin',
    title: 'Super Admin',
    description: 'Platform support beyond your school',
    icon: 'bi-shield-check',
  },
];

function recipientLabel(r: Recipient): string {
  return RECIPIENTS.find((x) => x.id === r)?.title ?? 'Admin';
}

export const SubCategoryAdminRaiseRequest = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [selectedType, setSelectedType] = useState<'custom_message' | 'schedule_meeting' | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [meetingType, setMeetingType] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  const resetForm = () => {
    setSelectedType(null);
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setAttachmentFile(null);
    setAttachmentUrl(null);
    setFormError(null);
  };

  const closePanel = () => {
    setShowPanel(false);
    setRecipient(null);
    resetForm();
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!recipient) throw new Error('Select a recipient');
      const uploadAndGetUrl = async () => {
        if (attachmentFile && !attachmentUrl) {
          const res = await subcategoryAdminQueriesService.uploadFile(attachmentFile);
          return res.url;
        }
        return attachmentUrl ?? undefined;
      };
      if (selectedType === QueryType.CUSTOM_MESSAGE) {
        const url = await uploadAndGetUrl();
        const data = { type: 'custom_message' as const, customMessage, attachmentUrl: url };
        if (recipient === 'school_admin') return subcategoryAdminQueriesService.sendToSchoolAdmin(data);
        if (recipient === 'category_admin') return subcategoryAdminQueriesService.sendRequest(data);
        return subcategoryAdminQueriesService.sendToSuperAdmin(data);
      }
      if (selectedType === QueryType.SCHEDULE_MEETING && meetingType && meetingDate && timeZone && timeSlot) {
        const data = { type: 'schedule_meeting' as const, meetingType, meetingDate, timeZone, timeSlot };
        if (recipient === 'school_admin') return subcategoryAdminQueriesService.sendToSchoolAdmin(data);
        if (recipient === 'category_admin') return subcategoryAdminQueriesService.sendRequest(data);
        return subcategoryAdminQueriesService.sendToSuperAdmin(data);
      }
      throw new Error('Invalid request');
    },
    onSuccess: (data: { message?: string; meetingLink?: string }) => {
      setPopupType('success');
      const toWhom = recipient ? recipientLabel(recipient) : 'admin';
      setPopupMessage(
        data?.meetingLink
          ? `Meeting scheduled! You and the ${toWhom} will receive a calendar invite.`
          : `Your request has been sent to the ${toWhom}.`,
      );
      setPopupShow(true);
      closePanel();
    },
    onError: (error: unknown) => {
      setPopupType('error');
      setPopupMessage(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to send request.',
      );
      setPopupShow(true);
    },
  });

  const isSubmitDisabled =
    sendMutation.isPending ||
    !selectedType ||
    (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) ||
    (selectedType === QueryType.SCHEDULE_MEETING &&
      (!meetingType || !meetingDate || !timeZone || !timeSlot));

  const handleSubmit = () => {
    if (!selectedType) return;
    setFormError(null);
    if (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) {
      setFormError('Please enter your message.');
      return;
    }
    if (
      selectedType === QueryType.SCHEDULE_MEETING &&
      (!meetingType || !meetingDate || !timeZone || !timeSlot)
    ) {
      setFormError('Please fill all meeting details including date.');
      return;
    }
    sendMutation.mutate();
  };

  const handleRecipientClick = (r: Recipient) => {
    setRecipient(r);
    setShowPanel(true);
    resetForm();
  };

  const handleTypeSelect = (type: 'custom_message' | 'schedule_meeting') => {
    setSelectedType(type);
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setAttachmentFile(null);
    setAttachmentUrl(null);
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      setAttachmentUrl(null);
    }
  };

  return (
    <SubCategoryAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Raise a query</h1>
        <p className="admin-page-subtitle">
          Send a message or schedule a meeting with your Category Admin, School Admin, or Super Admin.
        </p>
      </header>

      <div className="admin-raise-request admin-raise-request--school">
        <div className={`admin-raise-request__hero${showPanel ? ' is-dimmed' : ''}`}>
          <img src={SUPPORT_HERO_IMAGE} alt="Customer support" className="admin-raise-request__image" />
          <div className="admin-raise-request-recipients" role="list">
            {RECIPIENTS.map((item) => {
              const isActive = showPanel && recipient === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  className={`admin-raise-request-recipient${isActive ? ' is-active' : ''}`}
                  onClick={() => handleRecipientClick(item.id)}
                  aria-pressed={isActive}
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
              );
            })}
          </div>
        </div>

        {showPanel && recipient ? (
          <section
            className="admin-panel admin-raise-request__panel"
            style={panelStyle}
            aria-label="Raise a request"
          >
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title mb-0">New request</h2>
                <p className="admin-form-hint mb-0 mt-1">
                  To: <strong>{recipientLabel(recipient)}</strong>
                </p>
              </div>
              <button type="button" className="admin-modal__close" onClick={closePanel} aria-label="Close">
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            </div>

            <div className="admin-panel__body admin-form">
              <div className="admin-notice admin-notice--info admin-support-greeting mb-0">
                Choose how you want to reach the {recipientLabel(recipient)} — a custom message or a scheduled meeting.
              </div>

              {!selectedType ? (
                <div className="admin-support-options mt-3">
                  <button
                    type="button"
                    className="admin-support-option"
                    onClick={() => handleTypeSelect(QueryType.CUSTOM_MESSAGE)}
                  >
                    <i className="bi bi-chat-left-text me-2" aria-hidden />
                    Custom message
                  </button>
                  <button
                    type="button"
                    className="admin-support-option"
                    onClick={() => handleTypeSelect(QueryType.SCHEDULE_MEETING)}
                  >
                    <i className="bi bi-calendar-event me-2" aria-hidden />
                    Schedule a meeting
                  </button>
                </div>
              ) : (
                <>
                  <div className="admin-notice admin-notice--info admin-support-selected mt-3 mb-0">
                    Selected:{' '}
                    <strong>
                      {selectedType === QueryType.CUSTOM_MESSAGE ? 'Custom message' : 'Schedule a meeting'}
                    </strong>
                  </div>

                  {selectedType === QueryType.CUSTOM_MESSAGE ? (
                    <>
                      <div className="admin-form-section">
                        <label className="admin-form-label" htmlFor="subcategory-admin-query-message">
                          Your message
                        </label>
                        <textarea
                          id="subcategory-admin-query-message"
                          className="form-control admin-form-control"
                          rows={6}
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Type your query here…"
                        />
                      </div>
                      <div className="admin-form-section">
                        <label className="admin-form-label" htmlFor="subcategory-admin-query-attachment">
                          Attach document (optional)
                        </label>
                        <input
                          id="subcategory-admin-query-attachment"
                          type="file"
                          className="form-control admin-form-control"
                          onChange={handleFileChange}
                        />
                        {attachmentFile ? (
                          <p className="admin-form-hint mb-0 mt-1">{attachmentFile.name}</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  {selectedType === QueryType.SCHEDULE_MEETING ? (
                    <>
                      <div className="admin-form-section">
                        <span className="admin-form-label">Meeting platform</span>
                        <div className="admin-segment-row">
                          <button
                            type="button"
                            className={`admin-segment-btn${meetingType === MeetingType.GOOGLE_MEET ? ' is-active' : ''}`}
                            onClick={() => setMeetingType(MeetingType.GOOGLE_MEET)}
                          >
                            <i className="bi bi-camera-video" aria-hidden />
                            Google Meet
                          </button>
                          <button
                            type="button"
                            className={`admin-segment-btn${meetingType === MeetingType.ZOOM ? ' is-active' : ''}`}
                            onClick={() => setMeetingType(MeetingType.ZOOM)}
                          >
                            <i className="bi bi-camera-video-fill" aria-hidden />
                            Zoom
                          </button>
                        </div>
                      </div>

                      {meetingType ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="subcategory-admin-meeting-date">
                            Meeting date
                          </label>
                          <input
                            id="subcategory-admin-meeting-date"
                            type="date"
                            className="form-control admin-form-control"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      ) : null}

                      {meetingType ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="subcategory-admin-timezone">
                            Time zone
                          </label>
                          <select
                            id="subcategory-admin-timezone"
                            className="form-select admin-form-control"
                            value={timeZone ?? ''}
                            onChange={(e) => setTimeZone(e.target.value || null)}
                          >
                            <option value="">Select time zone</option>
                            <option value={TimeZone.US}>US</option>
                            <option value={TimeZone.INDIA}>India</option>
                          </select>
                        </div>
                      ) : null}

                      {timeZone ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="subcategory-admin-timeslot">
                            Time slot
                          </label>
                          <select
                            id="subcategory-admin-timeslot"
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
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {formError ? (
                    <p className="admin-form-hint admin-form-hint--error mb-0">{formError}</p>
                  ) : null}

                  <div className="admin-form-actions admin-form-actions--between">
                    <button type="button" className="admin-btn-secondary" onClick={resetForm}>
                      Back
                    </button>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={handleSubmit}
                      disabled={isSubmitDisabled}
                    >
                      {sendMutation.isPending ? 'Sending…' : 'Send request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>

      <StatusPopup
        show={popupShow}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </SubCategoryAdminLayout>
  );
};
