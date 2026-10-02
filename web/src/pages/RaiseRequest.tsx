import { useState, type CSSProperties } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SuperAdminLayout } from '../components/SuperAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { supportService, SupportRequestType, MeetingType, TimeZone } from '../services/support.service';
import type { SupportRequestDto } from '../services/support.service';

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

const REQUEST_OPTIONS: { type: SupportRequestType; label: string }[] = [
  { type: SupportRequestType.RAISE_ISSUE, label: 'Raise an Issue with the Software' },
  { type: SupportRequestType.INTEGRATE_FEATURE, label: 'Needs to Integrate New Feature' },
  { type: SupportRequestType.UI_CHANGE, label: 'UI Change Request' },
  { type: SupportRequestType.UPSCALE_PLATFORM, label: 'Upscale the Platform' },
  { type: SupportRequestType.CUSTOM_MESSAGE, label: 'Custom Message' },
  { type: SupportRequestType.SCHEDULE_MEETING, label: 'Schedule Meeting' },
];

function supportTypeLabel(type: SupportRequestType): string {
  return REQUEST_OPTIONS.find((o) => o.type === type)?.label ?? 'Support request';
}

export const RaiseRequest = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedType, setSelectedType] = useState<SupportRequestType | null>(null);
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

  const resetFlow = () => {
    setSelectedType(null);
    setDescription('');
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setFormError(null);
  };

  const closePanel = () => {
    setShowChatbot(false);
    resetFlow();
  };

  const sendRequestMutation = useMutation({
    mutationFn: (data: SupportRequestDto) => supportService.sendRequest(data),
    onSuccess: (_data: { message?: string; meetingLink?: string }) => {
      setPopupType('success');
      const msg = _data?.meetingLink
        ? 'Meeting scheduled! You will receive a calendar invite with a 5-minute reminder (Google Meet) or Zoom reminder.'
        : 'Support request sent successfully! Developer will get in touch with you shortly.';
      setPopupMessage(msg);
      setPopupShow(true);
      closePanel();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to send support request');
      setPopupShow(true);
    },
  });

  const isSubmitDisabled =
    sendRequestMutation.isPending ||
    !selectedType ||
    (selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
    (selectedType === SupportRequestType.UI_CHANGE && !description) ||
    (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
    (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
    (selectedType === SupportRequestType.SCHEDULE_MEETING &&
      (!meetingType || !meetingDate || !timeZone || !timeSlot));

  const handleSubmit = () => {
    if (!selectedType) return;
    setFormError(null);

    const requestData: SupportRequestDto = { type: selectedType };

    if (selectedType === SupportRequestType.RAISE_ISSUE && description) {
      requestData.description = description;
    } else if (selectedType === SupportRequestType.UI_CHANGE && description) {
      requestData.description = description;
    } else if (selectedType === SupportRequestType.UPSCALE_PLATFORM && description) {
      requestData.description = description;
    } else if (selectedType === SupportRequestType.CUSTOM_MESSAGE && customMessage) {
      requestData.customMessage = customMessage;
    } else if (selectedType === SupportRequestType.SCHEDULE_MEETING) {
      if (!meetingType || !meetingDate || !timeZone || !timeSlot) {
        setFormError('Please fill all meeting details including date.');
        return;
      }
      requestData.meetingType = meetingType;
      requestData.meetingDate = meetingDate;
      requestData.timeZone = timeZone;
      requestData.timeSlot = timeSlot;
    }

    sendRequestMutation.mutate(requestData);
  };

  const handleTypeSelect = (type: SupportRequestType) => {
    setSelectedType(type);
    setDescription('');
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setFormError(null);
  };

  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.super } as CSSProperties;
  const needsDescription =
    selectedType === SupportRequestType.RAISE_ISSUE ||
    selectedType === SupportRequestType.UI_CHANGE ||
    selectedType === SupportRequestType.UPSCALE_PLATFORM;

  return (
    <SuperAdminLayout>
      <header className="admin-page-header">
        <h1 className="admin-page-title">Raise a request</h1>
        <p className="admin-page-subtitle">
          Contact the developer for bugs, features, UI changes, or schedule a meeting.
        </p>
      </header>

      <div className="admin-raise-request">
        <div className={`admin-raise-request__hero${showChatbot ? ' is-dimmed' : ''}`}>
          <img src={SUPPORT_HERO_IMAGE} alt="Customer support" className="admin-raise-request__image" />
          <button
            type="button"
            className="admin-btn-primary admin-raise-request__cta"
            onClick={() => setShowChatbot(true)}
            disabled={showChatbot}
          >
            Contact Developer
          </button>
        </div>

        {showChatbot ? (
          <section className="admin-panel admin-raise-request__panel" style={panelStyle} aria-label="Support chat">
            <div className="admin-panel__header">
              <h2 className="admin-panel__title mb-0">Support chat</h2>
              <button type="button" className="admin-modal__close" onClick={closePanel} aria-label="Close">
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            </div>

            <div className="admin-panel__body admin-form">
              <div className="admin-notice admin-notice--info admin-support-greeting mb-0">
                Hello! How can I help you today? Please select an option below.
              </div>

              {!selectedType ? (
                <div className="admin-support-options mt-3">
                  {REQUEST_OPTIONS.map(({ type, label }) => (
                    <button key={type} type="button" className="admin-support-option" onClick={() => handleTypeSelect(type)}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="admin-notice admin-notice--info admin-support-selected mt-3 mb-0">
                    Selected: <strong>{supportTypeLabel(selectedType)}</strong>
                  </div>

                  {selectedType === SupportRequestType.INTEGRATE_FEATURE ? (
                    <div className="admin-notice admin-notice--info mt-3 mb-0">
                      Developer will get in touch with you shortly.
                    </div>
                  ) : null}

                  {needsDescription ? (
                    <div className="admin-form-section">
                      <label className="admin-form-label" htmlFor="support-description">
                        Please describe your request
                      </label>
                      <textarea
                        id="support-description"
                        className="form-control"
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter your comments here…"
                      />
                    </div>
                  ) : null}

                  {selectedType === SupportRequestType.CUSTOM_MESSAGE ? (
                    <div className="admin-form-section">
                      <label className="admin-form-label" htmlFor="support-custom-message">
                        Your message
                      </label>
                      <textarea
                        id="support-custom-message"
                        className="form-control"
                        rows={6}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Enter your custom message here…"
                      />
                    </div>
                  ) : null}

                  {selectedType === SupportRequestType.SCHEDULE_MEETING ? (
                    <>
                      <div className="admin-form-section">
                        <span className="admin-form-label">Select meeting platform</span>
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
                          <label className="admin-form-label" htmlFor="support-meeting-date">
                            Meeting date
                          </label>
                          <input
                            id="support-meeting-date"
                            type="date"
                            className="form-control"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      ) : null}

                      {meetingType ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="support-timezone">
                            Time zone
                          </label>
                          <select
                            id="support-timezone"
                            className="form-select"
                            value={timeZone ?? ''}
                            onChange={(e) => setTimeZone(e.target.value as TimeZone)}
                          >
                            <option value="">Select time zone</option>
                            <option value={TimeZone.US}>US</option>
                            <option value={TimeZone.INDIA}>India</option>
                          </select>
                        </div>
                      ) : null}

                      {timeZone ? (
                        <div className="admin-form-section">
                          <label className="admin-form-label" htmlFor="support-timeslot">
                            Time slot
                          </label>
                          <select
                            id="support-timeslot"
                            className="form-select"
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
                    <button type="button" className="admin-btn-secondary" onClick={resetFlow}>
                      Back
                    </button>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={handleSubmit}
                      disabled={isSubmitDisabled}
                    >
                      {sendRequestMutation.isPending ? 'Sending…' : 'Send support request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}
      </div>

      <StatusPopup show={popupShow} type={popupType} message={popupMessage} onClose={() => setPopupShow(false)} />
    </SuperAdminLayout>
  );
};
