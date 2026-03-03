import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { StatusPopup } from '../components/StatusPopup';
import {
  subcategoryAdminQueriesService,
  QueryType,
  MeetingType,
  TimeZone,
} from '../services/subcategory-admin-queries.service';

const timeSlots = [
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

export const SubCategoryAdminRaiseRequest = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [selectedType, setSelectedType] = useState<'custom_message' | 'schedule_meeting' | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [meetingType, setMeetingType] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState('');
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState('');

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
      // Send query data to the respective admin: Category Admin, School Admin, or Super Admin
      if (selectedType === QueryType.CUSTOM_MESSAGE) {
        const url = await uploadAndGetUrl();
        const data = { type: 'custom_message' as const, customMessage, attachmentUrl: url };
        if (recipient === 'category_admin') return subcategoryAdminQueriesService.sendRequest(data);
        if (recipient === 'school_admin') return subcategoryAdminQueriesService.sendToSchoolAdmin(data);
        return subcategoryAdminQueriesService.sendToSuperAdmin(data);
      }
      if (selectedType === QueryType.SCHEDULE_MEETING && meetingType && meetingDate && timeZone && timeSlot) {
        const data = { type: 'schedule_meeting' as const, meetingType, meetingDate, timeZone, timeSlot };
        if (recipient === 'category_admin') return subcategoryAdminQueriesService.sendRequest(data);
        if (recipient === 'school_admin') return subcategoryAdminQueriesService.sendToSchoolAdmin(data);
        return subcategoryAdminQueriesService.sendToSuperAdmin(data);
      }
      throw new Error('Invalid request');
    },
    onSuccess: (data: { message?: string; meetingLink?: string }) => {
      setPopupType('success');
      const toWhom = recipient === 'category_admin' ? 'Category Admin' : recipient === 'school_admin' ? 'School Admin' : 'Super Admin';
      setPopupMessage(
        data?.meetingLink ? `Meeting scheduled! You and the ${toWhom} will receive a calendar invite.` : `Your request has been sent to the ${toWhom}.`,
      );
      setPopupShow(true);
      setShowChatbot(false);
      setRecipient(null);
      setSelectedType(null);
      setCustomMessage('');
      setMeetingType(null);
      setMeetingDate('');
      setTimeZone(null);
      setTimeSlot('');
      setAttachmentFile(null);
      setAttachmentUrl(null);
    },
    onError: (error: unknown) => {
      setPopupType('error');
      setPopupMessage((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send request.');
      setPopupShow(true);
    },
  });

  const handleRecipientClick = (r: Recipient) => {
    setRecipient(r);
    setShowChatbot(true);
    setSelectedType(null);
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
    setAttachmentFile(null);
    setAttachmentUrl(null);
  };

  const handleSubmit = () => {
    if (!selectedType) return;
    if (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) {
      setPopupType('error');
      setPopupMessage('Please enter your message.');
      setPopupShow(true);
      return;
    }
    if (selectedType === QueryType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot)) {
      setPopupType('error');
      setPopupMessage('Please fill all meeting details including date.');
      setPopupShow(true);
      return;
    }
    sendMutation.mutate();
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
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 200px)',
            gap: '2rem',
          }}
        >
          <img
            src="https://media.istockphoto.com/id/1469792786/vector/customer-support-3d-illustration-personal-assistant-service-person-advisor-and-helpful.jpg?s=612x612&w=0&k=20&c=1pq_S8sYDPF6bFz2H74QCuKRzsNfR7wcAFKJ4yQ06Y0="
            alt="Support"
            style={{ maxWidth: '400px', width: '100%', height: 'auto', borderRadius: '12px' }}
          />
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              <button
                onClick={() => handleRecipientClick('category_admin')}
                style={{
                  backgroundColor: showChatbot && recipient === 'category_admin' ? '#1a1f2e' : '#fff',
                  border: '1px solid #1a1f2e',
                  borderRadius: '50px',
                  padding: '0.75rem 1.5rem',
                  color: showChatbot && recipient === 'category_admin' ? '#fff' : '#1a1f2e',
                  fontWeight: '500',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Raise query to Category Admin
              </button>
              <button
                onClick={() => handleRecipientClick('school_admin')}
                style={{
                  backgroundColor: showChatbot && recipient === 'school_admin' ? '#1a1f2e' : '#fff',
                  border: '1px solid #1a1f2e',
                  borderRadius: '50px',
                  padding: '0.75rem 1.5rem',
                  color: showChatbot && recipient === 'school_admin' ? '#fff' : '#1a1f2e',
                  fontWeight: '500',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Raise query to School Admin
              </button>
              <button
                onClick={() => handleRecipientClick('super_admin')}
                style={{
                  backgroundColor: showChatbot && recipient === 'super_admin' ? '#1a1f2e' : '#fff',
                  border: '1px solid #1a1f2e',
                  borderRadius: '50px',
                  padding: '0.75rem 1.5rem',
                  color: showChatbot && recipient === 'super_admin' ? '#fff' : '#1a1f2e',
                  fontWeight: '500',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Raise query to Super Admin
              </button>
            </div>
        </div>

        {showChatbot && (
          <div
            style={{
              position: 'fixed',
              right: '0px',
              top: '10%',
              width: '40%',
              maxWidth: '480px',
              height: '80%',
              backgroundColor: 'rgb(255, 255, 255)',
              border: '1px solid rgb(222, 226, 230)',
              borderRadius: '25px',
              padding: '2rem',
              overflowY: 'auto',
              boxShadow: 'rgba(0, 0, 0, 0.1) -2px 0px 8px',
              zIndex: 1050,
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#1a1f2e', margin: 0 }}>
                Raise a request
              </h2>
              <button
                type="button"
                  onClick={() => {
                  setShowChatbot(false);
                  setRecipient(null);
                  setSelectedType(null);
                  setCustomMessage('');
                  setMeetingType(null);
                  setMeetingDate('');
                  setTimeZone(null);
                  setTimeSlot('');
                  setAttachmentFile(null);
                  setAttachmentUrl(null);
                }}
                className="btn-close"
                style={{ fontSize: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6c757d' }}
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ color: '#1a1f2e', margin: 0 }}>
                  Raise a query to the {recipient === 'category_admin' ? 'Category Admin' : recipient === 'school_admin' ? 'School Admin' : 'Super Admin'}. Choose an option below:
                </p>
              </div>
            </div>

            {!selectedType ? (
              <div className="d-flex flex-column gap-2">
                <button
                  onClick={() => handleTypeSelect(QueryType.CUSTOM_MESSAGE)}
                  className="btn"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#1a1f2e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  Custom Message
                </button>
                <button
                  onClick={() => handleTypeSelect(QueryType.SCHEDULE_MEETING)}
                  className="btn"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#1a1f2e',
                    fontWeight: '500',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#1a1f2e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  Schedule a Meeting
                </button>
              </div>
            ) : (
              <div>
                <div
                  className="mb-3"
                  style={{
                    backgroundColor: '#e7f3ff',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff',
                  }}
                >
                  <p style={{ margin: 0, color: '#1a1f2e', fontWeight: '500' }}>
                    Selected: {selectedType === 'custom_message' ? 'Custom Message' : 'Schedule a Meeting'}
                  </p>
                </div>

                {selectedType === QueryType.CUSTOM_MESSAGE && (
                  <>
                    <div className="mb-4">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                        Your message
                      </label>
                      <textarea
                        className="form-control"
                        rows={6}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type your query here..."
                        style={{
                          borderRadius: '0px',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid #dee2e6',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                        Attach document (optional)
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        style={{ borderRadius: '0px', padding: '0.5rem' }}
                      />
                      {attachmentFile && (
                        <p className="text-muted small mt-1 mb-0">{attachmentFile.name}</p>
                      )}
                    </div>
                  </>
                )}

                {selectedType === QueryType.SCHEDULE_MEETING && (
                  <>
                    <div className="mb-4">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                        Meeting platform
                      </label>
                      <div className="d-flex gap-3">
                        <button
                          type="button"
                          onClick={() => setMeetingType(MeetingType.GOOGLE_MEET)}
                          className="btn"
                          style={{
                            flex: 1,
                            backgroundColor: meetingType === MeetingType.GOOGLE_MEET ? '#1a1f2e' : '#fff',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '1rem',
                            color: meetingType === MeetingType.GOOGLE_MEET ? '#fff' : '#1a1f2e',
                            fontWeight: '500',
                          }}
                        >
                          <i className="bi bi-camera-video me-2" />
                          Google Meet
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeetingType(MeetingType.ZOOM)}
                          className="btn"
                          style={{
                            flex: 1,
                            backgroundColor: meetingType === MeetingType.ZOOM ? '#1a1f2e' : '#fff',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '1rem',
                            color: meetingType === MeetingType.ZOOM ? '#fff' : '#1a1f2e',
                            fontWeight: '500',
                          }}
                        >
                          <i className="bi bi-camera-video-fill me-2" />
                          Zoom
                        </button>
                      </div>
                    </div>
                    {meetingType && (
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                          Meeting date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          style={{ borderRadius: '0px', padding: '0.75rem 1rem', border: '1px solid #dee2e6' }}
                        />
                      </div>
                    )}
                    {meetingType && (
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                          Time zone
                        </label>
                        <select
                          className="form-select"
                          value={timeZone || ''}
                          onChange={(e) => setTimeZone(e.target.value || null)}
                          style={{ borderRadius: '0px', padding: '0.75rem 1rem', border: '1px solid #dee2e6' }}
                        >
                          <option value="">Select time zone</option>
                          <option value={TimeZone.US}>US</option>
                          <option value={TimeZone.INDIA}>India</option>
                        </select>
                      </div>
                    )}
                    {timeZone && (
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                          Time slot
                        </label>
                        <select
                          className="form-select"
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                          style={{ borderRadius: '0px', padding: '0.75rem 1rem', border: '1px solid #dee2e6' }}
                        >
                          <option value="">Select time slot</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="d-flex justify-content-between gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType(null);
                      setCustomMessage('');
                      setMeetingType(null);
                      setMeetingDate('');
                      setTimeZone(null);
                      setTimeSlot('');
                      setAttachmentFile(null);
                      setAttachmentUrl(null);
                    }}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#1a1f2e',
                      fontWeight: '500',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      sendMutation.isPending ||
                      (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) ||
                      (selectedType === QueryType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                    }
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      opacity:
                        sendMutation.isPending ||
                        (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) ||
                        (selectedType === QueryType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                          ? 0.7
                          : 1,
                      cursor:
                        sendMutation.isPending ||
                        (selectedType === QueryType.CUSTOM_MESSAGE && !customMessage.trim()) ||
                        (selectedType === QueryType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {sendMutation.isPending ? 'Sending…' : 'Send request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
