import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsService } from '../services/schools.service';
import type { UpdateSchoolDto } from '../services/schools.service';
import { SuperAdminNavbar } from '../components/SuperAdminNavbar';
import { SuperAdminSidebar } from '../components/SuperAdminSidebar';
import { US_STATES, US_CITIES_BY_STATE } from '../data/countries-states';
import { StatusPopup } from '../components/StatusPopup';

export const EditSchool = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<UpdateSchoolDto>({
    schoolName: '',
    country: 'US',
    state: '',
    city: '',
    selectedFeatures: [],
    adminEmail: '',
    tenure: undefined,
  });
  const [popupShow, setPopupShow] = useState<boolean>(false);
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [popupMessage, setPopupMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: schoolsService.getAll,
  });

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    if (!searchQuery.trim()) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.refNum.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);

  const { data: school, isLoading: isLoadingSchool } = useQuery({
    queryKey: ['school', selectedSchoolId],
    queryFn: () => schoolsService.getById(selectedSchoolId),
    enabled: !!selectedSchoolId,
  });

  const { data: features } = useQuery({
    queryKey: ['features'],
    queryFn: schoolsService.getFeatures,
  });

  // Populate form when school is selected
  useEffect(() => {
    if (school) {
      setFormData({
        schoolName: school.name,
        country: school.country || 'US',
        state: school.state || '',
        city: school.city,
        selectedFeatures: school.enabledFeatures.map((f) => f.code),
        adminEmail: school.admin?.email || '',
        tenure: school.tenure,
      });
    }
  }, [school]);

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

  const handleFeatureToggle = (featureCode: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures?.includes(featureCode)
        ? prev.selectedFeatures.filter((f) => f !== featureCode)
        : [...(prev.selectedFeatures || []), featureCode],
    }));
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => schoolsService.update(selectedSchoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['school', selectedSchoolId] });
      setPopupType('success');
      setPopupMessage('School updated successfully!');
      setPopupShow(true);
    },
    onError: (error: any) => {
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to update school');
      setPopupShow(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => schoolsService.delete(selectedSchoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setShowDeleteConfirm(false);
      setPopupType('success');
      setPopupMessage('School deleted successfully!');
      setPopupShow(true);
      setSelectedSchoolId('');
      setFormData({
        schoolName: '',
        country: 'US',
        state: '',
        city: '',
        selectedFeatures: [],
        adminEmail: '',
        tenure: undefined,
      });
    },
    onError: (error: any) => {
      setShowDeleteConfirm(false);
      setPopupType('error');
      setPopupMessage(error.response?.data?.message || 'Failed to delete school');
      setPopupShow(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      alert('Please select a school to edit');
      return;
    }
    if (formData.selectedFeatures?.length === 0) {
      alert('Please select at least one feature');
      return;
    }
    if (!formData.state) {
      alert('Please select a state');
      return;
    }
    if (!formData.city) {
      alert('Please select a city');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (!selectedSchoolId) {
      alert('Please select a school to delete');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

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
            Edit School
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
          {!selectedSchoolId && (
            <div className="row g-3 justify-content-center mb-4">
              {filteredSchools && filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <div key={school.id} className="col-md-3 col-sm-6">
                    <div
                      onClick={() => setSelectedSchoolId(school.id)}
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
                        color: '#1a1f2e !important'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 2%)';
                      }}
                    >
                      <span style={{
                        color: '#1a1f2e',
                        fontWeight: '500',
                        fontSize: '1rem'
                      }}>
                        {school.name}
                      </span>
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
          )}

          {/* Edit Form */}
          {selectedSchoolId && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    margin: 0
                  }}>
                    Edit School Details
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSchoolId('');
                      setFormData({
                        schoolName: '',
                        country: 'US',
                        state: '',
                        city: '',
                        selectedFeatures: [],
                        adminEmail: '',
                        tenure: undefined,
                      });
                    }}
                    className="btn"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dee2e6',
                      borderRadius: '50px',
                      padding: '0.5rem 1rem',
                      color: '#1a1f2e',
                      fontWeight: '500'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to List
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {isLoadingSchool ? (
                    <div className="text-center py-5">
                      <p style={{ color: '#6c757d' }}>Loading school data...</p>
                    </div>
                  ) : (
                    <>
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
                        <div className="row g-3">
                          {features?.map((feature) => (
                            <div key={feature.id} className="col-md-4 col-sm-6">
                              <div className="form-check p-3" style={{
                                border: formData.selectedFeatures?.includes(feature.code) 
                                  ? '2px solid #1a1f2e' 
                                  : '1px solid #dee2e6',
                                borderRadius: '0px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                backgroundColor: formData.selectedFeatures?.includes(feature.code)
                                  ? 'rgba(26, 31, 46, 0.05)'
                                  : 'transparent'
                              }}
                              onClick={() => handleFeatureToggle(feature.code)}
                              >
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={formData.selectedFeatures?.includes(feature.code)}
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
                        {formData.selectedFeatures?.length === 0 && (
                          <p className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
                            Please select at least one feature
                          </p>
                        )}
                      </div>

                      {/* Admin Information */}
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
                              style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="d-flex justify-content-between align-items-center pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="btn"
                          style={{
                            backgroundColor: '#dc3545',
                            border: 'none',
                            borderRadius: '50px',
                            padding: '0.5rem 1.5rem',
                            color: '#fff',
                            fontWeight: '500',
                            transition: 'all 0.3s',
                            opacity: deleteMutation.isPending ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!deleteMutation.isPending) {
                              e.currentTarget.style.backgroundColor = '#c82333';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!deleteMutation.isPending) {
                              e.currentTarget.style.backgroundColor = '#dc3545';
                            }
                          }}
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete School'}
                        </button>
                        <div className="d-flex gap-3">
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
                            disabled={updateMutation.isPending}
                            className="btn"
                            style={{
                              backgroundColor: '#1a1f2e',
                              border: 'none',
                              borderRadius: '50px',
                              padding: '0.5rem 1.5rem',
                              color: '#fff',
                              fontWeight: '500',
                              transition: 'all 0.3s',
                              opacity: updateMutation.isPending ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!updateMutation.isPending) {
                                e.currentTarget.style.backgroundColor = '#fff';
                                e.currentTarget.style.color = '#1a1f2e';
                                e.currentTarget.style.border = '1px solid #1a1f2e';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!updateMutation.isPending) {
                                e.currentTarget.style.backgroundColor = '#1a1f2e';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.border = 'none';
                              }
                            }}
                          >
                            {updateMutation.isPending ? 'Updating...' : 'Update School'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '0px' }}>
              <div className="modal-header border-0">
                <h5 className="modal-title" style={{ color: '#1a1f2e' }}>
                  Confirm Delete
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p style={{ color: '#6c757d' }}>
                  Are you sure you want to delete <strong>{school?.name}</strong>? 
                  This action cannot be undone and will delete all associated data.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#1a1f2e',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  style={{
                    backgroundColor: '#dc3545',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    color: '#fff',
                    fontWeight: '500',
                    opacity: deleteMutation.isPending ? 0.7 : 1
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
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
