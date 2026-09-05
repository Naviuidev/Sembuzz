import { Link } from 'react-router-dom';

const GUIDELINES = [
  {
    icon: 'bi-shield-lock',
    title: 'Who Can Post',
    desc: 'Only verified admins may publish campus content — students browse and engage, not post to the feed.',
  },
  {
    icon: 'bi-calendar-check',
    title: 'Accuracy',
    desc: 'Posts must include correct dates, locations, and details so students can trust what they read.',
  },
  {
    icon: 'bi-file-earmark-check',
    title: 'Content Standards',
    desc: 'No explicit, hateful, misleading, political, religious promotional, or illegal content.',
  },
  {
    icon: 'bi-badge-ad',
    title: 'Advertising Policy',
    desc: 'Ads must be clearly labeled and relevant to students. No political or adult advertising.',
  },
  {
    icon: 'bi-flag',
    title: 'Reporting',
    desc: 'See something that violates these guidelines? Reach out and our team will review it promptly.',
    contactEmail: 'contact@sdmlllc.com',
  },
];

const GUIDELINE_PRINCIPLES = [
  'Verified admins only — keeps the feed trustworthy',
  'Clear ad labels — students always know what is sponsored',
  'Respectful campus communication at every level',
];

export function HomeGuidelinesSection() {
  return (
    <section id="community-guidelines" className="home-guidelines-section">
      <div className="container py-4 py-lg-5">
        <div className="row g-4 g-xl-5 align-items-start">
          <div className="col-lg-4 home-guidelines-copy">
            <p className="home-guidelines-eyebrow mb-2">Community Guidelines</p>
            <h2 className="home-guidelines-title">
              <span className="home-guidelines-title-line">Accurate, respectful,</span>
              <span className="home-guidelines-title-line">and transparent campus communication</span>
            </h2>
            <p className="home-guidelines-subtitle">
              SemBuzz keeps campus communication trustworthy — with clear rules for admins,
              advertisers, and everyone who uses the platform.
            </p>

            <ul className="home-guidelines-principles list-unstyled mb-4">
              {GUIDELINE_PRINCIPLES.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/contact" className="home-guidelines-cta">
              Read full guidelines
              <i className="bi bi-arrow-up-right" aria-hidden />
            </Link>
          </div>

          <div className="col-lg-8">
            <div className="home-guidelines-grid">
              {GUIDELINES.map((item) => (
                <article key={item.title} className="home-guidelines-card">
                  <div className="home-guidelines-card-icon">
                    <i className={`bi ${item.icon}`} aria-hidden />
                  </div>
                  <div>
                    <h3 className="home-guidelines-card-title">{item.title}</h3>
                    <p className="home-guidelines-card-desc mb-0">
                      {item.desc}
                      {'contactEmail' in item && item.contactEmail && (
                        <>
                          {' '}
                          <a href={`mailto:${item.contactEmail}`} className="home-guidelines-email">
                            {item.contactEmail}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
