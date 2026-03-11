import { Navbar } from '../components/Navbar';
import { useState } from 'react';
import { submitContact } from '../services/contact.service';

const INTENT_OPTIONS = [
  { value: '', label: 'Choose...' },
  { value: 'book_slot', label: 'Book slot' },
  { value: 'raise_query', label: 'Raise query' },
  { value: 'need_support', label: 'Need support' },
];

export const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    intent: '',
    message: '',
    query: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    try {
      await submitContact({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        intent: formData.intent,
        message: formData.message.trim(),
        ...(formData.intent === 'raise_query' && { query: formData.query.trim() }),
      });
      setSubmitStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', intent: '', message: '', query: '' });
    } catch (err: unknown) {
      setSubmitStatus('error');
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }).response : undefined;
      const msg = res?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : undefined;
      setErrorMessage(text || (res ? 'Request failed. Please try again.' : 'Network error. Check your connection and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen contact-page-bg">
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="contact-card card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h1 className="contact-title">Contact Us</h1>
                <p className="contact-subtitle">We'd love to hear from you</p>
                <p className="contact-description">
                  Get in touch for support, partnership inquiries, or to book a slot. Our team will get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="firstName" className="form-label contact-label">First name</label>
                      <input
                        type="text"
                        className="form-control contact-input"
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="lastName" className="form-label contact-label">Last name</label>
                      <input
                        type="text"
                        className="form-control contact-input"
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-0">
                    <div className="col-12">
                      <label htmlFor="email" className="form-label contact-label">Email</label>
                      <input
                        type="email"
                        className="form-control contact-input"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-0">
                    <div className="col-12">
                      <label htmlFor="intent" className="form-label contact-label">I want to</label>
                      <select
                        className="form-select contact-select"
                        id="intent"
                        value={formData.intent}
                        onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                      >
                        {INTENT_OPTIONS.map((opt) => (
                          <option key={opt.value || 'choose'} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.intent === 'raise_query' && (
                    <div className="mt-3">
                      <label htmlFor="query" className="form-label contact-label">Your query</label>
                      <input
                        type="text"
                        className="form-control contact-input"
                        id="query"
                        value={formData.query}
                        onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                        placeholder="Enter your query"
                        required={formData.intent === 'raise_query'}
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <label htmlFor="message" className="form-label contact-label">Message</label>
                    <textarea
                      className="form-control contact-input contact-textarea"
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Your message..."
                    />
                  </div>

                  {submitStatus === 'error' && (
                    <div className="alert alert-danger mt-3 mb-0" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn contact-submit-btn rounded-pill mt-4 px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Submit'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact popup: Sembuzz animation while submitting, then success message */}
      {(submitting || submitStatus === 'success') && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-body text-center py-4 px-4">
                {submitting ? (
                  <div className="sembuzz-loader-word sembuzz-loader-in-popup" aria-live="polite" aria-busy="true">
                    {'Sembuzz'.split('').map((letter, i) => (
                      <span key={i} className="sembuzz-loader-letter" style={{ animationDelay: `${i * 0.04}s` }}>
                        {letter}
                      </span>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }} aria-hidden />
                    </div>
                    <p className="mb-4 text-muted">We received your request. We will get in touch with you shortly.</p>
                    <button
                      type="button"
                      className="btn btn-dark rounded-pill px-4"
                      onClick={() => setSubmitStatus('idle')}
                    >
                      OK
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
