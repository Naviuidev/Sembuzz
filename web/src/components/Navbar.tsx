import { Link, useLocation, useNavigate, type LinkProps } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useEventsFilter } from '../contexts/EventsFilterContext';
import { HOME_FEATURE_SECTIONS } from '../constants/homeFeatures';

const navLinkStyle = {
  color: '#1a1f2e',
  fontWeight: '400' as const,
  padding: '0.5rem 1rem',
  transition: 'color 0.3s',
};

const navLinkHoverColor = '#0b4a99';

const loginButtonStyle = {
  backgroundColor: '#1a1f2e',
  border: 'none',
  borderRadius: '50px',
  padding: '0.5rem 1.5rem',
  fontWeight: '500',
  color: '#fff',
  transition: 'all 0.3s',
  boxShadow: '0 2px 8px rgba(26, 31, 46, 0.15)',
};

function NavLinkHover({
  children,
  className = 'nav-link',
  style,
  ...props
}: LinkProps & { children: ReactNode }) {
  return (
    <Link
      className={className}
      style={{ ...navLinkStyle, ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = navLinkHoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#1a1f2e';
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useUserAuth();
  const eventsFilter = useEventsFilter();
  const isActive = (path: string) => location.pathname === path;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const isEventsPage = location.pathname === '/events';
  const showEventsNav = isAuthenticated && isEventsPage && eventsFilter;

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileFeaturesOpen(false);
  };

  const openLogin = () => {
    navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } });
  };

  const scrollToFeature = (sectionId: string) => {
    closeMobileMenu();
    setFeaturesDropdownOpen(false);

    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${sectionId}`);
      }
      return;
    }

    navigate(`/#${sectionId}`);
  };

  return (
    <>
      <nav className="navbar sticky-top navbar-expand-lg site-navbar">
        <div className="container-fluid site-navbar-inner px-3 px-lg-4">
          {/* Desktop — logo left, links center, login right */}
          <div className="w-100 site-navbar-desktop">
            <div className="site-navbar-left">
              <Link
                className="navbar-brand d-flex align-items-center site-navbar-brand mb-0"
                to="/"
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <img src="/logo.png" alt="Sembuzz" className="site-navbar-logo" />
                <span>Sembuzz</span>
              </Link>
            </div>

            <div className="site-navbar-center">
              <ul className="navbar-nav flex-row align-items-center mb-0 site-navbar-links">
                <li
                  className="nav-item site-navbar-features-dropdown"
                  onMouseEnter={() => setFeaturesDropdownOpen(true)}
                  onMouseLeave={() => setFeaturesDropdownOpen(false)}
                >
                  <button
                    type="button"
                    className="nav-link site-navbar-features-trigger border-0 bg-transparent d-flex align-items-center gap-1"
                    style={{ ...navLinkStyle, cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = navLinkHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#1a1f2e';
                    }}
                    aria-expanded={featuresDropdownOpen}
                    aria-haspopup="true"
                  >
                    Sembuzz is for
                    <i
                      className="bi bi-chevron-down site-navbar-features-chevron"
                      style={{
                        transform: featuresDropdownOpen ? 'rotate(180deg)' : 'none',
                      }}
                      aria-hidden
                    />
                  </button>
                  <ul
                    className={`site-navbar-features-menu list-unstyled mb-0${featuresDropdownOpen ? ' is-open' : ''}`}
                    role="menu"
                    aria-label="Sembuzz is for"
                  >
                    {HOME_FEATURE_SECTIONS.map((feature) => (
                      <li key={feature.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className="site-navbar-features-item"
                          onClick={() => scrollToFeature(feature.id)}
                        >
                          <i className={`bi ${feature.icon}`} aria-hidden />
                          <span>{feature.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="nav-item">
                  <NavLinkHover to="/#faqs">FAQ</NavLinkHover>
                </li>
                <li className="nav-item">
                  <NavLinkHover to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
                    Events
                  </NavLinkHover>
                </li>
                <li className="nav-item">
                  <NavLinkHover
                    to="/blogs"
                    className={`nav-link ${location.pathname.startsWith('/blogs') ? 'active' : ''}`}
                  >
                    Blogs
                  </NavLinkHover>
                </li>
                <li className="nav-item">
                  <NavLinkHover to="/#contact-us">Contact</NavLinkHover>
                </li>
              </ul>
            </div>

            <div className="site-navbar-right d-flex align-items-center justify-content-end gap-2">
            {showEventsNav && (
              <div className="d-flex align-items-center gap-2 site-navbar-events-tools">
                <span
                  className="d-flex align-items-center rounded-3 px-2 py-1 site-navbar-events-chip"
                  title={eventsFilter.selectedCategoryName ?? 'Category'}
                >
                  <i className="bi bi-folder2 me-1" />
                  {eventsFilter.selectedCategoryName ?? 'Category'}
                </span>
                <input
                  type="search"
                  placeholder="Search"
                  className="form-control form-control-sm site-navbar-events-search"
                  value={eventsFilter.searchQuery}
                  onChange={(e) => eventsFilter.setSearchQuery(e.target.value)}
                />
                <Link
                  to="/events"
                  className="btn btn-link p-1 site-navbar-icon-btn"
                  title="Settings"
                  aria-label="Settings"
                >
                  <i className="bi bi-gear" style={{ fontSize: '1.1rem' }} />
                </Link>
                <button
                  type="button"
                  className="btn btn-link p-1 site-navbar-icon-btn"
                  title="More"
                  aria-label="More options"
                >
                  <i className="bi bi-three-dots-vertical" style={{ fontSize: '1.1rem' }} />
                </button>
              </div>
            )}

            {isAuthenticated && user ? (
              <div className="d-flex align-items-center gap-2">
                <span className="site-navbar-user-name">{user.name}</span>
                <button
                  type="button"
                  className="btn site-navbar-auth-btn"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  style={loginButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0b4a99';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn site-navbar-auth-btn"
                style={loginButtonStyle}
                onClick={openLogin}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b4a99';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                }}
              >
                Log In
              </button>
            )}
            </div>
          </div>

          {/* Mobile — logo left, menu right */}
          <div className="d-lg-none d-flex w-100 align-items-center justify-content-between">
            <Link
              className="navbar-brand d-flex align-items-center site-navbar-brand"
              to="/"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <img src="/logo.png" alt="Sembuzz" className="site-navbar-logo" />
              <span>Sembuzz</span>
            </Link>

            <button
              className="navbar-toggler border-0 site-navbar-toggler"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <span
                className="site-navbar-toggler-bar"
                style={{
                  transform: isMobileMenuOpen ? 'rotate(45deg) translateY(8px)' : 'none',
                }}
              />
              <span
                className="site-navbar-toggler-bar"
                style={{ opacity: isMobileMenuOpen ? 0 : 1 }}
              />
              <span
                className="site-navbar-toggler-bar"
                style={{
                  transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040,
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isMobileMenuOpen ? 0 : '-100%',
          width: '280px',
          height: '100vh',
          backgroundColor: '#1a1f2e',
          zIndex: 1050,
          transition: 'left 0.3s ease-in-out',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
          overflowY: 'auto',
        }}
      >
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link
              to="/"
              className="d-flex align-items-center"
              onClick={() => {
                closeMobileMenu();
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{ fontSize: '1.25rem', fontWeight: '600', textDecoration: 'none' }}
            >
              <img src="/logo.png" alt="Sembuzz" style={{ height: '28px', width: 'auto', marginRight: '8px' }} />
              <span style={{ color: '#fff' }}>Sembuzz</span>
            </Link>
            <button
              type="button"
              onClick={closeMobileMenu}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: 0,
                width: '30px',
                height: '30px',
              }}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <ul className="list-unstyled">
            <li className="mb-2">
              <button
                type="button"
                className="mobile-nav-link mobile-nav-features-toggle d-flex align-items-center justify-content-between w-100 border-0 bg-transparent"
                onClick={() => setMobileFeaturesOpen((open) => !open)}
                aria-expanded={mobileFeaturesOpen}
              >
                <span>Sembuzz is for</span>
                <i
                  className="bi bi-chevron-down"
                  style={{
                    fontSize: '0.75rem',
                    transition: 'transform 0.2s ease',
                    transform: mobileFeaturesOpen ? 'rotate(180deg)' : 'none',
                  }}
                  aria-hidden
                />
              </button>
              {mobileFeaturesOpen && (
                <ul className="list-unstyled mobile-nav-features-list mb-0">
                  {HOME_FEATURE_SECTIONS.map((feature) => (
                    <li key={feature.id}>
                      <button
                        type="button"
                        className="mobile-nav-feature-item"
                        onClick={() => scrollToFeature(feature.id)}
                      >
                        <i className={`bi ${feature.icon}`} aria-hidden />
                        {feature.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li className="mb-3">
              <Link to="/#faqs" onClick={closeMobileMenu} className="d-block py-2 px-3 mobile-nav-link">
                FAQ
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/events" onClick={closeMobileMenu} className="d-block py-2 px-3 mobile-nav-link">
                Events
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/blogs" onClick={closeMobileMenu} className="d-block py-2 px-3 mobile-nav-link">
                Blogs
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#contact-us" onClick={closeMobileMenu} className="d-block py-2 px-3 mobile-nav-link">
                Contact
              </Link>
            </li>

            {showEventsNav && (
              <li className="mb-3">
                <div className="d-flex flex-wrap align-items-center gap-2 py-2 px-3">
                  <span className="small text-white-50">Category:</span>
                  <span className="small text-white">{eventsFilter.selectedCategoryName ?? '—'}</span>
                  <input
                    type="search"
                    placeholder="Search"
                    className="form-control form-control-sm"
                    value={eventsFilter.searchQuery}
                    onChange={(e) => eventsFilter.setSearchQuery(e.target.value)}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      maxWidth: '120px',
                    }}
                  />
                </div>
              </li>
            )}

            <li className="mt-4">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  className="btn btn-outline-light w-100"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                    navigate('/');
                  }}
                >
                  Log out ({user.name})
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  style={{ backgroundColor: '#4dabf7', border: 'none', borderRadius: '8px' }}
                  onClick={() => {
                    closeMobileMenu();
                    openLogin();
                  }}
                >
                  Log In
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
