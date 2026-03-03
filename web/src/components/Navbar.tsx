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
  const isEventsPage = location.pathname === '/events';
  const showEventsNav =
    isAuthenticated && isEventsPage && eventsFilter;

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
        <div className="container " style={{
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '50px',
          padding: '0.35rem 2rem',
          backgroundColor: '#1a1f2e',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Brand/Logo - Left */}
          <Link className="navbar-brand d-flex align-items-center" to="/" style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            <span style={{ 
              display: 'inline-block',
              width: '30px',
              height: '30px',
              background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
              borderRadius: '6px',
              marginRight: '10px',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                bottom: '4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '8px',
                background: '#fff',
                borderRadius: '1px'
              }}></span>
              <span style={{
                position: 'absolute',
                bottom: '4px',
                left: '40%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '12px',
                background: '#fff',
                borderRadius: '1px'
              }}></span>
              <span style={{
                position: 'absolute',
                bottom: '4px',
                left: '60%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '6px',
                background: '#fff',
                borderRadius: '1px'
              }}></span>
            </span>
            <span style={{ color: '#fff' }}>Sem</span>
            <span style={{ color: '#4dabf7' }}>Buzz</span>
          </Link>

          {/* Desktop Navigation Links - Center, Login - Right */}
          <div className="d-none d-lg-flex w-100">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                  to="/"
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    padding: '0.5rem 1rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                  to="/about"
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    padding: '0.5rem 1rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                >
                  About
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                  to="/contact"
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    padding: '0.5rem 1rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                >
                  Contact
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/faqs') ? 'active' : ''}`}
                  to="/faqs"
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    padding: '0.5rem 1rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                >
                  FAQs
                </Link>
              </li>
              {!isAuthenticated && (
                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link border-0 bg-transparent"
                    style={{
                      color: '#fff',
                      fontWeight: '400',
                      padding: '0.5rem 1rem',
                      transition: 'color 0.3s',
                      cursor: 'pointer',
                    }}
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
                  className={`nav-link ${isActive('/events') ? 'active' : ''}`}
                  to="/events"
                  style={{
                    color: '#fff',
                    fontWeight: '400',
                    padding: '0.5rem 1rem',
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4dabf7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
                >
                  Events
                </Link>
              </li>
            </ul>

            {/* Right: Events page – selected category, search, settings, more; then User / Login */}
            <div className="d-flex align-items-center gap-2">
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
              onClick={closeMobileMenu}
              style={{ fontSize: '1.25rem', fontWeight: '600', textDecoration: 'none' }}
            >
              <span style={{ 
                display: 'inline-block',
                width: '25px',
                height: '25px',
                background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
                borderRadius: '6px',
                marginRight: '10px',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '6px',
                  background: '#fff',
                  borderRadius: '1px'
                }}></span>
                <span style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '40%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '10px',
                  background: '#fff',
                  borderRadius: '1px'
                }}></span>
                <span style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '60%',
                  transform: 'translateX(-50%)',
                  width: '2px',
                  height: '5px',
                  background: '#fff',
                  borderRadius: '1px'
                }}></span>
              </span>
              <span style={{ color: '#fff' }}>Sem</span>
              <span style={{ color: '#4dabf7' }}>Buzz</span>
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
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`d-block py-2 px-3 ${isActive('/') ? 'active' : ''}`}
                style={{
                  color: isActive('/') ? '#4dabf7' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  backgroundColor: isActive('/') ? 'rgba(77, 171, 247, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/')) {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/')) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Home
              </Link>
            </li>
            <li className="mb-3">
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className={`d-block py-2 px-3 ${isActive('/about') ? 'active' : ''}`}
                style={{
                  color: isActive('/about') ? '#4dabf7' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  backgroundColor: isActive('/about') ? 'rgba(77, 171, 247, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/about')) {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/about')) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                About
              </Link>
            </li>
            <li className="mb-3">
              <Link
                to="/contact"
                onClick={closeMobileMenu}
                className={`d-block py-2 px-3 ${isActive('/contact') ? 'active' : ''}`}
                style={{
                  color: isActive('/contact') ? '#4dabf7' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  backgroundColor: isActive('/contact') ? 'rgba(77, 171, 247, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/contact')) {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/contact')) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Contact
              </Link>
            </li>
            <li className="mb-3">
              <Link
                to="/faqs"
                onClick={closeMobileMenu}
                className={`d-block py-2 px-3 ${isActive('/faqs') ? 'active' : ''}`}
                style={{
                  color: isActive('/faqs') ? '#4dabf7' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  backgroundColor: isActive('/faqs') ? 'rgba(77, 171, 247, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/faqs')) {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/faqs')) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                FAQs
              </Link>
            </li>
            {!isAuthenticated && (
              <li className="mb-3">
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); navigate('/events', { state: { openAuth: 'signup', bottomNav: 'settings' } }); }}
                  className="d-block py-2 px-3 w-100 text-start border-0 bg-transparent"
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Register
                </button>
              </li>
            )}
            <li className="mb-3">
              <Link
                to="/events"
                onClick={closeMobileMenu}
                className={`d-block py-2 px-3 ${isActive('/events') ? 'active' : ''}`}
                style={{
                  color: isActive('/events') ? '#4dabf7' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  backgroundColor: isActive('/events') ? 'rgba(77, 171, 247, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/events')) {
                    e.currentTarget.style.color = '#4dabf7';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 171, 247, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/events')) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Events
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
              )}
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};
