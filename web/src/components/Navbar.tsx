import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useEventsFilter } from '../contexts/EventsFilterContext';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useUserAuth();
  const eventsFilter = useEventsFilter();
  const isActive = (path: string) => location.pathname === path;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sembuzzForDropdownOpen, setSembuzzForDropdownOpen] = useState(false);
  const [sembuzzPolicyDropdownOpen, setSembuzzPolicyDropdownOpen] = useState(false);
  const isEventsPage = location.pathname === '/events';
  const showEventsNav =
    isAuthenticated && isEventsPage && eventsFilter;

  const navLinkStyle = {
    color: '#fff',
    fontWeight: '400' as const,
    padding: '0.5rem 1rem',
    transition: 'color 0.3s',
  };

  const dropdownMenuStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    zIndex: 1050,
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '0.25rem 0',
    minWidth: '200px',
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar sticky-top navbar-expand-lg navbar-dark" style={{ 
        backgroundColor: 'transparent',
        padding: '1rem 0'
      }}>
        <div className="container-fluid " style={{
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50px',
          padding: '0.35rem 2rem',
          backgroundColor: '#1a1f2e',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Brand/Logo - Left: scroll to top on home, else go to home */}
          <Link
            className="navbar-brand d-flex align-items-center"
            to="/"
            style={{ fontSize: '1.5rem', fontWeight: '600' }}
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img src="/logo.png" alt="Sembuzz" style={{ height: '32px', width: 'auto', marginRight: '8px' }} />
            <span style={{ color: '#fff' }}>Sembuzz</span>
          </Link>

          {/* Desktop Navigation Links - Center */}
          <div className="d-none d-lg-flex w-100 align-items-center">
            <ul className="navbar-nav ms-auto mb-0 align-items-center">
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/#about"
                  style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                >
                  About
                </Link>
              </li>
              <li
                className="nav-item dropdown"
                style={{ position: 'relative' }}
                onMouseEnter={() => setSembuzzForDropdownOpen(true)}
                onMouseLeave={() => setSembuzzForDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="nav-link dropdown-toggle border-0 bg-transparent d-flex align-items-center gap-1"
                  style={{ ...navLinkStyle, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                  aria-expanded={sembuzzForDropdownOpen}
                  aria-haspopup="true"
                >
                  Sembuzz is for
                  <i
                    className="bi bi-chevron-down"
                    style={{ fontSize: '0.75rem', transition: 'transform 0.2s ease', transform: sembuzzForDropdownOpen ? 'rotate(180deg)' : 'none' }}
                    aria-hidden
                  />
                </button>
                <ul
                  className="dropdown-menu list-unstyled mb-0"
                  style={{
                    ...dropdownMenuStyle,
                    display: sembuzzForDropdownOpen ? 'block' : 'none',
                  }}
                >
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#for-students"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      For Students
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#for-universities"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      For Universities
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#for-employers"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      For Employers
                    </Link>
                  </li>
                </ul>
              </li>
              <li
                className="nav-item dropdown"
                style={{ position: 'relative' }}
                onMouseEnter={() => setSembuzzPolicyDropdownOpen(true)}
                onMouseLeave={() => setSembuzzPolicyDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="nav-link dropdown-toggle border-0 bg-transparent d-flex align-items-center gap-1"
                  style={{ ...navLinkStyle, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                  aria-expanded={sembuzzPolicyDropdownOpen}
                  aria-haspopup="true"
                >
                  Sembuzz Policy
                  <i
                    className="bi bi-chevron-down"
                    style={{ fontSize: '0.75rem', transition: 'transform 0.2s ease', transform: sembuzzPolicyDropdownOpen ? 'rotate(180deg)' : 'none' }}
                    aria-hidden
                  />
                </button>
                <ul
                  className="dropdown-menu list-unstyled mb-0"
                  style={{
                    ...dropdownMenuStyle,
                    display: sembuzzPolicyDropdownOpen ? 'block' : 'none',
                  }}
                >
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#privacy"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#community-guidelines"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      Community Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/#terms-of-service"
                      style={{ color: '#1a1f2e', padding: '0.5rem 1rem', textDecoration: 'none', display: 'block' }}
                    >
                      Terms and Conditions
                    </Link>
                  </li>
                </ul>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/events') ? 'active' : ''}`}
                  to="/events"
                  style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                >
                  Events
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/#faqs"
                  style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                >
                  FAQs
                </Link>
              </li>
              {!isAuthenticated && (
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link border-0 bg-transparent"
                    style={{ ...navLinkStyle, cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                    onClick={() => navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } })}
                  >
                    Register
                  </button>
                </li>
              )}
              <li className="nav-item">
                <Link
                  className="nav-link"
                  to="/#contact-us"
                  style={navLinkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#fff'; }}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Right: Social icons, Register, Login (or Events page tools + User) */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <a
                href="https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg=="
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center justify-content-center"
                style={{ color: 'rgba(255,255,255,0.9)', width: 32, height: 32, borderRadius: '50%', transition: 'color 0.2s' }}
                aria-label="Instagram"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              >
                <i className="bi bi-instagram" style={{ fontSize: '1.2rem' }} />
              </a>
              <a
                href="https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1"
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center justify-content-center"
                style={{ color: 'rgba(255,255,255,0.9)', width: 32, height: 32, borderRadius: '50%', transition: 'color 0.2s' }}
                aria-label="Facebook"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              >
                <i className="bi bi-facebook" style={{ fontSize: '1.2rem' }} />
              </a>
              <a
                href="https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center justify-content-center"
                style={{ color: 'rgba(255,255,255,0.9)', width: 32, height: 32, borderRadius: '50%', transition: 'color 0.2s' }}
                aria-label="LinkedIn"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#4dabf7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
              >
                <i className="bi bi-linkedin" style={{ fontSize: '1.2rem' }} />
              </a>
              {showEventsNav && (
                <>
                  <span
                    className="d-flex align-items-center rounded-3 px-2 py-1"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.95)',
                      fontSize: '0.85rem',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={eventsFilter.selectedCategoryName ?? 'Category'}
                  >
                    <i className="bi bi-folder2 me-1" />
                    {eventsFilter.selectedCategoryName ?? 'Category'}
                  </span>
                  <input
                    type="search"
                    placeholder="Search"
                    className="form-control form-control-sm"
                    value={eventsFilter.searchQuery}
                    onChange={(e) => eventsFilter.setSearchQuery(e.target.value)}
                    style={{
                      width: '100px',
                      borderRadius: '50px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <Link
                    to="/events"
                    className="btn btn-link p-1"
                    style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
                    title="Settings"
                    aria-label="Settings"
                  >
                    <i className="bi bi-gear" style={{ fontSize: '1.1rem' }} />
                  </Link>
                  <button
                    type="button"
                    className="btn btn-link p-1"
                    style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
                    title="More"
                    aria-label="More options"
                  >
                    <i className="bi bi-three-dots-vertical" style={{ fontSize: '1.1rem' }} />
                  </button>
                </>
              )}
              {isAuthenticated && user ? (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                    {user.name}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { logout(); navigate('/'); }}
                    style={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      fontWeight: '500',
                      color: 'black',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 8px rgba(77, 171, 247, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a1f2e';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(77, 171, 247, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = 'black';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(77, 171, 247, 0.3)';
                    }}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.5rem 1.5rem',
                    fontWeight: '500',
                    color: 'black',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(77, 171, 247, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(77, 171, 247, 0.4)';
                  }}
                  onClick={() => navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } })}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = 'black';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(77, 171, 247, 0.3)';
                  }}
                >
                  Log In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="d-lg-none navbar-toggler border-0"
            type="button"
            onClick={toggleMobileMenu}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0.25rem 0.5rem',
              outline: 'none'
            }}
            aria-label="Toggle navigation"
          >
            <span style={{
              display: 'block',
              width: '25px',
              height: '3px',
              backgroundColor: '#fff',
              margin: '5px 0',
              transition: '0.3s',
              transform: isMobileMenuOpen ? 'rotate(45deg) translateY(8px)' : 'none'
            }}></span>
            <span style={{
              display: 'block',
              width: '25px',
              height: '3px',
              backgroundColor: '#fff',
              margin: '5px 0',
              transition: '0.3s',
              opacity: isMobileMenuOpen ? 0 : 1
            }}></span>
            <span style={{
              display: 'block',
              width: '25px',
              height: '3px',
              backgroundColor: '#fff',
              margin: '5px 0',
              transition: '0.3s',
              transform: isMobileMenuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'
            }}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
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
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        ></div>
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
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
          overflowY: 'auto'
        }}
      >
        <div className="p-4">
          {/* Close Button */}
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
              onClick={closeMobileMenu}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <ul className="list-unstyled">
            <li className="mb-3">
              <Link to="/#about" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                About
              </Link>
            </li>
            <li className="mb-2 ms-3 small text-white-50">Sembuzz is for</li>
            <li className="mb-3">
              <Link to="/#for-students" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                For Students
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#for-universities" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                For Universities
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#for-employers" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                For Employers
              </Link>
            </li>
            <li className="mb-2 ms-3 small text-white-50">Sembuzz Policy</li>
            <li className="mb-3">
              <Link to="/#privacy" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                Privacy Policy
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#community-guidelines" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                Community Guidelines
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#terms-of-service" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                Terms and Conditions
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/events" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                Events
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#faqs" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                FAQs
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/#contact-us" onClick={closeMobileMenu} className="d-block py-2 px-3" style={{ color: '#fff', textDecoration: 'none', borderRadius: '8px' }}>
                Contact us
              </Link>
            </li>
            <li className="mb-3 d-flex gap-2">
              <a href="https://www.instagram.com/sembuzzofficial?igsh=MWRxaHRldjZ1N3Z2cg==" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', padding: '0.5rem' }} aria-label="Instagram">
                <i className="bi bi-instagram" style={{ fontSize: '1.25rem' }} />
              </a>
              <a href="https://www.facebook.com/people/Sembuzzofficial/61555782134710/?ref=1" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', padding: '0.5rem' }} aria-label="Facebook">
                <i className="bi bi-facebook" style={{ fontSize: '1.25rem' }} />
              </a>
              <a href="https://www.linkedin.com/company/sembuzzsdmlhq/posts/?feedView=all" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', padding: '0.5rem' }} aria-label="LinkedIn">
                <i className="bi bi-linkedin" style={{ fontSize: '1.25rem' }} />
              </a>
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
                  <Link to="/events" className="btn btn-link p-1 text-white" title="Settings" aria-label="Settings">
                    <i className="bi bi-gear" />
                  </Link>
                  <button type="button" className="btn btn-link p-1 text-white" title="More" aria-label="More">
                    <i className="bi bi-three-dots-vertical" />
                  </button>
                </div>
              </li>
            )}
            <li className="mt-4">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  className="btn btn-outline-light w-100 text-center d-block"
                  onClick={() => { closeMobileMenu(); logout(); navigate('/'); }}
                  style={{
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.5)',
                    color: '#fff',
                    backgroundColor: 'transparent'
                  }}
                >
                  Log out ({user.name})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { closeMobileMenu(); navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } }); }}
                    className="btn btn-outline-light w-100 text-center d-block mb-2"
                    style={{
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontWeight: '500',
                      border: '1px solid rgba(255,255,255,0.5)',
                      color: '#fff',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => { closeMobileMenu(); navigate('/events', { state: { openAuth: 'login', bottomNav: 'settings' } }); }}
                    className="btn btn-primary w-100 text-center d-block"
                  style={{
                    backgroundColor: '#4dabf7',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(77, 171, 247, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#339af0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(77, 171, 247, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4dabf7';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(77, 171, 247, 0.3)';
                }}
              >
                Log In
              </button>
              </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
