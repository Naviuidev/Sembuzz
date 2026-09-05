import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HOME_FEATURE_SECTIONS } from '../constants/homeFeatures';

export const SOCIAL_LINKS = [
  {
    href: 'https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg==',
    label: 'Instagram',
    icon: 'bi-instagram',
  },
  {
    href: 'https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1',
    label: 'Facebook',
    icon: 'bi-facebook',
  },
  {
    href: 'https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all',
    label: 'LinkedIn',
    icon: 'bi-linkedin',
  },
] as const;

export const FOOTER_EXPLORE_LINKS = [
  { to: '/events', label: 'Events', type: 'route' as const },
  { to: '/blogs', label: 'Blogs', type: 'route' as const },
  { to: '/#faqs', label: 'FAQ', type: 'hash' as const },
  { to: '/#contact-us', label: 'Contact', type: 'hash' as const },
];

export const FOOTER_LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy', type: 'route' as const },
  { to: '/terms', label: 'Terms & Conditions', type: 'route' as const },
  { to: '/#community-guidelines', label: 'Community Guidelines', type: 'hash' as const },
];

function FooterLink({
  to,
  label,
  type,
  onNavigate,
}: {
  to: string;
  label: string;
  type: 'route' | 'hash';
  onNavigate: (to: string, type: 'route' | 'hash') => void;
}) {
  if (type === 'hash') {
    return (
      <button type="button" className="site-footer-link" onClick={() => onNavigate(to, type)}>
        {label}
      </button>
    );
  }

  return (
    <Link to={to} className="site-footer-link">
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashLink = (to: string, type: 'route' | 'hash') => {
    if (type === 'route') {
      navigate(to);
      return;
    }

    const hash = to.includes('#') ? to.split('#')[1] : '';
    if (!hash) return;

    if (location.pathname === '/') {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${hash}`);
      }
      return;
    }

    navigate(`/#${hash}`);
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo text-decoration-none">
              <img src="/logo.png" alt="SemBuzz" className="site-footer-logo-img" />
              <span>SemBuzz</span>
            </Link>
            <p className="site-footer-tagline">
              One app for campus news, events, clubs, messaging, and verified student engagement.
            </p>
            <div className="site-footer-socials">
              {SOCIAL_LINKS.map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer-social"
                  aria-label={label}
                >
                  <i className={`bi ${icon}`} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Explore</h3>
            <ul className="site-footer-links list-unstyled mb-0">
              {FOOTER_EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onNavigate={handleHashLink} />
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-col site-footer-col-features">
            <h3 className="site-footer-heading">Product</h3>
            <ul className="site-footer-links list-unstyled mb-0">
              {HOME_FEATURE_SECTIONS.map((feature) => (
                <li key={feature.id}>
                  <button
                    type="button"
                    className="site-footer-link"
                    onClick={() => handleHashLink(`/#${feature.id}`, 'hash')}
                  >
                    {feature.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-heading">Legal</h3>
            <ul className="site-footer-links list-unstyled mb-0">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onNavigate={handleHashLink} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy mb-0">
            © {new Date().getFullYear()} SemBuzz. All rights reserved.
          </p>
          <a href="mailto:contact@sdmlllc.com" className="site-footer-email">
            contact@sdmlllc.com
          </a>
        </div>
      </div>
    </footer>
  );
}
