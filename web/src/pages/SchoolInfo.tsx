import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { School } from '../services/schools.service';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { StatusPopup } from '../components/StatusPopup';

export const SchoolInfo = () => {
  const [hoveredSchoolCard, setHoveredSchoolCard] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEmailPopup, setShowEmailPopup] = useState<boolean>(false);
  const [selectedSchoolForEmail, setSelectedSchoolForEmail] = useState<School | null>(null);
  const [selectedEmailType, setSelectedEmailType] = useState<string>('');
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  // Filter schools based on search
  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.city.toLowerCase().includes(query) ||
        school.state?.toLowerCase().includes(query) ||
        school.refNum.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

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
      setShowEmailPopup(false);
      setSelectedSchoolForEmail(null);
      setSelectedEmailType('');
    },
    onError: (error: any) => {
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to send email');
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
    { value: 'complete_info', label: 'Send Complete School Info' },
    { value: 'features_selected', label: 'Send Features Selected' },
    { value: 'tenure_ends_soon', label: 'Send Tenure Ends Soon Intimation' },
    { value: 'refnum', label: 'Send RefNum' },
  ];

  // Get email preview data
  const getEmailPreview = () => {
    if (!selectedSchoolForEmail || !selectedEmailType) return null;

    switch (selectedEmailType) {
      case 'complete_info':
        return {
          subject: `Complete School Information - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Location': `${selectedSchoolForEmail.city}${selectedSchoolForEmail.state ? `, ${selectedSchoolForEmail.state}` : ''}${selectedSchoolForEmail.country ? `, ${selectedSchoolForEmail.country}` : ''}`,
            'Tenure': selectedSchoolForEmail.tenure ? `${selectedSchoolForEmail.tenure} months` : 'Not set',
            'School Admin': selectedSchoolForEmail.admin ? `${selectedSchoolForEmail.admin.name} (${selectedSchoolForEmail.admin.email})` : 'Not assigned',
            'Enabled Features': selectedSchoolForEmail.enabledFeatures.map(f => f.name).join(', ') || 'None',
          }
        };

      case 'features_selected':
        return {
          subject: `Selected Features - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Enabled Features': selectedSchoolForEmail.enabledFeatures.map(f => f.name).join(', ') || 'None',
          }
        };

      case 'tenure_ends_soon':
        return {
          subject: `Tenure Renewal Reminder - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Total Tenure': selectedSchoolForEmail.tenure ? `${selectedSchoolForEmail.tenure} months` : 'Not set',
            'Message': 'Your school tenure is ending soon. Please contact us to renew your tenure and continue enjoying our services.',
          }
        };

      case 'refnum':
        return {
          subject: `Reference Number - ${selectedSchoolForEmail.name}`,
          content: {
            'School Name': selectedSchoolForEmail.name,
            'Reference Number': selectedSchoolForEmail.refNum,
            'Message': 'Please keep this reference number safe. You can use it to log in or for any support requests.',
          }
        };

      default:
        return null;
    }
  };

  const emailPreview = getEmailPreview();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '2rem'
          }}>
            School Information
          </h1>

          {/* Search Bar */}
          <div className="mb-4" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
            <div style={{ position: 'relative' }}>
              <i 
                className="bi bi-search" 
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '1.1rem'
                }}
              ></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search Existing Tenants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: '50px',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  fontSize: '1rem',
                  border: '1px solid #dee2e6'
                }}
              />
            </div>
          </div>

          {/* School Cards Grid */}
          <div className="row justify-content-center g-3 mb-4">
            {filteredSchools && filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <div key={school.id} className="col-md-3 col-sm-6">
                  <div
                    onClick={() => handleSchoolCardClick(school)}
                    onMouseEnter={(e) => {
                      setHoveredSchoolCard(school);
                      e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                    }}
                    onMouseLeave={(e) => {
                      setHoveredSchoolCard(null);
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    style={{
                      border: '1px solid rgb(26, 31, 46)',
                      borderRadius: '4px',
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: '0.3s',
                      textAlign: 'center',
                      minHeight: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a1f2e !important',
                      position: 'relative'
                    }}
                  >
                    <span style={{
                      color: '#1a1f2e',
                      fontWeight: '500',
                      fontSize: '1rem'
                    }}>
                      {school.name}
                    </span>

                    {/* Tooltip */}
                    {hoveredSchoolCard?.id === school.id && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '0.75rem',
                          padding: '1.25rem',
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          zIndex: 1000,
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                          minWidth: '280px',
                          maxWidth: '320px',
                        }}
                      >
                        {/* Tooltip Pointer */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid #fff',
                          }}
                        />
                        
                        {/* Title */}
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#1a1f2e',
                          fontSize: '1rem',
                          marginBottom: '0.75rem'
                        }}>
                          {school.name}
                        </div>
                        
                        {/* Body Text */}
                        <div style={{ 
                          color: '#6c757d',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            {school.city}{school.state && `, ${school.state}`}
                          </div>
                          {school.admin && (
                            <div>
                              {school.admin.email}
                            </div>
                          )}
                        </div>
                        
                        {/* Button */}
                        
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <p style={{ color: '#6c757d' }}>
                  {searchQuery ? 'No schools found matching your search.' : 'No schools available.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Popup */}
      {showEmailPopup && selectedSchoolForEmail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => {
            setShowEmailPopup(false);
            setSelectedSchoolForEmail(null);
            setSelectedEmailType('');
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowEmailPopup(false);
                setSelectedSchoolForEmail(null);
                setSelectedEmailType('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: '#1a1f2e',
                border: 'none',
                fontSize: '1rem',
                color: 'white',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1f2e';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1a1f2e',
                marginBottom: '1.5rem',
                marginTop: 0,
                paddingRight: '3rem',
              }}
            >
              Send Email to {selectedSchoolForEmail.name}
            </h3>

            {/* Email Type Dropdown */}
            <div className="mb-4">
              <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem', display: 'block' }}>
                Select Email Type
              </label>
              <select
                className="form-select"
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value)}
                style={{
                  borderRadius: '0px',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: '1px solid #dee2e6',
                  width: '100%'
                }}
              >
                <option value="">Choose an option...</option>
                {emailOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Preview */}
            {selectedEmailType && emailPreview && (
              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e', marginBottom: '0.5rem', display: 'block' }}>
                  Email Preview
                </label>
                <div
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '1.5rem',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="mb-3">
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>To:</strong>
                    <span style={{ color: '#6c757d', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                      {selectedSchoolForEmail.admin?.email || 'No admin email'}
                    </span>
                  </div>
                  <div className="mb-3">
                    <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>Subject:</strong>
                    <span style={{ color: '#6c757d', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                      {emailPreview.subject}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#1a1f2e', display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Content:</strong>
                    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
                      {Object.entries(emailPreview.content).map(([key, value]) => (
                        <div key={key} className="mb-2" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                          <strong style={{ color: '#1a1f2e', fontSize: '0.875rem' }}>{key}:</strong>
                          <div style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEmailPopup(false);
                  setSelectedSchoolForEmail(null);
                  setSelectedEmailType('');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #dee2e6',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  color: '#1a1f2e',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={!selectedEmailType || sendEmailMutation.isPending}
                style={{
                  backgroundColor: '#1a1f2e',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  color: '#fff',
                  fontWeight: '500',
                  cursor: (!selectedEmailType || sendEmailMutation.isPending) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedEmailType || sendEmailMutation.isPending) ? 0.7 : 1,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  if (selectedEmailType && !sendEmailMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#1a1f2e';
                    e.currentTarget.style.border = '1px solid #1a1f2e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEmailType && !sendEmailMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.border = 'none';
                  }
                }}
              >
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

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
