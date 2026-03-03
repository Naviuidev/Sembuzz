import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { StatusPopup } from '../components/StatusPopup';
import { supportService, SupportRequestType, MeetingType, TimeZone } from '../services/support.service';
import type { SupportRequestDto } from '../services/support.service';

export const RaiseRequest = () => {
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<SupportRequestType | null>(null);
  const [description, setDescription] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [timeZone, setTimeZone] = useState<TimeZone | null>(null);
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');

  const sendRequestMutation = useMutation({
    mutationFn: (data: SupportRequestDto) => supportService.sendRequest(data),
    onSuccess: (_data: { message?: string; meetingLink?: string }) => {
      setPopupType('success');
      const msg = _data?.meetingLink
        ? 'Meeting scheduled! You will receive a calendar invite with a 5-minute reminder (Google Meet) or Zoom reminder.'
        : 'Support request sent successfully! Developer will get in touch with you shortly.';
      setPopupMessage(msg);
      setPopupShow(true);
      setShowChatbot(false);
      setSelectedType(null);
      setDescription('');
      setCustomMessage('');
      setMeetingType(null);
      setMeetingDate('');
      setTimeZone(null);
      setTimeSlot('');
    },
    onError: (error: any) => {
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to send support request');
      setPopupShow(true);
    },
  });

  const handleSubmit = () => {
    if (!selectedType) return;

    const requestData: SupportRequestDto = {
      type: selectedType,
    };

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
        alert('Please fill all meeting details including date');
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
    // Reset all fields when type changes
    setDescription('');
    setCustomMessage('');
    setMeetingType(null);
    setMeetingDate('');
    setTimeZone(null);
    setTimeSlot('');
  };

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div 
          style={{ 
            flex: 1, 
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Main Content - Image and Button (Always visible in background) */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100vh - 200px)',
              gap: '2rem',
            }}
          >
            <img
              src="https://media.istockphoto.com/id/1469792786/vector/customer-support-3d-illustration-personal-assistant-service-person-advisor-and-helpful.jpg?s=612x612&w=0&k=20&c=1pq_S8sYDPF6bFz2H74QCuKRzsNfR7wcAFKJ4yQ06Y0="
              alt="Customer Support"
              style={{
                maxWidth: '400px',
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
              }}
            />
            <button
              onClick={() => setShowChatbot(true)}
              style={{
                backgroundColor: '#1a1f2e',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 2rem',
                color: '#fff',
                fontWeight: '500',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: showChatbot ? 0.3 : 1,
                pointerEvents: showChatbot ? 'none' : 'auto',
              }}
              onMouseEnter={(e) => {
                if (!showChatbot) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a1f2e';
                  e.currentTarget.style.border = '1px solid #1a1f2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!showChatbot) {
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.border = 'none';
                }
              }}
            >
              Contact Developer
            </button>
          </div>

          {/* Chatbot Interface - Slides in from right */}
          {showChatbot && (
            <div
              style={{
                position: 'absolute',
                right: '0px',
                top: '5%',
                width: '40%',
                height: '80%',
                backgroundColor: 'rgb(255, 255, 255)',
                border: '1px solid rgb(222, 226, 230)',
                borderRadius: '25px',
                padding: '2rem',
                overflowY: 'auto',
                boxShadow: 'rgba(0, 0, 0, 0.1) -2px 0px 8px',
                animation: 'slideInFromRight 0.5s ease-in-out',
                transform: 'translateX(0)',
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  margin: 0
                }}>
                  Support Chat
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowChatbot(false);
                    setSelectedType(null);
                    setDescription('');
                    setCustomMessage('');
                    setMeetingType(null);
                    setMeetingDate('');
                    setTimeZone(null);
                    setTimeSlot('');
                  }}
                  className="btn-close"
                  style={{
                    fontSize: '1.5rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Greeting Message */}
              <div className="mb-4">
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}>
                  <p style={{ color: '#1a1f2e', margin: 0 }}>
                    👋 Hello! How can I help you today? Please select an option below:
                  </p>
                </div>
              </div>

              {/* Request Type Options */}
              {!selectedType ? (
                <div className="d-flex flex-column gap-2">
                  <button
                    onClick={() => handleTypeSelect(SupportRequestType.RAISE_ISSUE)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    Raise an Issue with the Software
                  </button>

                  <button
                    onClick={() => handleTypeSelect(SupportRequestType.INTEGRATE_FEATURE)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    Needs to Integrate New Feature
                  </button>

                  <button
                    onClick={() => handleTypeSelect(SupportRequestType.UI_CHANGE)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    UI Change Request
                  </button>

                  <button
                    onClick={() => handleTypeSelect(SupportRequestType.UPSCALE_PLATFORM)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    Upscale the Platform
                  </button>

                  <button
                    onClick={() => handleTypeSelect(SupportRequestType.CUSTOM_MESSAGE)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    onClick={() => handleTypeSelect(SupportRequestType.SCHEDULE_MEETING)}
                    className="btn"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1rem',
                      textAlign: 'left',
                      color: '#1a1f2e',
                      fontWeight: '500',
                      transition: 'all 0.3s',
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
                    Schedule Meeting
                  </button>
                </div>
              ) : (
                <div>
                  {/* Selected Type Display */}
                  <div className="mb-3" style={{
                    backgroundColor: '#e7f3ff',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff',
                  }}>
                    <p style={{ margin: 0, color: '#1a1f2e', fontWeight: '500' }}>
                      Selected: {
                        selectedType === SupportRequestType.RAISE_ISSUE ? 'Raise an Issue with the Software' :
                        selectedType === SupportRequestType.INTEGRATE_FEATURE ? 'Needs to Integrate New Feature' :
                        selectedType === SupportRequestType.UI_CHANGE ? 'UI Change Request' :
                        selectedType === SupportRequestType.UPSCALE_PLATFORM ? 'Upscale the Platform' :
                        selectedType === SupportRequestType.CUSTOM_MESSAGE ? 'Custom Message' :
                        'Schedule Meeting'
                      }
                    </p>
                  </div>

                  {/* Integrate Feature - Auto Message */}
                  {selectedType === SupportRequestType.INTEGRATE_FEATURE && (
                    <div className="mb-4" style={{
                      backgroundColor: '#d4edda',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #c3e6cb',
                    }}>
                      <p style={{ margin: 0, color: '#155724', fontWeight: '500' }}>
                        Developer will get in touch with you shortly.
                      </p>
                    </div>
                  )}

                  {/* Text Areas for Issues, UI Change, Upscale, Custom Message */}
                  {(selectedType === SupportRequestType.RAISE_ISSUE ||
                    selectedType === SupportRequestType.UI_CHANGE ||
                    selectedType === SupportRequestType.UPSCALE_PLATFORM) && (
                    <div className="mb-4">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                        Please describe your request:
                      </label>
                      <textarea
                        className="form-control"
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter your comments here..."
                        style={{
                          borderRadius: '0px',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid #dee2e6',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}

                  {/* Custom Message */}
                  {selectedType === SupportRequestType.CUSTOM_MESSAGE && (
                    <div className="mb-4">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                        Your Message:
                      </label>
                      <textarea
                        className="form-control"
                        rows={6}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Enter your custom message here..."
                        style={{
                          borderRadius: '0px',
                          padding: '0.75rem',
                          fontSize: '1rem',
                          border: '1px solid #dee2e6',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}

                  {/* Schedule Meeting Options */}
                  {selectedType === SupportRequestType.SCHEDULE_MEETING && (
                    <>
                      {/* Meeting Platform Selection */}
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                          Select Meeting Platform:
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
                              transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                              if (meetingType !== MeetingType.GOOGLE_MEET) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (meetingType !== MeetingType.GOOGLE_MEET) {
                                e.currentTarget.style.backgroundColor = '#fff';
                              }
                            }}
                          >
                            <i className="bi bi-camera-video me-2"></i>
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
                              transition: 'all 0.3s',
                            }}
                            onMouseEnter={(e) => {
                              if (meetingType !== MeetingType.ZOOM) {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (meetingType !== MeetingType.ZOOM) {
                                e.currentTarget.style.backgroundColor = '#fff';
                              }
                            }}
                          >
                            <i className="bi bi-camera-video-fill me-2"></i>
                            Zoom
                          </button>
                        </div>
                      </div>

                      {/* Meeting Date */}
                      {meetingType && (
                        <div className="mb-4">
                          <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                            Meeting Date
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

                      {/* Time Zone Selection */}
                      {meetingType && (
                        <div className="mb-4">
                          <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                            Select Time Zone:
                          </label>
                          <select
                            className="form-select"
                            value={timeZone || ''}
                            onChange={(e) => setTimeZone(e.target.value as TimeZone)}
                            style={{
                              borderRadius: '0px',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem',
                              border: '1px solid #dee2e6'
                            }}
                          >
                            <option value="">Select Time Zone</option>
                            <option value={TimeZone.US}>US</option>
                            <option value={TimeZone.INDIA}>India</option>
                          </select>
                        </div>
                      )}

                      {/* Time Slot Selection */}
                      {timeZone && (
                        <div className="mb-4">
                          <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem' }}>
                            Select Time Slot:
                          </label>
                          <select
                            className="form-select"
                            value={timeSlot}
                            onChange={(e) => setTimeSlot(e.target.value)}
                            style={{
                              borderRadius: '0px',
                              padding: '0.75rem 1rem',
                              fontSize: '1rem',
                              border: '1px solid #dee2e6'
                            }}
                          >
                            <option value="">Select Time Slot</option>
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

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType(null);
                        setDescription('');
                        setCustomMessage('');
                        setMeetingType(null);
                        setMeetingDate('');
                        setTimeZone(null);
                        setTimeSlot('');
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        sendRequestMutation.isPending ||
                        (selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
                        (selectedType === SupportRequestType.UI_CHANGE && !description) ||
                        (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
                        (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
                        (selectedType === SupportRequestType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                      }
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: (
                          sendRequestMutation.isPending ||
                          (selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
                          (selectedType === SupportRequestType.UI_CHANGE && !description) ||
                          (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
                          (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
                          (selectedType === SupportRequestType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                        ) ? 0.7 : 1,
                        cursor: (
                          sendRequestMutation.isPending ||
                          (selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
                          (selectedType === SupportRequestType.UI_CHANGE && !description) ||
                          (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
                          (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
                          (selectedType === SupportRequestType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot))
                        ) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!sendRequestMutation.isPending && 
                            !((selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
                              (selectedType === SupportRequestType.UI_CHANGE && !description) ||
                              (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
                              (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
                              (selectedType === SupportRequestType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot)))) {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.color = '#1a1f2e';
                          e.currentTarget.style.border = '1px solid #1a1f2e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!sendRequestMutation.isPending && 
                            !((selectedType === SupportRequestType.RAISE_ISSUE && !description) ||
                              (selectedType === SupportRequestType.UI_CHANGE && !description) ||
                              (selectedType === SupportRequestType.UPSCALE_PLATFORM && !description) ||
                              (selectedType === SupportRequestType.CUSTOM_MESSAGE && !customMessage) ||
                              (selectedType === SupportRequestType.SCHEDULE_MEETING && (!meetingType || !meetingDate || !timeZone || !timeSlot)))) {
                          e.currentTarget.style.backgroundColor = '#1a1f2e';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.border = 'none';
                        }
                      }}
                    >
                      {sendRequestMutation.isPending ? 'Sending...' : 'Send Support Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Popup */}
      <StatusPopup
        show={popupShow}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </div>
  );
};
