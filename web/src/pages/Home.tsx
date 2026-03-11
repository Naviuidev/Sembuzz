import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { submitContact } from '../services/contact.service';

const CONTACT_INTENT_OPTIONS = [
  { value: '', label: 'Choose...' },
  { value: 'book_slot', label: 'Book slot' },
  { value: 'raise_query', label: 'Raise query' },
  { value: 'need_support', label: 'Need support' },
];

const HERO_BG_IMAGE =
  'https://krock.io/wp-content/uploads/2023/03/Social-impact.png';

const FRAGMENTED_ITEMS = [
  { icon: 'bi-envelope', text: 'Mass emails' },
  { icon: 'bi-share', text: 'Multiple social media pages' },
  { icon: 'bi-globe', text: 'Department websites' },
  { icon: 'bi-file-earmark', text: 'Flyers and posters' },
  { icon: 'bi-newspaper', text: 'Newsletters' },
];

const STUDENT_CAPABILITIES = [
  { icon: 'bi-collection', text: 'Browse a unified feed of campus events, club activities, research opportunities, internships, scholarships, and academic deadlines.' },
  { icon: 'bi-funnel', text: 'Filter content by categories including Academics, Career & Internships, Research, Student Life, Clubs & Organizations, and Sports.' },
  { icon: 'bi-bookmark', text: 'Save and bookmark opportunities to revisit later.' },
  { icon: 'bi-bell', text: 'Receive timely alerts for important updates and deadlines.' },
];

const FAQ_ITEMS = [
  { q: 'What is SemBuzz?', a: 'SemBuzz is an all-in-one campus management platform designed to connect students, faculty, and administration, streamlining communication and enhancing campus life.' },
  { q: 'How can I join SemBuzz?', a: 'Download the SemBuzz app, verify your campus email or credentials, and you\'ll get access to your school\'s feed and features.' },
  { q: 'Is SemBuzz free to use?', a: 'Yes. SemBuzz is free for students. Institutions may have tailored plans for advanced features and analytics.' },
  { q: 'What devices are supported?', a: 'SemBuzz is available on iOS and Android. You can also use the web app from any browser.' },
  { q: 'How do I get support?', a: 'Use the in-app help, email support, or visit our Contact page. Our team typically responds within 24 hours.' },
];

const TERMS_ITEMS = [
  { icon: 'bi-person-gear', title: 'Eligibility', desc: 'Users must be at least 13 years old.' },
  { icon: 'bi-shield-check', title: 'Accounts & Security', desc: 'Users are responsible for maintaining confidentiality of login credentials.' },
  { icon: 'bi-check-circle', title: 'Acceptable Use', desc: 'Users may not hack, disrupt, misuse, or violate laws using the Platform.' },
  { icon: 'bi-info-circle', title: 'Limitation of Liability', desc: "The Platform is provided 'as is' without warranties." },
  { icon: 'bi-envelope', title: 'Contact', desc: 'Contact: ', contactEmail: 'contact@sdmlllc.com' },
];

const GUIDELINES = [
  { icon: 'bi-phone', title: 'Who Can Post', desc: 'Only admins may share content.' },
  { icon: 'bi-check-circle', title: 'Accuracy', desc: 'Posts must contain correct dates and accurate details.' },
  { icon: 'bi-file-text', title: 'Content Standards', desc: 'No explicit, hateful, misleading, political, religious promotional, or illegal content.' },
  { icon: 'bi-megaphone', title: 'Advertising Policy', desc: 'Ads must be clearly labeled and relevant to students. No political or adult advertising.' },
  { icon: 'bi-envelope', title: 'Reporting', desc: 'Contact: ', contactEmail: 'contact@sdmlllc.com' },
];

const HOW_WE_USE = [
  'Provide secure login access.',
  'Display school-specific content.',
  'Measure engagement.',
  'Improve functionality.',
  'Analyze trends in aggregate form.',
];

const PILOT_SCHOOLS_ITEMS = [
  'Campus configuration setup',
  'Admin onboarding',
  'Category structuring',
  'Student launch support',
  'Engagement reporting',
];

const BUSINESS_ADVERTISERS_OPTIONS = [
  'Banner Ads targeted by campus.',
  'Sponsored Posts clearly labeled as sponsored content.',
  'Event promotions and limited-time offers.',
  'Targeting by campus, category, and campaign duration.',
];

const EMPLOYER_CAPABILITIES = [
  'Target specific campuses.',
  'Choose relevant posting categories (Career & Internships, Research, Business, Engineering, Leadership).',
  'Boost visibility with featured listings.',
  'Track engagement metrics including views, clicks, saves, and application interactions.',
];

const UNIVERSITY_FEATURES = [
  'Private Campus Feed accessible only to verified students.',
  'Admin Dashboard to publish announcements and schedule notifications.',
  'Role-based access controls (Admin, Department, Contributor).',
  'Engagement analytics including post views, click-through rates, saves, and engagement trends.',
  'Reduced dependency on mass email communication.',
];

/**
 * Home page — hero, value props, features, FAQ, terms, for universities, for employers, businesses & advertisers, pilot schools, privacy, guidelines, contact, footer.
 */
export const Home = () => {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
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
  const [privacyPopup, setPrivacyPopup] = useState<'account' | 'student' | 'engagement' | null>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.pathname, location.hash]);

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
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string | string[] } } }).response : undefined;
      const msg = res?.data?.message;
      const text = Array.isArray(msg) ? msg[0] : typeof msg === 'string' ? msg : undefined;
      setContactError(text || (res ? 'Request failed. Please try again.' : 'Network error. Check your connection and try again.'));
    } finally {
      setContactSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen home-page-bg">
      <Navbar />
      {/* Hero section */}
      <section
        className="position-relative d-flex align-items-center justify-content-center overflow-hidden"
        style={{
          minHeight: 'calc(100vh - 80px)',
          backgroundImage: `url(${HERO_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark blue overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(13, 27, 42, 0.78)',
          }}
        />
        {/* Content */}
        <div className="position-relative container text-center text-white px-3 py-5">
          <h1
            className="fw-bold mb-4 mx-auto"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              lineHeight: 1.2,
              maxWidth: '720px',
            }}
          >
            Everything happening on your campus. One place.
          </h1>
          <p
            className="mb-5 mx-auto"
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              maxWidth: '680px',
              opacity: 0.95,
              lineHeight: 1.6,
            }}
          >
            SemBuzz centralizes campus announcements, events, research
            opportunities, internships, student organization updates, and
            important deadlines into one clean, scrollable feed built for
            students and designed for institutions.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center mb-5 hero-cta">
            <a
              href="https://apps.apple.com/in/app/sembuzz/id6757446229"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn hero-btn-fill btn-sm rounded-pill text-white text-decoration-none d-inline-flex align-items-center gap-2 px-4 py-2"
            >
              <span aria-hidden style={{ fontSize: '1.25rem' }}>
                &#63743;
              </span>
              Download the App
            </a>
            <Link
              to="/contact"
              className="hero-btn btn rounded-pill text-white text-decoration-none d-inline-flex align-items-center gap-2 px-4 py-2"
            >
              Request a University Demo
            </Link>
          </div>
          <p
            className="small mb-0"
            style={{
              fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
              opacity: 0.9,
            }}
          >
            One app • Multiple schools • Verified campus access • Real
            engagement insights
          </p>
        </div>
      </section>

      {/* Campus communication fragmented — left-aligned content in central column */}
      <section className="py-5 py-lg-6 fragmented-section">
        <div className="container py-4">
          <div className="fragmented-content">
            <h2 className="fragmented-title">
              Campus communication is fragmented.
            </h2>
            <p className="fragmented-intro">
              Universities share valuable information every day, but it&apos;s scattered across:
            </p>
            <ul className="fragmented-list">
              {FRAGMENTED_ITEMS.map(({ icon, text }) => (
                <li key={text} className="fragmented-list-item">
                  <i className={`bi ${icon} fragmented-icon`} aria-hidden />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="fragmented-para">
              Students miss deadlines. Events struggle for attendance. Opportunities go unseen.
            </p>
            <p className="fragmented-para fragmented-para-last">
              The issue isn&apos;t a lack of information. It&apos;s a lack of centralized visibility.
            </p>
          </div>
        </div>
      </section>

      {/* A unified campus communication platform — two columns: copy + app store card */}
      <section id="about" className="py-5 py-lg-6 unified-section">
        <div className="container py-4">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6 order-2 order-lg-1">
              <h2
                className="unified-heading mb-4 text-black"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  lineHeight: 1.3,
                }}
              >
                A unified campus communication platform.
              </h2>
              <p
                className="mb-3 text-black"
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                  lineHeight: 1.65,
                }}
              >
                SemBuzz is a single mobile application designed to organize
                campus life into one accessible feed.
              </p>
              <p
                className="mb-3 text-black"
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                  lineHeight: 1.65,
                }}
              >
                Students download the app once. After verifying their campus, they
                gain access to a personalized school-specific feed within the same
                platform.
              </p>
              <p
                className="mb-3 fw-bold text-black"
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                  lineHeight: 1.65,
                }}
              >
                No separate apps per university. No switching between platforms.
                No missed opportunities.
              </p>
              <p
                className="mb-0 text-black"
                style={{
                  fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                  lineHeight: 1.65,
                }}
              >
                If it matters on campus — it belongs in SemBuzz.
              </p>
            </div>
            <div className="col-lg-6 order-1 order-lg-2 d-flex justify-content-center justify-content-lg-end">
              <img
                src="/app-store-sembuzz.png"
                alt="Sembuzz app on App Store - All Campus Updates in One App"
                className="unified-app-store-img"
              />
            </div>
          </div>
        </div>
      </section>
<section className='py-5'>
  <div className='container'>
    <div className='row justify-content-center text-center'>
      <div className='col-md-10'>
        <div className='my-2'>
        <h2 className="fw-bold">FOR STUDENTS</h2>
        <p className="my-3 fs-4 fw-bold">Be informed. Be involved. Be ahead.</p>
<p className='text-dark'>SemBuzz helps you see everything happening at your university in one place without searching across multiple platforms.</p>

        </div>
      </div>
    </div>
  </div>
</section>
      {/* What Students Can Do — white bg, lavender accents; text left, illustration right */}
      {/* What Students Can Do — text left + illustration right */}
      <section id="for-students" className="py-5 py-lg-6 students-can-do-section">
        <div className="container py-4">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-7">
              <h2 className="students-can-do-title">What Students Can Do</h2>
              <ul className="students-can-do-list">
                {STUDENT_CAPABILITIES.map((item, i) => (
                  <li key={i}>
                    <i className={`bi ${item.icon} students-can-do-icon`} aria-hidden />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="students-can-do-callout">
                <p className="mb-0">You&apos;re already scrolling daily. Make that scroll productive.</p>
              </div>
            </div>
            <div className="col-lg-5  justify-content-center">
              <div className="students-can-do-illustration">
                <img
                  src="https://kissflow.com/hs-fs/hubfs/application_development_lifecycle_phases_and_steps_explained.webp?width=500&height=300&name=application_development_lifecycle_phases_and_steps_explained.webp"
                  alt="Laptop with digital documents and campus feed"
                  className="students-can-do-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — same bg as contact form */}
      {/* FAQ — same bg as contact form */}
      <section id="faqs" className="py-5 py-lg-6 faq-section text-black">
        <div className="container py-4">
          <p className="text-uppercase small text-muted mb-1 text-center">FAQ</p>
          <h2 className="text-center mb-4" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Frequently Asked Questions</h2>
          <div className="accordion accordion-flush mx-auto" style={{ maxWidth: 720 }} id="faqAccordion">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="accordion-item border rounded-3 mb-2 overflow-hidden">
                <h3 className="accordion-header">
                  <button
                    className={`accordion-button ${openFaq === i ? '' : 'collapsed'} bg-white border-0 shadow-none`}
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {item.q}
                  </button>
                </h3>
                <div className={`accordion-collapse collapse ${openFaq === i ? 'show' : ''}`}>
                  <div className="accordion-body text-muted">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-4 mb-2">Still have questions? Contact our support team for assistance.</p>
          <div className="text-center">
            <Link to="/contact" className="btn home-section-btn rounded-pill px-4">Contact Support</Link>
          </div>
        </div>
      </section>

      {/* Terms of Service — above Community Guidelines */}
      <section id="terms-of-service" className="py-5 py-lg-6 terms-section">
        <div className="container py-4">
          <h2 className="terms-title text-center mb-1">TERMS OF SERVICE</h2>
          <p className="text-center text-dark terms-effective mb-2">Effective Date: January 1, 2026</p>
          <p className="text-center text-dark mb-4 mx-auto terms-intro" style={{ maxWidth: 560 }}>
            By accessing or using SemBuzz, you agree to these Terms of Service.
          </p>
          <div className="row g-4 mb-4">
            {TERMS_ITEMS.map((t) => (
              <div key={t.title} className="col-md-6 col-lg-4">
                <div className="d-flex gap-3 guidelines-card">
                  <i className={`bi ${t.icon} guidelines-icon flex-shrink-0`} aria-hidden />
                  <div>
                    <h3 className="guidelines-heading mb-1">{t.title}</h3>
                    <p className="small text-dark mb-0 guidelines-desc">
                      {t.desc}
                      {'contactEmail' in t && (
                        <a href={`mailto:${t.contactEmail}`} className="text-primary text-decoration-underline ms-1">{t.contactEmail}</a>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Universities — above For Employers */}
      <section id="for-universities" className="py-5 py-lg-6 universities-section">
        <div className="container py-4 universities-inner">
          <h2 className="universities-title">FOR UNIVERSITIES</h2>
          <h3 className="universities-subtitle">Improve student engagement with measurable communication.</h3>
          <p className="universities-para">SemBuzz provides institutions with a centralized communication channel inside a mobile environment students already use.</p>
          <p className="universities-para">Each university receives a private campus workspace within the platform.</p>
          <h3 className="universities-features-heading">University Features</h3>
          <ul className="universities-list">
            {UNIVERSITY_FEATURES.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="universities-highlight">
            <p className="mb-0 fw-bold">Stronger communication builds stronger campus communities.</p>
          </div>
        </div>
      </section>

      {/* For Employers — contact form bg, above For Businesses & Advertisers */}
      <section id="for-employers" className="py-5 py-lg-6 employers-section">
        <div className="container py-4 employers-inner">
          <h2 className="employers-title">FOR EMPLOYERS</h2>
          <h3 className="employers-tagline">Reach students inside their daily campus experience.</h3>
          <div className="employers-text-block">
            <p className="employers-para">Students often explore opportunities through traditional employment websites and career platforms.</p>
            <p className="employers-para">SemBuzz complements those channels by placing internships and roles directly inside students&apos; campus feed, where they engage daily.</p>
            <p className="employers-para">Your opportunity appears before students begin actively searching.</p>
          </div>
          <h3 className="employers-capabilities-heading">Employer Capabilities</h3>
          <ul className="employers-list">
            {EMPLOYER_CAPABILITIES.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="employers-highlight">
            <p className="mb-0">Be visible inside their campus environment, not just in a search result.</p>
          </div>
        </div>
      </section>

      {/* For Businesses & Advertisers — white bg, above Pilot Schools */}
      <section className="py-5 py-lg-6 businesses-advertisers-section">
        <div className="container py-4 businesses-advertisers-inner">
          <h2 className="businesses-advertisers-title">FOR BUSINESSES & ADVERTISERS</h2>
          <h3 className="businesses-advertisers-subtitle">Connect with verified student audiences.</h3>
          <p className="businesses-advertisers-para">
            SemBuzz allows businesses to promote services, events, and offers directly within campus feeds.
          </p>
          <p className="businesses-advertisers-para">
            Restaurants, apartments, gyms, coffee shops, local brands, and student-focused services can reach students where they engage daily.
          </p>
          <h3 className="businesses-advertisers-options-heading">Advertising Options</h3>
          <ul className="businesses-advertisers-list">
            {BUSINESS_ADVERTISERS_OPTIONS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="businesses-advertisers-disclaimer">
            <p className="mb-0">Sponsored content is clearly labeled and does not imply university endorsement.</p>
          </div>
        </div>
      </section>

      {/* Pilot Schools — above Privacy Policy */}
      <section className="py-5 py-lg-6 pilot-schools-section">
        <div className="container py-4 pilot-schools-inner">
          <h2 className="pilot-schools-title">PILOT SCHOOLS</h2>
          <p className="pilot-schools-intro">
            SemBuzz is rolling out through pilot programs and expanding to additional institutions.
          </p>
          <ul className="pilot-schools-list">
            {PILOT_SCHOOLS_ITEMS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="pilot-schools-callout">
            <p className="mb-0"><strong>Current Pilot:</strong> University of Wisconsin-Milwaukee (UWM)</p>
          </div>
        </div>
      </section>

      {/* Privacy Policy — two col-5 per row, centered, larger icons */}
      <section id="privacy" className="py-5 py-lg-6 privacy-section">
        <div className="container py-4 privacy-section-inner">
          <h2 className="privacy-title mb-1">PRIVACY POLICY</h2>
          <p className="privacy-effective mb-2">Effective Date: January 1, 2026</p>
          <p className="text-dark mb-4 privacy-intro">
            SemBuzz respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our Platform.
          </p>

          <h3 className="privacy-heading mb-3">1. Information We Collect</h3>
          <div className="privacy-pills-wrap">
            <button type="button" className="btn privacy-pill" onClick={() => setPrivacyPopup('account')}>
              Account Information
            </button>
            <button type="button" className="btn privacy-pill" onClick={() => setPrivacyPopup('student')}>
              Student Verification Information
            </button>
            <button type="button" className="btn privacy-pill" onClick={() => setPrivacyPopup('engagement')}>
              Engagement Data
            </button>
          </div>

          <div className="privacy-how-wrap py-3">
            <h3 className="privacy-heading privacy-how-title mb-3">2. How We Use Information</h3>
            <div className="row align-items-center justify-content-center mb-4">
              <div className="col-12 col-md-5">
                <ul className="privacy-how-list">
                  {HOW_WE_USE.map((item, i) => (
                    <li key={i} className="privacy-how-item">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
                <div className="privacy-how-graphic" aria-hidden>
                  <svg className="privacy-how-svg" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g className="privacy-how-graphic-padlock">
                      <rect x="12" y="38" width="22" height="24" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
                      <path d="M18 38 V32 a6 6 0 0 1 12 0 v6" stroke="currentColor" strokeWidth="1.8" fill="none" />
                    </g>
                    <g className="privacy-how-graphic-doc">
                      <rect x="42" y="28" width="28" height="36" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <line x1="48" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="1.2" />
                      <line x1="48" y1="42" x2="65" y2="42" stroke="currentColor" strokeWidth="1.2" />
                      <line x1="48" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="1.2" />
                    </g>
                    <g className="privacy-how-graphic-chart">
                      <path className="privacy-how-line" pathLength="1" d="M78 72 Q92 58 106 62 T134 48 T162 42" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <circle className="privacy-how-dot" cx="78" cy="72" r="3" fill="currentColor" />
                      <circle className="privacy-how-dot" cx="106" cy="62" r="3" fill="currentColor" />
                      <circle className="privacy-how-dot" cx="134" cy="48" r="3" fill="currentColor" />
                      <rect x="82" y="58" width="8" height="14" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      <rect x="98" y="50" width="8" height="22" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      <rect x="114" y="44" width="8" height="28" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </g>
                    <g className="privacy-how-graphic-clock">
                      <circle cx="178" cy="50" r="16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <line x1="178" y1="50" x2="178" y2="42" stroke="currentColor" strokeWidth="1.2" />
                      <line x1="178" y1="50" x2="183" y2="54" stroke="currentColor" strokeWidth="1.2" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: two col-5, centered, larger icon */}
          <div className="row justify-content-center align-items-center py-3">
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <div>
                <h3 className="privacy-heading mb-2">3. Information Sharing</h3>
                <p className="mb-0 privacy-block-body">We do not sell or rent personal data.</p>
                <p className="mb-0 privacy-block-body">Aggregate engagement metrics may be shared in non-identifiable form.</p>
              </div>
            </div>
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <i className="bi bi-shield-check privacy-block-icon privacy-block-icon-lg" aria-hidden />
            </div>
          </div>

          {/* Section 4: two col-5, centered, larger icon */}
          <div className="row justify-content-center align-items-center py-3">
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <div>
                <h3 className="privacy-heading mb-2">4. Account Deletion</h3>
                <p className="mb-0 privacy-block-body">Users may delete accounts at any time. Login credentials are removed upon deletion. Aggregated analytics may remain.</p>
              </div>
            </div>
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <i className="bi bi-person-dash privacy-block-icon privacy-block-icon-lg" aria-hidden />
            </div>
          </div>

          {/* Section 5: two col-5, centered, larger icon */}
          <div className="row justify-content-center align-items-center py-3">
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <i className="bi bi-list privacy-block-icon privacy-block-icon-lg" aria-hidden />
            </div>
            <div className="col-12 col-md-5 d-flex justify-content-center align-items-center">
              <div>
                <h3 className="privacy-heading mb-2">5. Children&apos;s Privacy</h3>
                <p className="mb-0 privacy-block-body">SemBuzz is intended for college and university students and does not knowingly collect information from children under 13.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines — reference: 5 items, 3+2 grid, blue icons */}
      {/* Community Guidelines — above Contact */}
      <section id="community-guidelines" className="py-5 py-lg-6 guidelines-section">
        <div className="container py-4">
          <h2 className="guidelines-title text-center mb-2">COMMUNITY GUIDELINES</h2>
          <p className="text-center text-dark mb-4 mx-auto guidelines-intro" style={{ maxWidth: 560 }}>
            SemBuzz aims to keep campus communication accurate, respectful, and transparent.
          </p>
          <div className="row g-4 mb-4">
            {GUIDELINES.map((g) => (
              <div key={g.title} className="col-md-6 col-lg-4">
                <div className="d-flex gap-3 guidelines-card">
                  <i className={`bi ${g.icon} guidelines-icon flex-shrink-0`} aria-hidden />
                  <div>
                    <h3 className="guidelines-heading mb-1">{g.title}</h3>
                    <p className="small text-dark mb-0 guidelines-desc">
                      {g.desc}
                      {'contactEmail' in g && (
                        <a href={`mailto:${g.contactEmail}`} className="text-primary text-decoration-underline ms-1">{g.contactEmail}</a>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/contact" className="btn home-section-btn rounded-pill px-4">Read Full Guidelines</Link>
          </div>
        </div>
      </section>

      {/* Contact Us — reference: no card, form on soft pastel bg; submit left-aligned */}
      <section id="contact-us" className="py-5 py-lg-6 contact-section-ref">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7 pt-2">
              <h2 className="contact-title text-center">Contact Us</h2>
              <p className="contact-subtitle text-center">We'd love to hear from you</p>
              <p className="contact-description text-center">
                Get in touch for support, partnership inquiries, or to book a slot. Our team will get back to you as soon as possible.
              </p>
              <form onSubmit={handleContactSubmit} className="contact-form-ref">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="home-firstName" className="form-label contact-label">First name</label>
                        <input
                          type="text"
                          className="form-control contact-input"
                          id="home-firstName"
                          required
                          value={contactForm.firstName}
                          onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))}
                          placeholder="First name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="home-lastName" className="form-label contact-label">Last name</label>
                        <input
                          type="text"
                          className="form-control contact-input"
                          id="home-lastName"
                          required
                          value={contactForm.lastName}
                          onChange={(e) => setContactForm((p) => ({ ...p, lastName: e.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="home-email" className="form-label contact-label">Email</label>
                        <input
                          type="email"
                          className="form-control contact-input"
                          id="home-email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="home-intent" className="form-label contact-label">I want to</label>
                        <select
                          className="form-select contact-select"
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
                        <label htmlFor="home-query" className="form-label contact-label">Your query</label>
                        <input
                          type="text"
                          className="form-control contact-input"
                          id="home-query"
                          value={contactForm.query}
                          onChange={(e) => setContactForm((p) => ({ ...p, query: e.target.value }))}
                          placeholder="Enter your query"
                          required={contactForm.intent === 'raise_query'}
                        />
                      </div>
                    )}
                    <div className="mt-3">
                      <label htmlFor="home-message" className="form-label contact-label">Message</label>
                      <textarea
                        className="form-control contact-input contact-textarea"
                        id="home-message"
                        required
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Your message..."
                      />
                    </div>
                    {contactStatus === 'error' && (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        {contactError}
                      </div>
                    )}
                    <div className="mt-4">
                      <button
                        type="submit"
                        className="btn contact-submit-btn rounded-pill px-4"
                        disabled={contactSubmitting}
                      >
                        {contactSubmitting ? 'Sending...' : 'Submit'}
                      </button>
                    </div>
                  </form>
            </div>
          </div>
        </div>
      </section>

      {/* Contact popup: Sembuzz animation while submitting, then success message */}
      {(contactSubmitting || contactStatus === 'success') && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-3 shadow">
              <div className="modal-body text-center py-4 px-4">
                {contactSubmitting ? (
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
                      onClick={() => setContactStatus('idle')}
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

      {/* Privacy Policy popups — fade-up modal + staggered inner elements */}
      {privacyPopup && (
        <div
          className="privacy-popup-overlay"
          onClick={() => setPrivacyPopup(null)}
          onKeyDown={(e) => e.key === 'Escape' && setPrivacyPopup(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-popup-title"
        >
          <div
            className="privacy-popup-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <button
              type="button"
              className="privacy-popup-close"
              onClick={() => setPrivacyPopup(null)}
              aria-label="Close"
              title="Close"
            >
              <span className="privacy-popup-close-icon" aria-hidden>×</span>
            </button>
            <div className="privacy-popup-body">
            {privacyPopup === 'account' && (
              <>
                <h2 id="privacy-popup-title" className="privacy-popup-item privacy-popup-title">Account Information</h2>
                <div className="privacy-popup-item text-center my-4">
                  <div className="privacy-avatar-icon" aria-hidden>
                    <span className="privacy-avatar-head" />
                    <span className="privacy-avatar-body" />
                  </div>
                </div>
                <div className="privacy-popup-item privacy-field">
                  <label className="privacy-field-label">First Name</label>
                  <div className="privacy-field-value text-end">........</div>
                </div>
                <div className="privacy-popup-item privacy-field">
                  <label className="privacy-field-label">Last Name</label>
                  <div className="privacy-field-value text-end">........</div>
                </div>
                <div className="privacy-popup-item privacy-field">
                  <label className="privacy-field-label">Email Address</label>
                  <div className="privacy-field-value text-end">•••••@•••••.com</div>
                </div>
                <div className="privacy-popup-item privacy-field">
                  <label className="privacy-field-label">Encrypted Password</label>
                  <div className="privacy-field-value text-end">........</div>
                </div>
                <div className="privacy-popup-item mt-4 privacy-info-box privacy-info-box-account">
                  <p className="mb-0">We do not collect sensitive personal information such as government IDs or payment data.</p>
                </div>
              </>
            )}

            {privacyPopup === 'student' && (
              <>
                <h2 id="privacy-popup-title" className="privacy-popup-item privacy-popup-title">Student Verification Information</h2>
                <div className="privacy-popup-item text-center my-4">
                  <svg className="privacy-doc-check-icon" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <rect x="2" y="2" width="44" height="52" rx="4" stroke="#5D8BF4" strokeWidth="2" fill="none" />
                    <line x1="10" y1="14" x2="32" y2="14" stroke="#5D8BF4" strokeWidth="1.5" />
                    <line x1="10" y1="22" x2="28" y2="22" stroke="#5D8BF4" strokeWidth="1.5" />
                    <line x1="10" y1="30" x2="30" y2="30" stroke="#5D8BF4" strokeWidth="1.5" />
                    <circle cx="36" cy="42" r="10" fill="#5D8BF4" />
                    <path d="M32 42l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <div className="privacy-popup-item">
                  <p className="privacy-body-text mb-2">For users who do not register using a school-issued email address, we may request proof of student status for account approval. This may include:</p>
                  <ul className="privacy-body-list mb-0">
                    <li>A valid student ID (image upload), or</li>
                    <li>Proof of current course enrollment</li>
                  </ul>
                </div>
                <div className="privacy-popup-item mt-4 privacy-info-box privacy-info-box-student">
                  <p className="mb-0">Verification documents are used solely to confirm eligibility and are not used for any other purpose.</p>
                </div>
              </>
            )}

            {privacyPopup === 'engagement' && (
              <>
                <h2 id="privacy-popup-title" className="privacy-popup-item privacy-popup-title">Engagement Data</h2>
                <div className="privacy-popup-item text-center my-4">
                  <svg className="privacy-line-chart-icon" viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M10 38 L30 28 L50 32 L70 18 L90 22 L110 12" stroke="#20C997" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <circle cx="10" cy="38" r="3" fill="#20C997" />
                    <circle cx="30" cy="28" r="3" fill="#20C997" />
                    <circle cx="50" cy="32" r="3" fill="#20C997" />
                    <circle cx="70" cy="18" r="3" fill="#20C997" />
                    <circle cx="90" cy="22" r="3" fill="#20C997" />
                    <circle cx="110" cy="12" r="3" fill="#20C997" />
                  </svg>
                </div>
                <div className="privacy-popup-item">
                  <p className="privacy-engagement-heading mb-2">We collect non-personal engagement data such as:</p>
                  <ul className="privacy-body-list mb-3">
                    <li>Post views</li>
                    <li>Click activity</li>
                    <li>Interaction metrics</li>
                    <li>General usage analytics</li>
                  </ul>
                  <p className="privacy-engagement-heading mb-2">We do not collect:</p>
                  <ul className="privacy-body-list mb-0">
                    <li>Government-issued identification numbers</li>
                    <li>Payment or financial information through the core platform</li>
                    <li>Sensitive personal data unrelated to account access and student verification</li>
                  </ul>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 bg-dark text-white">
        <div className="container">
          <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-5">SEMBUZZ</span>
              <span className="small text-white-50">© {new Date().getFullYear()} SemBuzz. All rights reserved.</span>
            </div>
            <div className="d-flex gap-3">
              <Link to="/contact" className="text-white-50 text-decoration-none small">Privacy Policy</Link>
              <Link to="/contact" className="text-white-50 text-decoration-none small">Terms of Service</Link>
              <Link to="/events" className="text-white-50 text-decoration-none small">Sitemap</Link>
            </div>
            <div className="d-flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="Facebook"><i className="bi bi-facebook" style={{ fontSize: '1.25rem' }} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="Twitter"><i className="bi bi-twitter-x" style={{ fontSize: '1.25rem' }} /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="Instagram"><i className="bi bi-instagram" style={{ fontSize: '1.25rem' }} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white-50" aria-label="LinkedIn"><i className="bi bi-linkedin" style={{ fontSize: '1.25rem' }} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
