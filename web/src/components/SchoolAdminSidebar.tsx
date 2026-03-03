import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const SchoolAdminSidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const mainMenuItems = [
    { path: '/school-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/school-admin/social-share', label: 'Social Share', icon: 'bi-share' },
    { path: '/school-admin/user-requests', label: 'User requests', icon: 'bi-person-plus' },
    { path: '/school-admin/approved-users', label: 'Approved users', icon: 'bi-person-check' },
    { path: '/school-admin/automated-users', label: 'Automated users', icon: 'bi-people' },
    { path: '/school-admin/total-users', label: 'Total users', icon: 'bi-eye' },
    { path: '/school-admin/categories', label: 'Categories', icon: 'bi-folder' },
    { path: '/school-admin/user-help', label: 'Users help', icon: 'bi-question-circle' },
    { path: '/school-admin/privacy', label: 'Privacy', icon: 'bi-shield-lock' },
    { path: '/school-admin/approved-posts', label: 'Approved posts', icon: 'bi-globe' },
    { path: '/school-admin/posts', label: 'Posts', icon: 'bi-file-post' },
    { path: '/school-admin/upcoming-news', label: 'Upcoming news', icon: 'bi-calendar-event' },
    { path: '/school-admin/analytics', label: 'Analytics', icon: 'bi-graph-up-arrow' },
    { path: '/school-admin/raise-request', label: 'Raise request', icon: 'bi-question-circle' },
  ];

  const settingsMenuItems = [
    { path: '/school-admin/settings/queries', label: 'Settings', icon: 'bi-gear', sublabel: 'Queries' },
  ];

  const linkStyle = (path: string) => ({
    color: isActive(path) ? '#1a1f2e' : '#6c757d',
    textDecoration: 'none',
    borderRadius: '0px',
    transition: 'all 0.3s',
    backgroundColor: isActive(path) ? 'rgba(26, 31, 46, 0.1)' : 'transparent',
    fontWeight: isActive(path) ? '500' : '400',
    borderLeft: isActive(path) ? '3px solid #1a1f2e' : '3px solid transparent',
    padding: '0.75rem',
    minHeight: '48px',
    whiteSpace: 'nowrap',
    justifyContent: isExpanded ? 'flex-start' : 'center',
  });

  return (
    <div
      style={{
        width: isExpanded ? '250px' : '80px',
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: 'white',
        borderRight: '1px solid #dee2e6',
        padding: '1.5rem 0',
        transition: 'width 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <ul className="list-unstyled mb-0" style={{ padding: '0 0.5rem' }}>
        {mainMenuItems.map((item) => (
          <li key={item.path} className="mb-2">
            <Link
              to={item.path}
              className="d-flex align-items-center"
              style={linkStyle(item.path)}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 31, 46, 0.05)';
                  e.currentTarget.style.color = '#1a1f2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6c757d';
                }
              }}
            >
              <i
                className={`bi ${item.icon}`}
                style={{
                  fontSize: '1.25rem',
                  minWidth: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: isExpanded ? '12px' : '0',
                  transition: 'margin-right 0.3s ease',
                  flexShrink: 0
                }}
              />
              <span
                style={{
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? 'auto' : '0',
                  overflow: 'hidden',
                  transition: 'opacity 0.3s ease, width 0.3s ease',
                  display: 'inline-block'
                }}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
        {settingsMenuItems.map((item) => (
          <li key={item.path} className="mb-2" style={{ marginTop: isExpanded ? '0.75rem' : 0 }}>
            <Link
              to={item.path}
              className="d-flex align-items-center"
              style={linkStyle(item.path)}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 31, 46, 0.05)';
                  e.currentTarget.style.color = '#1a1f2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6c757d';
                }
              }}
            >
              <i
                className={`bi ${item.icon}`}
                style={{
                  fontSize: '1.25rem',
                  minWidth: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: isExpanded ? '12px' : '0',
                  transition: 'margin-right 0.3s ease',
                  flexShrink: 0
                }}
              />
              <span
                style={{
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? 'auto' : '0',
                  overflow: 'hidden',
                  transition: 'opacity 0.3s ease, width 0.3s ease',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {item.label}
                {isExpanded && item.sublabel && (
                  <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: '400' }}>
                    {item.sublabel}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
