import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const AdsAdminSidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/ads-admin/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/ads-admin/ads', label: 'Ads', icon: 'bi-megaphone' },
    { path: '/ads-admin/ads-analytics', label: 'Ads Analytics', icon: 'bi-bar-chart-line' },
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
        overflow: 'hidden',
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
                backgroundColor: isActive(item.path) ? 'rgba(26, 31, 46, 0.1)' : 'transparent',
                fontWeight: isActive(item.path) ? '500' : '400',
                borderLeft: isActive(item.path) ? '3px solid #1a1f2e' : '3px solid transparent',
                padding: '0.75rem',
                minHeight: '48px',
                whiteSpace: 'nowrap',
                justifyContent: isExpanded ? 'flex-start' : 'center',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1.25rem', minWidth: '24px', marginRight: isExpanded ? '12px' : 0 }} />
              <span style={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0, overflow: 'hidden' }}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
