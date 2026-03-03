import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const SuperAdminSidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/super-admin/dashboard', label: 'List of Schools', icon: 'bi-list-ul' },
    { path: '/super-admin/schools/new', label: 'Create School', icon: 'bi-building-add' },
    { path: '/super-admin/features', label: 'Features', icon: 'bi-star' },
    { path: '/super-admin/queries', label: 'Queries', icon: 'bi-chat-left-text' },
    { path: '/super-admin/schools/edit', label: 'Edit School', icon: 'bi-pencil-square' },
    { path: '/super-admin/schools/info', label: 'School Info', icon: 'bi-info-circle' },
    { path: '/super-admin/raise-request', label: 'Raise a Request', icon: 'bi-question-circle' },
  ];

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
        {menuItems.map((item) => (
          <li key={item.path} className="mb-2">
            <Link
              to={item.path}
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
      </ul>
    </div>
  );
};
