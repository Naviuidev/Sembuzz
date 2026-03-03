import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { UpdateSchoolDto } from '../services/schools.service';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { StatusPopup } from '../components/StatusPopup';

export const SchoolDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolsService.getById(id!),
    enabled: !!id,
  });

  const { data: features } = useQuery({
    queryKey: ['features'],
    queryFn: schoolsService.getFeatures,
  });

  const [originalFeatures, setOriginalFeatures] = useState<string[]>([]);
  const [featuresChanged, setFeaturesChanged] = useState<boolean>(false);

  const updateFeaturesMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => schoolsService.update(id!, data),
    onSuccess: async () => {
      // Calculate what was added/removed for popup message before invalidating
      const added = selectedFeatures.filter(f => !originalFeatures.includes(f));
      const removed = originalFeatures.filter(f => !selectedFeatures.includes(f));
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['school', id] });
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
      
      // Wait for the refetch to complete - useEffect will update state automatically
      await queryClient.refetchQueries({ 
        queryKey: ['school', id] 
      });
      
      // Show popup with update details
      let message = 'Features updated successfully!';
      if (added.length > 0 || removed.length > 0) {
        if (added.length > 0) {
          const addedNames = features?.filter(f => added.includes(f.code)).map(f => f.name).join(', ') || '';
          message += `\nEnabled: ${addedNames}`;
        }
        if (removed.length > 0) {
          const removedNames = features?.filter(f => removed.includes(f.code)).map(f => f.name).join(', ') || '';
          message += `\nDisabled: ${removedNames}`;
        }
        message += '\n\nAn email notification has been sent to the school admin.';
      }
      
      setPopupShow(true);
      setPopupType('success');
      setPopupMessage(message);
      
      // The useEffect will automatically update selectedFeatures when school data changes
    },
    onError: () => {
      setPopupShow(true);
      setPopupType('error');
      setPopupMessage('Failed to update features. Please try again.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => schoolsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', id] });
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setStatusChanged(false);
      setPopupShow(true);
      setPopupType('success');
      setPopupMessage('School status updated successfully!');
    },
    onError: () => {
      // Revert status on error
      if (school) {
        setCurrentStatus(school.isActive);
        setStatusChanged(false);
      }
      setPopupShow(true);
      setPopupType('error');
      setPopupMessage('Failed to update school status. Please try again.');
    },
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<boolean>(true);
  const [statusChanged, setStatusChanged] = useState<boolean>(false);
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');

  // Update selected features and status when school data loads
  useEffect(() => {
    if (school) {
      const features = school.enabledFeatures.map((f) => f.code);
      setSelectedFeatures(features);
      setOriginalFeatures(features);
      setFeaturesChanged(false);
      setCurrentStatus(school.isActive);
      setStatusChanged(false);
    }
  }, [school]);

  // Check if features have changed
  useEffect(() => {
    if (school && originalFeatures.length >= 0) {
      const hasChanged = 
        selectedFeatures.length !== originalFeatures.length ||
        selectedFeatures.some(f => !originalFeatures.includes(f)) ||
        originalFeatures.some(f => !selectedFeatures.includes(f));
      console.log('[SchoolDetails] Features changed check:', {
        selectedFeatures,
        originalFeatures,
        hasChanged
      });
      setFeaturesChanged(hasChanged);
    }
  }, [selectedFeatures, originalFeatures, school]);

  const handleFeatureToggle = (featureCode: string) => {
    console.log('[SchoolDetails] Toggling feature:', featureCode);
    console.log('[SchoolDetails] Current selectedFeatures:', selectedFeatures);
    const newFeatures = selectedFeatures.includes(featureCode)
      ? selectedFeatures.filter((f) => f !== featureCode)
      : [...selectedFeatures, featureCode];
    console.log('[SchoolDetails] New selectedFeatures:', newFeatures);
    setSelectedFeatures(newFeatures);
  };

  const handleUpdateFeatures = () => {
    updateFeaturesMutation.mutate({ selectedFeatures });
  };

  const handleStatusToggle = () => {
    const newStatus = !currentStatus;
    setCurrentStatus(newStatus);
    setStatusChanged(newStatus !== school?.isActive);
  };

  const handleStatusSubmit = () => {
    updateStatusMutation.mutate({ isActive: currentStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
        <SuperAdminNavbar />
        <div className="d-flex">
          <SuperAdminSidebar />
          <div style={{ flex: 1, padding: '2rem' }}>
            <div className="text-center py-5">
              <p style={{ color: '#6c757d' }}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
        <SuperAdminNavbar />
        <div className="d-flex">
          <SuperAdminSidebar />
          <div style={{ flex: 1, padding: '2rem' }}>
            <div className="text-center py-5">
              <p style={{ color: '#6c757d' }}>School not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SuperAdminNavbar />
      <div className="d-flex">
        <SuperAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="btn btn-link p-0 mb-3"
            style={{
              color: '#1a1f2e',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'normal',
            color: '#1a1f2e',
            marginBottom: '2rem'
          }}>
            {school.name}
          </h1>

          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                marginBottom: '1.5rem'
              }}>
                School Information
              </h2>
              <div className="row g-3">
                <div className="col-md-4">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500' }}>
                    Reference Number
                  </label>
                  <p style={{ color: '#1a1f2e', fontFamily: 'monospace', margin: 0 }}>
                    {school.refNum}
                  </p>
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500' }}>
                    City
                  </label>
                  <p style={{ color: '#1a1f2e', margin: 0 }}>{school.city}</p>
                </div>
                <div className="col-md-4">
                  <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                    Status
                  </label>
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check form-switch" style={{ margin: 0 }}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="statusToggle"
                        checked={currentStatus}
                        onChange={handleStatusToggle}
                        style={{
                          width: '3rem',
                          height: '1.5rem',
                          cursor: 'pointer',
                        }}
                      />
                      <label className="form-check-label" htmlFor="statusToggle" style={{ marginLeft: '0.5rem', cursor: 'pointer' }}>
                        {currentStatus ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                    {statusChanged && (
                      <button
                        onClick={handleStatusSubmit}
                        disabled={updateStatusMutation.isPending}
                        className="btn"
                        style={{
                          backgroundColor: '#1a1f2e',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '0.375rem 1rem',
                          color: '#fff',
                          fontWeight: '500',
                          fontSize: '0.875rem',
                          transition: 'all 0.3s',
                          opacity: updateStatusMutation.isPending ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!updateStatusMutation.isPending) {
                            e.currentTarget.style.backgroundColor = '#fff';
                            e.currentTarget.style.color = '#1a1f2e';
                            e.currentTarget.style.border = '1px solid #1a1f2e';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!updateStatusMutation.isPending) {
                            e.currentTarget.style.backgroundColor = '#1a1f2e';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.border = 'none';
                          }
                        }}
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
            <div className="card-body p-4">
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'normal',
                color: '#1a1f2e',
                marginBottom: '1.5rem'
              }}>
                Features
              </h2>
              <div className="row g-3 mb-4">
                {features && features.length > 0 ? (
                  features.map((feature) => {
                    const isChecked = selectedFeatures.includes(feature.code);
                    return (
                      <div key={feature.id} className="col-md-4 col-sm-6">
                        <div 
                          className="form-check p-3" 
                          style={{
                            border: isChecked
                              ? '2px solid #1a1f2e'
                              : '1px solid #dee2e6',
                            borderRadius: '0px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            backgroundColor: isChecked
                              ? 'rgba(26, 31, 46, 0.05)'
                              : 'transparent',
                            userSelect: 'none'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFeatureToggle(feature.code);
                          }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isChecked}
                            readOnly
                            tabIndex={-1}
                            style={{ marginTop: '0.5rem', cursor: 'pointer', pointerEvents: 'none' }}
                          />
                          <label 
                            className="form-check-label ms-2" 
                            style={{ cursor: 'pointer', userSelect: 'none', pointerEvents: 'none' }}
                          >
                            {feature.name}
                          </label>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12">
                    <p style={{ color: '#6c757d' }}>Loading features...</p>
                  </div>
                )}
              </div>
              {featuresChanged && (
                <div className="d-flex justify-content-end mt-4">
                  <button
                    onClick={handleUpdateFeatures}
                    disabled={updateFeaturesMutation.isPending}
                    className="btn"
                    style={{
                      backgroundColor: '#1a1f2e',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      opacity: updateFeaturesMutation.isPending ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!updateFeaturesMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#1a1f2e';
                        e.currentTarget.style.border = '1px solid #1a1f2e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!updateFeaturesMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#1a1f2e';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.border = 'none';
                      }
                    }}
                  >
                    {updateFeaturesMutation.isPending ? 'Updating...' : 'Update Features'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {school.admin && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  marginBottom: '1.5rem'
                }}>
                  School Admin
                </h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500' }}>
                      Name
                    </label>
                    <p style={{ color: '#1a1f2e', margin: 0 }}>{school.admin.name}</p>
                  </div>
                  <div className="col-md-6">
                    <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500' }}>
                      Email
                    </label>
                    <p style={{ color: '#1a1f2e', margin: 0 }}>{school.admin.email}</p>
                  </div>
                  <div className="col-md-12">
                    <label style={{ fontSize: '0.875rem', color: '#6c757d', fontWeight: '500' }}>
                      Password
                    </label>
                    <p style={{ color: '#1a1f2e', margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {school.admin.password || 'Password was set during school creation. Check creation email for temporary password.'}
                    </p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Note: Password is hashed for security. The temporary password was sent via email during school creation.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <StatusPopup
        show={popupShow}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </div>
  );
};
