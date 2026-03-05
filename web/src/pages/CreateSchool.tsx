import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { CreateSchoolDto } from '../services/schools.service';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { US_STATES, US_CITIES_BY_STATE } from '../data/countries-states';

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
            refNum: response.credentials.refNum,
            tempPassword: response.credentials.tempPassword,
            adminEmail: response.credentials.adminEmail,
            emailSent: response.emailSent || false,
            emailError: response.emailError,
            adsAdminEmail: response.credentials.adsAdminEmail,
            adsTempPassword: response.credentials.adsTempPassword,
            adsEmailSent: response.credentials.adsEmailSent,
            adsEmailError: response.credentials.adsEmailError,
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
    setFormData((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureCode)
        ? prev.selectedFeatures.filter((f) => f !== featureCode)
        : [...prev.selectedFeatures, featureCode],
    }));
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          {/* Success Modal with Credentials */}
          {successModal.isOpen && successModal.data && (
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
                zIndex: 1050,
              }}
              onClick={() => {
                setSuccessModal({ isOpen: false, data: null });
                navigate('/super-admin/dashboard');
              }}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '500px',
                  maxWidth: '600px',
                  width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <i
                      className="bi bi-check-circle-fill"
                      style={{ fontSize: '2rem', color: '#28a745', marginRight: '1rem' }}
                    ></i>
                    <h3
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'normal',
                        color: '#1a1f2e',
                        margin: 0,
                      }}
                    >
                      School Created Successfully
                    </h3>
                  </div>

                  {!successModal.data.emailSent && (
                    <div className="alert alert-warning mb-3" style={{ borderRadius: '0px' }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Email not sent:</strong> {successModal.data.emailError || 'SMTP configuration issue'}
                      <br />
                      <small>Please save the credentials below and send them manually to the admin.</small>
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.5rem',
                      borderRadius: '0px',
                      border: '1px solid #dee2e6',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#1a1f2e', marginBottom: '1rem' }}>
                      Admin Credentials
                    </h4>
                    <div className="mb-2">
                      <strong>Reference Number:</strong>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          backgroundColor: 'white',
                          padding: '0.5rem',
                          borderRadius: '0px',
                          marginTop: '0.25rem',
                          border: '1px solid #dee2e6',
                        }}
                      >
                        {successModal.data.refNum}
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          backgroundColor: 'white',
                          padding: '0.5rem',
                          borderRadius: '0px',
                          marginTop: '0.25rem',
                          border: '1px solid #dee2e6',
                        }}
                      >
                        {successModal.data.adminEmail}
                      </div>
                    </div>
                    <div>
                      <strong>Temporary Password:</strong>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          backgroundColor: 'white',
                          padding: '0.5rem',
                          borderRadius: '0px',
                          marginTop: '0.25rem',
                          border: '1px solid #dee2e6',
                          color: '#dc3545',
                          fontWeight: 'bold',
                        }}
                      >
                        {successModal.data.tempPassword}
                      </div>
                    </div>
                  </div>

                  {successModal.data.adsAdminEmail && (
                    <>
                      {!successModal.data.adsEmailSent && successModal.data.adsEmailError && (
                        <div className="alert alert-warning mb-3" style={{ borderRadius: '0px' }}>
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          <strong>Ads Admin email not sent:</strong> {successModal.data.adsEmailError}
                          <br />
                          <small>Please save the Ads Admin credentials below and send them manually.</small>
                        </div>
                      )}
                      <h4 style={{ fontSize: '1rem', fontWeight: '500', color: '#1a1f2e', marginBottom: '1rem', marginTop: '1rem' }}>
                        Ads Admin Credentials
                      </h4>
                      <div
                        style={{
                          backgroundColor: '#f8f9fa',
                          padding: '1rem',
                          borderRadius: '0px',
                          border: '1px solid #dee2e6',
                          marginBottom: '1rem',
                        }}
                      >
                        <div className="mb-2">
                          <strong>Ads Admin Email:</strong>
                          <div style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #dee2e6' }}>
                            {successModal.data.adsAdminEmail}
                          </div>
                        </div>
                        <div>
                          <strong>Temporary Password:</strong>
                          <div style={{ fontFamily: 'monospace', backgroundColor: 'white', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #dee2e6', color: '#dc3545', fontWeight: 'bold' }}>
                            {successModal.data.adsTempPassword}
                          </div>
                        </div>
                        <small className="text-muted d-block mt-2">Ads Admin can log in at /ads-admin/login to manage banner and sponsored ads.</small>
                      </div>
                    </>
                  )}

                  <div className="d-flex justify-content-end">
                    <button
                      onClick={() => {
                        setSuccessModal({ isOpen: false, data: null });
                        navigate('/super-admin/dashboard');
                      }}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#1a1f2e';
                        e.currentTarget.style.border = '1px solid #1a1f2e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1f2e';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.border = 'none';
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Modal */}
          {errorModal.isOpen && (
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
                zIndex: 1050,
              }}
              onClick={() => setErrorModal({ isOpen: false, message: '' })}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '500px',
                  width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <i
                      className="bi bi-exclamation-triangle-fill"
                      style={{ fontSize: '2rem', color: '#dc3545', marginRight: '1rem' }}
                    ></i>
                    <h3
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'normal',
                        color: '#1a1f2e',
                        margin: 0,
                      }}
                    >
                      Error
                    </h3>
                  </div>
                  <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>{errorModal.message}</p>
                  <div className="d-flex justify-content-end">
                    <button
                      onClick={() => setErrorModal({ isOpen: false, message: '' })}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#1a1f2e';
                        e.currentTarget.style.border = '1px solid #1a1f2e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1f2e';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.border = 'none';
                      }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '2rem'
          }}>
            Create New School
          </h1>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* School Information */}
                <div className="mb-4">
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem'
                  }}>
                    School Information
                  </h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        School Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.schoolName}
                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder="Greenwood High School"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Country
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value="United States"
                        disabled
                        style={{ 
                          borderRadius: '0px', 
                          padding: '0.75rem 1rem',
                          backgroundColor: '#f8f9fa',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        State *
                      </label>
                      <select
                        className="form-select"
                        required
                        value={formData.state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        City *
                      </label>
                      <select
                        className="form-select"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={!formData.state}
                        style={{ 
                          borderRadius: '0px', 
                          padding: '0.75rem 1rem',
                          backgroundColor: !formData.state ? '#f8f9fa' : 'white',
                          cursor: !formData.state ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <option value="">{formData.state ? 'Select City' : 'Select State first'}</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Domain Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="e.g., school.edu"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Must match the domain of the admin email
                      </small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Tenure of Project (months)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.tenure || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          tenure: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="e.g., 12"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        School Image
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                      </small>
                      {imagePreview && (
                        <div className="mt-3" style={{ maxWidth: '300px' }}>
                          <img
                            src={imagePreview}
                            alt="School preview"
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '0px',
                              border: '1px solid #dee2e6',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, image: undefined });
                            }}
                            className="btn btn-sm mt-2"
                            style={{
                              backgroundColor: '#dc3545',
                              border: 'none',
                              borderRadius: '0px',
                              color: '#fff',
                              padding: '0.25rem 0.75rem',
                            }}
                          >
                            Remove Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features Selection */}
                <div className="mb-4">
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem'
                  }}>
                    Select Features *
                  </h2>
                  {featuresLoading && (
                    <p className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>Loading features...</p>
                  )}
                  {featuresError && (
                    <p className="text-danger mb-2" style={{ fontSize: '0.875rem' }}>Unable to load features. Make sure the backend is running and refresh the page.</p>
                  )}
                  {!featuresLoading && !featuresError && (!features || features.length === 0) && (
                    <p className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>No features available. Run the feature seed on the backend (npm run prisma:seed).</p>
                  )}
                  <div className="row g-3">
                    {features?.map((feature) => (
                      <div key={feature.id} className="col-md-4 col-sm-6">
                        <div className="form-check p-3" style={{
                          border: formData.selectedFeatures.includes(feature.code) 
                            ? '2px solid #1a1f2e' 
                            : '1px solid #dee2e6',
                          borderRadius: '0px',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          backgroundColor: formData.selectedFeatures.includes(feature.code)
                            ? 'rgba(26, 31, 46, 0.05)'
                            : 'transparent'
                        }}
                        onClick={() => handleFeatureToggle(feature.code)}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formData.selectedFeatures.includes(feature.code)}
                            onChange={() => handleFeatureToggle(feature.code)}
                            style={{ marginTop: '0.5rem' }}
                          />
                          <label className="form-check-label ms-2" style={{ cursor: 'pointer' }}>
                            {feature.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.selectedFeatures.length === 0 && (
                    <p className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
                      Please select at least one feature
                    </p>
                  )}
                </div>

                {/* School Admin Information */}
                <div className="mb-4">
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem'
                  }}>
                    School Admin Information
                  </h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder="admin@school.edu"
                        style={{
                          borderRadius: '0px',
                          padding: '0.75rem 1rem',
                          borderColor: formData.domain && formData.adminEmail && !validateDomainMatch() ? '#dc3545' : undefined,
                        }}
                      />
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Reference Number will be auto-generated. Temporary password will be sent via email.
                      </small>
                      {formData.domain && formData.adminEmail && !validateDomainMatch() && (
                        <small className="text-danger" style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                          Email domain must match the school domain ({formData.domain})
                        </small>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ads Admin Information - shown when Ads feature is selected */}
                {formData.selectedFeatures.includes('ADS') && (
                  <div className="mb-4">
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'normal',
                      color: '#1a1f2e',
                      marginBottom: '1.5rem'
                    }}>
                      Ads Admin Information
                    </h2>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                          Ads Admin Email *
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.adsAdminEmail ?? ''}
                          onChange={(e) => setFormData({ ...formData, adsAdminEmail: e.target.value })}
                          placeholder="ads@school.edu"
                          style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                        />
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          This user will manage banner and sponsored ads for the school. Temporary password will be sent via email.
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex justify-content-end gap-3 pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/super-admin/dashboard')}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#1a1f2e',
                      fontWeight: '500',
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
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      opacity: createMutation.isPending ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!createMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#1a1f2e';
                        e.currentTarget.style.border = '1px solid #1a1f2e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!createMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#1a1f2e';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.border = 'none';
                      }
                    }}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
