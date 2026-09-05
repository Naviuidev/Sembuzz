import { useState } from 'react';
import { submitContact } from '../services/contact.service';

const CONTACT_INTENT_OPTIONS = [
  { value: '', label: 'Choose...' },
  { value: 'book_slot', label: 'Book slot' },
  { value: 'raise_query', label: 'Raise query' },
  { value: 'need_support', label: 'Need support' },
];

const CONTACT_CHANNELS = [
  {
    icon: 'bi-envelope',
    title: 'Email us',
    text: 'contact@sdmlllc.com',
    href: 'mailto:contact@sdmlllc.com',
  },
  {
    icon: 'bi-clock',
    title: 'Response time',
    text: 'Within 24 hours on business days',
  },
  {
    icon: 'bi-building',
    title: 'Partnerships',
    text: 'Universities, advertisers, and campus demos',
  },
];

export function HomeContactSection() {
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    intent: '',
    message: '',
    query: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactStatus('idle');
    setContactError('');
    try {
      await submitContact({
        firstName: contactForm.firstName.trim(),
        lastName: contactForm.lastName.trim(),
        email: contactForm.email.trim(),
        intent: contactForm.intent,
        message: contactForm.message.trim(),
        ...(contactForm.intent === 'raise_query' && { query: contactForm.query.trim() }),
      });
      setContactStatus('success');
      setContactForm({ firstName: '', lastName: '', email: '', intent: '', message: '', query: '' });
    } catch (err: unknown) {
      setContactStatus('error');
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response
          : undefined;
      const msg = res?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : undefined;
      setContactError(
        text ||
          (res ? 'Request failed. Please try again.' : 'Network error. Check your connection and try again.'),
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <>
      <section id="contact-us" className="home-contact-section">
        <div className="home-hero-bg" aria-hidden>
          <div className="home-hero-wave home-hero-wave-black" />
          <div className="home-hero-wave home-hero-wave-white" />
          <div className="home-hero-wave home-hero-wave-gray" />
        </div>

        <div className="container position-relative home-contact-container">
          <div className="row g-4 g-xl-5 align-items-start">
            <div className="col-lg-5 home-contact-copy">
              <p className="home-contact-eyebrow mb-2">Contact Us</p>
              <h2 className="home-contact-title">
                <span className="home-contact-title-line">We&apos;d love</span>
                <span className="home-contact-title-line">to hear from you</span>
              </h2>
              <p className="home-contact-subtitle">
                Get in touch for support, partnership inquiries, or to book a demo.
                Our team will get back to you as soon as possible.
              </p>

              <div className="home-contact-channels">
                {CONTACT_CHANNELS.map((channel) => (
                  <div key={channel.title} className="home-contact-channel">
                    <div className="home-contact-channel-icon">
                      <i className={`bi ${channel.icon}`} aria-hidden />
                    </div>
                    <div>
                      <strong>{channel.title}</strong>
                      {'href' in channel && channel.href ? (
                        <a href={channel.href} className="home-contact-channel-link">
                          {channel.text}
                        </a>
                      ) : (
                        <span>{channel.text}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="home-contact-form-panel">
                <form onSubmit={handleContactSubmit} className="home-contact-form">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="home-firstName" className="home-contact-label">
                        First name
                      </label>
                      <input
                        type="text"
                        className="form-control home-contact-input"
                        id="home-firstName"
                        required
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="First name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="home-lastName" className="home-contact-label">
                        Last name
                      </label>
                      <input
                        type="text"
                        className="form-control home-contact-input"
                        id="home-lastName"
                        required
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label htmlFor="home-email" className="home-contact-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control home-contact-input"
                        id="home-email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="home-intent" className="home-contact-label">
                        I want to
                      </label>
                      <select
                        className="form-select home-contact-input"
                        id="home-intent"
                        value={contactForm.intent}
                        onChange={(e) => setContactForm((p) => ({ ...p, intent: e.target.value }))}
                      >
                        {CONTACT_INTENT_OPTIONS.map((opt) => (
                          <option key={opt.value || 'choose'} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {contactForm.intent === 'raise_query' && (
                    <div className="mt-3">
                      <label htmlFor="home-query" className="home-contact-label">
                        Your query
                      </label>
                      <input
                        type="text"
                        className="form-control home-contact-input"
                        id="home-query"
                        value={contactForm.query}
                        onChange={(e) => setContactForm((p) => ({ ...p, query: e.target.value }))}
                        placeholder="Enter your query"
                        required={contactForm.intent === 'raise_query'}
                      />
                    </div>
                  )}

                  <div className="mt-3">
                    <label htmlFor="home-message" className="home-contact-label">
                      Message
                    </label>
                    <textarea
                      className="form-control home-contact-input home-contact-textarea"
                      id="home-message"
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {contactStatus === 'error' && (
                    <div className="home-contact-error" role="alert">
                      {contactError}
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      type="submit"
                      className="home-contact-submit"
                      disabled={contactSubmitting}
                    >
                      {contactSubmitting ? 'Sending...' : 'Send message'}
                      {!contactSubmitting && <i className="bi bi-send-fill" aria-hidden />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(contactSubmitting || contactStatus === 'success') && (
        <div className="home-contact-modal-overlay" role="presentation">
          <div className="home-contact-modal" role="dialog" aria-modal="true" aria-live="polite">
            {contactSubmitting ? (
              <div className="sembuzz-loader-word sembuzz-loader-in-popup" aria-busy="true">
                {'Sembuzz'.split('').map((letter, i) => (
                  <span key={i} className="sembuzz-loader-letter" style={{ animationDelay: `${i * 0.04}s` }}>
                    {letter}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <div className="home-contact-modal-icon">
                  <i className="bi bi-check-circle-fill" aria-hidden />
                </div>
                <h3 className="home-contact-modal-title">Message sent</h3>
                <p className="home-contact-modal-text mb-0">
                  We received your request and will get in touch with you shortly.
                </p>
                <button
                  type="button"
                  className="home-contact-modal-btn"
                  onClick={() => setContactStatus('idle')}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
