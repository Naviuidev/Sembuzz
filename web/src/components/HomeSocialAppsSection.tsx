import { HomeSocialAppsShowcase } from './HomeSocialAppsShowcase';

const SOCIAL_PILLARS = [
  {
    icon: 'bi-building',
    title: 'School admin creates clubs',
    text: 'Official clubs live under Social Share with name, icon, and external social profile links.',
  },
  {
    icon: 'bi-grid-3x3-gap',
    title: 'Apps tab for students',
    text: 'Verified students browse all campus clubs in one place — tap through to Instagram, LinkedIn, and more.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Admin-controlled listings',
    text: 'Only school-approved clubs appear — no unverified student-created pages in the directory.',
  },
];

export function HomeSocialAppsSection() {
  return (
    <section id="social-apps" className="home-social-section">
      <div className="home-hero-bg" aria-hidden>
        <div className="home-hero-wave home-hero-wave-black" />
        <div className="home-hero-wave home-hero-wave-white" />
        <div className="home-hero-wave home-hero-wave-gray" />
      </div>

      <div className="container position-relative home-social-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-6 home-social-copy">
            <p className="home-social-eyebrow mb-2">Social Share &amp; Apps</p>
            <h2 className="home-social-title">
              <span className="home-social-title-line">Every official club</span>
              <span className="home-social-title-line">in one Apps directory</span>
            </h2>
            <p className="home-social-subtitle">
              SemBuzz connects campus organizations to their social presence — so students
              find clubs, follow their channels, and stay engaged beyond the feed.
            </p>

            <div className="home-social-pillars">
              {SOCIAL_PILLARS.map((pillar) => (
                <article key={pillar.title} className="home-social-pillar">
                  <div className="home-social-pillar-icon">
                    <i className={`bi ${pillar.icon}`} aria-hidden />
                  </div>
                  <div>
                    <h3 className="home-social-pillar-title">{pillar.title}</h3>
                    <p className="home-social-pillar-text mb-0">{pillar.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <HomeSocialAppsShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
