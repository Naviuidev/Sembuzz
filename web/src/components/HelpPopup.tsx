import { useState } from 'react';
import { api } from '../config/api';

interface HelpPopupProps {
  onClose: () => void;
}

export const HelpPopup = ({ onClose }: HelpPopupProps) => {
  const [helpType, setHelpType] = useState<string>('');
  const [meetingType, setMeetingType] = useState<string>('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
  ];

  const timeZones = [
    'America/New_York (EST)',
    'America/Chicago (CST)',
    'America/Denver (MST)',
    'America/Los_Angeles (PST)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        type: helpType,
        description,
      };

      if (helpType === 'schedule_meeting') {
        if (!meetingType || !date || !timeSlot || !timeZone) {
          setError('Please fill all meeting details');
          setLoading(false);
          return;
        }
        payload.meetingType = meetingType;
        payload.date = date;
        payload.timeSlot = timeSlot;
        payload.timeZone = timeZone;
      }

      await api.post('/queries', payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="card" style={{ maxWidth: '400px', borderRadius: '0px' }}>
          <div className="card-body text-center p-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
            <h3 className="mt-3">Request Submitted!</h3>
            <p className="text-muted">Your request has been sent to the Super Admin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
      <div className="card" style={{ maxWidth: '600px', width: '90%', borderRadius: '0px' }}>
        <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1a1f2e', color: 'white' }}>
          <h5 className="mb-0">Help & Support</h5>
          <button
            className="btn btn-link text-white p-0"
            onClick={onClose}
            style={{ textDecoration: 'none', fontSize: '1.5rem' }}
          >
            ×
          </button>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '500' }}>Select Help Type *</label>
              <select
                className="form-select"
                required
                value={helpType}
                onChange={(e) => {
                  setHelpType(e.target.value);
                  setMeetingType('');
                  setDate('');
                  setTimeSlot('');
                  setTimeZone('');
                }}
                style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
              >
                <option value="">Select help type</option>
                <option value="dev_support">Dev Support Help</option>
                <option value="features_not_working">Features Not Working</option>
                <option value="schedule_meeting">Schedule a Meeting</option>
              </select>
            </div>

            {helpType === 'schedule_meeting' && (
              <>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '500' }}>Meeting Type *</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="meetingType"
                        id="googleMeet"
                        value="google_meet"
                        checked={meetingType === 'google_meet'}
                        onChange={(e) => setMeetingType(e.target.value)}
                        required
                      />
                      <label className="form-check-label" htmlFor="googleMeet">
                        Google Meet
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="meetingType"
                        id="zoom"
                        value="zoom"
                        checked={meetingType === 'zoom'}
                        onChange={(e) => setMeetingType(e.target.value)}
                        required
                      />
                      <label className="form-check-label" htmlFor="zoom">
                        Zoom
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '500' }}>Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '500' }}>Time Slot *</label>
                  <select
                    className="form-select"
                    required
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                  >
                    <option value="">Select time slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '500' }}>Time Zone *</label>
                  <select
                    className="form-select"
                    required
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                  >
                    <option value="">Select time zone</option>
                    {timeZones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="form-label" style={{ fontWeight: '500' }}>Description</label>
              <textarea
                className="form-control"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
                style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
              />
            </div>

            <div className="d-flex gap-3">
              <button
                type="button"
                className="btn"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #dee2e6',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn"
                style={{
                  backgroundColor: '#1a1f2e',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  color: '#fff',
                  flex: 1
                }}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
