const CLUB_APPS = [
  {
    initials: 'AH',
    name: 'Art History Club',
    links: [
      { icon: 'bi-instagram', label: 'Instagram' },
      { icon: 'bi-linkedin', label: 'LinkedIn' },
    ],
  },
  {
    initials: 'RC',
    name: 'Robotics Collective',
    links: [
      { icon: 'bi-youtube', label: 'YouTube' },
      { icon: 'bi-globe2', label: 'Website' },
    ],
  },
  {
    initials: 'CW',
    name: 'Creative Writing Society',
    links: [{ icon: 'bi-instagram', label: 'Instagram' }],
  },
];

export function HomeSocialAppsShowcase() {
  return (
    <div className="home-social-showcase">
      <div className="home-social-phone">
        <div className="home-social-phone-notch" aria-hidden />
        <div className="home-social-phone-screen">
          <div className="home-social-phone-header">
            <strong>Apps</strong>
            <span>Official clubs &amp; links</span>
          </div>
          <div className="home-social-club-list">
            {CLUB_APPS.map((club) => (
              <div key={club.name} className="home-social-club-card">
                <div className="home-social-club-avatar">{club.initials}</div>
                <div className="home-social-club-info">
                  <strong>{club.name}</strong>
                  <div className="home-social-club-links">
                    {club.links.map((link) => (
                      <span key={link.label} className="home-social-club-link">
                        <i className={`bi ${link.icon}`} aria-hidden />
                        {link.label}
                      </span>
                    ))}
                  </div>
                </div>
                <i className="bi bi-chevron-right home-social-club-chevron" aria-hidden />
              </div>
            ))}
          </div>
          <div className="home-social-phone-nav" aria-hidden>
            <i className="bi bi-house" />
            <i className="bi bi-grid active" />
            <i className="bi bi-chat" />
            <i className="bi bi-person" />
          </div>
        </div>
      </div>
    </div>
  );
}
