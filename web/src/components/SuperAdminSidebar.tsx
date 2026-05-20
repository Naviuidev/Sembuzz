import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

type MenuItem = {
  path: string;
  label: string;
  icon: string;
  iconType?: 'bi' | 'gemini';
  title?: string;
};

const GeminiIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4796E3" />
        <stop offset="50%" stopColor="#9168C0" />
        <stop offset="100%" stopColor="#E94235" />
      </linearGradient>
    </defs>
    <path
      d="M12 2c.3 4.2 1.6 6.6 3.6 8C13.6 11.4 12.3 13.8 12 18c-.3-4.2-1.6-6.6-3.6-8C10.4 8.6 11.7 6.2 12 2zm9 10c-2.6.2-4.1 1-5 2.2-.9-1.2-2.4-2-5-2.2 2.6-.2 4.1-1 5-2.2.9 1.2 2.4 2 5 2.2zM3 12c2.6-.2 4.1-1 5-2.2.9 1.2 2.4 2 5 2.2-2.6.2-4.1 1-5 2.2-.9-1.2-2.4-2-5-2.2zm9 10c-.2-2.6-1-4.1-2.2-5 1.2-.9 2-2.4 2.2-5 .2 2.6 1 4.1 2.2 5-1.2.9-2 2.4-2.2 5z"
      fill="url(#geminiGrad)"
    />
  </svg>
);

export const SuperAdminSidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const menuItems: MenuItem[] = [
    { path: '/super-admin/dashboard', label: 'List of Schools', icon: 'bi-list-ul' },
    { path: '/super-admin/schools/new', label: 'Create School', icon: 'bi-building-add' },
    { path: '/super-admin/features', label: 'Features', icon: 'bi-star' },
    { path: '/super-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
    { path: '/super-admin/schools/edit', label: 'Edit School', icon: 'bi-pencil-square' },
    { path: '/super-admin/schools/info', label: 'School Info', icon: 'bi-info-circle' },
    {
      path: '/super-admin/event-sync',
      label: 'Fetch events',
      icon: 'bi-link-45deg',
      title: 'Add page URLs and CSS selectors, then sync scraped events'
    },
    { path: '/super-admin/raise-request', label: 'Raise a Request', icon: 'bi-question-circle' },
  ];

  return (
    <div
      style={{
        width: isExpanded ? '250px' : '80px',
        minHeight: 'calc(100vh - 60px)',
        maxHeight: 'calc(100vh - 60px)',
        backgroundColor: 'white',
        borderRight: '1px solid #dee2e6',
        padding: '1.5rem 0',
        transition: 'width 0.3s ease',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <ul className="list-unstyled mb-0" style={{ padding: '0 0.5rem' }}>
        {menuItems.map((item) => (
          <li key={item.path} className="mb-2">
            <Link
              to={item.path}
              title={item.title ?? item.label}
              className="d-flex align-items-center"
              style={{
                color: isActive(item.path) ? '#1a1f2e' : '#6c757d',
                textDecoration: 'none',
                borderRadius: '0px',
                transition: 'all 0.3s',
                backgroundColor: isActive(item.path) ? 'rgba(26, 31, 46, 0.1)' : 'transparent',
                fontWeight: isActive(item.path) ? '500' : '400',
                borderLeft: isActive(item.path) ? '3px solid #1a1f2e' : '3px solid transparent',
                padding: '0.75rem',
                minHeight: '48px',
                whiteSpace: 'nowrap',
                justifyContent: isExpanded ? 'flex-start' : 'center'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 31, 46, 0.05)';
                  e.currentTarget.style.color = '#1a1f2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = isActive(item.path) ? 'rgba(26, 31, 46, 0.1)' : 'transparent';
                  e.currentTarget.style.color = isActive(item.path) ? '#1a1f2e' : '#6c757d';
                }
              }}
            >
              <span
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
              >
                {item.iconType === 'gemini' ? (
                  <GeminiIcon size={20} />
                ) : (
                  <i className={`bi ${item.icon}`} />
                )}
              </span>
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
      </ul>
    </div>
  );
};
