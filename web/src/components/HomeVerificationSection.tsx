import { HomeVerificationShowcase } from './HomeVerificationShowcase';

const VERIFICATION_STEPS = [
  {
    step: '1',
    icon: 'bi-envelope-check',
    title: 'Campus email signup',
    text: 'Students register with a school email. Auto-approve rules can instantly verify matching domains.',
  },
  {
    step: '2',
    icon: 'bi-file-earmark-text',
    title: 'Document review',
    text: 'When manual review is required, students upload proof of enrollment for school admin approval.',
  },
  {
    step: '3',
    icon: 'bi-person-check',
    title: 'Admin approval',
    text: 'School admins review pending requests, approve verified students, or reject with feedback.',
  },
  {
    step: '4',
    icon: 'bi-shield-lock',
    title: 'Gated campus access',
    text: 'Only approved students see their school feed, chats, blogs, and saved content.',
  },
];

const VERIFY_HIGHLIGHTS = [
  'Per-school verification rules — auto-approve by email domain or manual document review',
  'School admins manage pending users, approve signups, and revoke access when needed',
  'Students cannot browse another school\'s private feed without approval',
  'Same verified identity powers feed access, messaging, saves, and notifications',
];

export function HomeVerificationSection() {
  return (
    <section id="student-verification" className="home-verify-section">
      <div className="home-hero-bg" aria-hidden>
        <div className="home-hero-wave home-hero-wave-black" />
        <div className="home-hero-wave home-hero-wave-white" />
        <div className="home-hero-wave home-hero-wave-gray" />
      </div>

      <div className="container position-relative home-verify-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-6 home-verify-copy">
            <p className="home-verify-eyebrow mb-2">Trust &amp; Onboarding</p>
            <h2 className="home-verify-title">
              <span className="home-verify-title-line">Verified campus access</span>
              <span className="home-verify-title-line">from signup to approval</span>
            </h2>
            <p className="home-verify-subtitle">
              SemBuzz keeps campus content private — students verify their identity, school
              admins approve access, and only then unlock the full feed, chats, and libraries.
            </p>

            <div className="home-verify-steps">
              {VERIFICATION_STEPS.map((item) => (
                <article key={item.step} className="home-verify-step">
                  <div className="home-verify-step-num">{item.step}</div>
                  <div className="home-verify-step-icon">
                    <i className={`bi ${item.icon}`} aria-hidden />
                  </div>
                  <div>
                    <h3 className="home-verify-step-title">{item.title}</h3>
                    <p className="home-verify-step-text mb-0">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="home-verify-highlights list-unstyled mb-0">
              {VERIFY_HIGHLIGHTS.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-6">
            <HomeVerificationShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
