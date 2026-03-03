import { useState } from 'react';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';

export const SubCategoryAdminRaiseQuery = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement query submission
    console.log('Query submission:', formData);
  };

  return (
    <SubCategoryAdminLayout>
      <div className="mb-4">
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'normal',
          color: '#1a1f2e',
          marginBottom: '0.5rem'
        }}>
          Raise a query
        </h1>
        <p style={{
          color: '#6c757d',
          fontSize: '1rem',
          marginBottom: 0
        }}>
          Submit a query or question to the category admin
        </p>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '0px' }}>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-12">
                <label htmlFor="subject" className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>
                  Subject <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="subject"
                  style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Enter query subject"
                />
              </div>

              <div className="col-md-12">
                <label htmlFor="priority" className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>
                  Priority
                </label>
                <select
                  className="form-select"
                  id="priority"
                  style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="col-md-12">
                <label htmlFor="message" className="form-label" style={{ color: '#1a1f2e', fontWeight: '500' }}>
                  Message <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  id="message"
                  rows={8}
                  style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  placeholder="Enter your query or question details"
                />
              </div>

              <div className="col-12">
                <button
                  type="submit"
                  className="btn"
                  style={{
                    backgroundColor: '#1a1f2e',
                    color: 'white',
                    borderRadius: '0px',
                    padding: '0.75rem 2rem',
                    fontWeight: '500',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2d3748';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                  }}
                >
                  Submit Query
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </SubCategoryAdminLayout>
  );
};
