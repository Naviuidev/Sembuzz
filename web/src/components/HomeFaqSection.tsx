import { useState } from 'react';

const FAQ_ITEMS = [
  {
    icon: 'bi-info-circle',
    q: 'What is SemBuzz?',
    a: 'SemBuzz is an all-in-one campus management platform designed to connect students, faculty, and administration — streamlining communication and enhancing campus life in one scrollable feed.',
  },
  {
    icon: 'bi-phone',
    q: 'How can I join SemBuzz?',
    a: 'Download the SemBuzz app, verify your campus email or credentials, and you\'ll get access to your school\'s feed, blogs, clubs, and messaging features.',
  },
  {
    icon: 'bi-gift',
    q: 'Is SemBuzz free to use?',
    a: 'Yes. SemBuzz is free for students. Institutions may have tailored plans for advanced features, analytics, and advertising.',
  },
  {
    icon: 'bi-laptop',
    q: 'What devices are supported?',
    a: 'SemBuzz is available on iOS and Android. You can also browse the campus feed, blogs, and events from any web browser at /events.',
  },
  {
    icon: 'bi-headset',
    q: 'How do I get support?',
    a: 'Use the in-app help, email our team, or submit the contact form below. We typically respond within 24 hours on business days.',
  },
];

const FAQ_HIGHLIGHTS = [
  'Free for verified students',
  'Web and mobile — same campus feed',
  'Support for students, admins, and partners',
];

type HomeFaqSectionProps = {
  onContactClick?: () => void;
};

export function HomeFaqSection({ onContactClick }: HomeFaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToContact = () => {
    if (onContactClick) {
      onContactClick();
      return;
    }
    document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="faqs" className="home-faq-section">
      <div className="container py-4 py-lg-5">
        <div className="row g-4 g-xl-5 align-items-start">
          <div className="col-lg-4 home-faq-copy">
            <p className="home-faq-eyebrow mb-2">FAQ</p>
            <h2 className="home-faq-title">
              <span className="home-faq-title-line">Frequently asked</span>
              <span className="home-faq-title-line">questions</span>
            </h2>
            <p className="home-faq-subtitle">
              Quick answers about joining SemBuzz, supported devices, pricing, and
              how to reach our team.
            </p>

            <ul className="home-faq-highlights list-unstyled mb-4">
              {FAQ_HIGHLIGHTS.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button type="button" className="home-faq-cta" onClick={scrollToContact}>
              Contact support
              <i className="bi bi-arrow-down-right" aria-hidden />
            </button>
          </div>

          <div className="col-lg-8">
            <div className="home-faq-list" role="list">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <article
                    key={item.q}
                    className={`home-faq-item${isOpen ? ' home-faq-item-open' : ''}`}
                  >
                    <h3 className="home-faq-item-header">
                      <button
                        type="button"
                        className="home-faq-item-trigger"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                      >
                        <span className="home-faq-item-icon">
                          <i className={`bi ${item.icon}`} aria-hidden />
                        </span>
                        <span className="home-faq-item-question">{item.q}</span>
                        <i className="bi bi-plus-lg home-faq-item-toggle" aria-hidden />
                      </button>
                    </h3>
                    <div
                      className={`home-faq-item-panel${isOpen ? ' home-faq-item-panel-open' : ''}`}
                      hidden={!isOpen}
                    >
                      <p className="home-faq-item-answer mb-0">{item.a}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
