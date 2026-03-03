import { Navbar } from '../components/Navbar';
import { useState } from 'react';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h1 className="text-center mb-5" style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700',
              color: '#1a1f2e'
            }}>
              Contact Us
            </h1>
            
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-5">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="form-label" style={{ fontWeight: '500' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ borderRadius: '8px', padding: '0.75rem' }}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label" style={{ fontWeight: '500' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ borderRadius: '8px', padding: '0.75rem' }}
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="message" className="form-label" style={{ fontWeight: '500' }}>
                      Message
                    </label>
                    <textarea
                      className="form-control"
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{ borderRadius: '8px', padding: '0.75rem' }}
                      placeholder="Your message..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    style={{
                      backgroundColor: '#4dabf7',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontWeight: '600'
                    }}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
