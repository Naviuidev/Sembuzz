import { useState } from 'react';
import { Link } from 'react-router-dom';

type AdminPortalTabId = 'school' | 'category' | 'subcategory' | 'ads' | 'student';

type AdminPortalTab = {
  id: AdminPortalTabId;
  label: string;
  desc: string;
  icon: string;
  level: string;
  portalName: string;
  tagline: string;
  capabilities: string[];
  screenshot?: string;
  screenshotAlt?: string;
  previewVariant: 'desktop' | 'phone' | 'card' | 'ads-mock';
  loginPath?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

function AdsAdminMock() {
  return (
    <div className="admin-portals-ads-mock">
      <div className="admin-portals-ads-mock-header">
        <strong>Ads Admin</strong>
        <span>Campaign performance</span>
      </div>
      <div className="admin-portals-ads-mock-stats">
        <div>
          <span>Views</span>
          <strong>12.4k</strong>
        </div>
        <div>
          <span>Clicks</span>
          <strong>842</strong>
        </div>
        <div>
          <span>CTR</span>
          <strong>6.8%</strong>
        </div>
      </div>
      <div className="admin-portals-ads-mock-chart" aria-hidden />
      <div className="admin-portals-ads-mock-table">
        <div className="head">
          <span>Campaign</span>
          <span>Views</span>
          <span>Clicks</span>
        </div>
        <div className="row">
          <span>Internship Fair Sponsored</span>
          <span>4.2k</span>
          <span>312</span>
        </div>
        <div className="row">
          <span>Campus Coffee Banner</span>
          <span>8.2k</span>
          <span>530</span>
        </div>
      </div>
    </div>
  );
}

const ADMIN_PORTAL_TABS: AdminPortalTab[] = [
  {
    id: 'category',
    label: 'Category Admin',
    desc: 'Reviews & approves',
    icon: 'bi-check2-circle',
    level: 'Department',
    portalName: 'Category Admin Portal',
    tagline: 'Moderate department content',
    capabilities: [
      'Approve or reject events and blogs from contributors',
      'Schedule publish times on approved content',
      'Manage subcategory admins for your categories',
      'Track category-level analytics and queries',
    ],
    screenshot: '/hero/category-admin.png',
    screenshotAlt: 'SemBuzz category admin dashboard',
    previewVariant: 'desktop',
    loginPath: '/category-admin/login',
  },
  {
    id: 'school',
    label: 'School Admin',
    desc: 'Publishes & manages campus',
    icon: 'bi-building',
    level: 'Institution',
    portalName: 'School Admin Portal',
    tagline: 'Run your campus workspace',
    capabilities: [
      'Configure categories and subcategories',
      'Approve student signups and manage users',
      'Create posts and schedule campus announcements',
      'Provision category admins and messaging settings',
      'View school-wide analytics and engagement',
    ],
    screenshot: '/hero/school-admin.png',
    screenshotAlt: 'SemBuzz school admin privacy and admin setup',
    previewVariant: 'desktop',
    loginPath: '/school-admin/login',
  },
  {
    id: 'subcategory',
    label: 'Subcategory Admin',
    desc: 'Creates events & blogs',
    icon: 'bi-pencil-square',
    level: 'Contributor',
    portalName: 'Subcategory Admin Portal',
    tagline: 'Create content for your group',
    capabilities: [
      'Post events to the campus feed for approval',
      'Submit blogs and track approval status',
      'Resubmit content after corrections',
      'Request group chats and raise support queries',
    ],
    screenshot: '/hero/subcategory-admin.png',
    screenshotAlt: 'SemBuzz subcategory admin blogs portal',
    previewVariant: 'desktop',
    loginPath: '/subcategory-admin/login',
  },
  {
    id: 'ads',
    label: 'Ads Admin',
    desc: 'Campaigns & analytics',
    icon: 'bi-megaphone',
    level: 'Advertising',
    portalName: 'Ads Admin Portal',
    tagline: 'Manage campus ad campaigns',
    capabilities: [
      'Create sponsored posts and banner ad campaigns',
      'Schedule start and end times for each campaign',
      'Track views, clicks, and click-through rates',
      'Review daily performance charts and campaign tables',
    ],
    previewVariant: 'ads-mock',
    loginPath: '/ads-admin/login',
  },
  {
    id: 'student',
    label: 'Student feed',
    desc: 'Verified students see updates',
    icon: 'bi-phone',
    level: 'Mobile app',
    portalName: 'Student Campus Feed',
    tagline: 'Everything happening on your campus',
    capabilities: [
      'Browse events, internships, and campus announcements',
      'Filter by school, category, and content type',
      'Save and bookmark opportunities for later',
      'Receive alerts for deadlines and important updates',
    ],
    screenshot: '/hero/mobile-app.png',
    screenshotAlt: 'SemBuzz mobile campus feed for students',
    previewVariant: 'phone',
    ctaHref: 'https://apps.apple.com/in/app/sembuzz-a4eec2/id6761261221',
    ctaLabel: 'Download the App',
  },
];

export function AdminPortalTabs() {
  const [activeTab, setActiveTab] = useState<AdminPortalTabId>('category');
  const active = ADMIN_PORTAL_TABS.find((tab) => tab.id === activeTab) ?? ADMIN_PORTAL_TABS[0];

  return (
    <div className="admin-portals-tabs-wrap">
      <div className="admin-portals-tabs" role="tablist" aria-label="Admin portal workflow">
        {ADMIN_PORTAL_TABS.map((tab, i) => {
          const isActive = tab.id === activeTab;
          return (
            <div key={tab.id} className="admin-portals-tabs-item">
              <button
                type="button"
                role="tab"
                id={`admin-portal-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="admin-portal-panel"
                className={`admin-portals-tab${isActive ? ' admin-portals-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`} aria-hidden />
                <div>
                  <strong>{tab.label}</strong>
                  <span>{tab.desc}</span>
                </div>
              </button>
              {i < ADMIN_PORTAL_TABS.length - 1 && (
                <i className="bi bi-arrow-right admin-portals-tabs-arrow" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      <div
        id="admin-portal-panel"
        role="tabpanel"
        aria-labelledby={`admin-portal-tab-${active.id}`}
        className="admin-portals-panel"
      >
        <div className="row g-4 g-lg-5 align-items-center">
          <div className="col-lg-5">
            <span className="admin-portals-panel-level">{active.level}</span>
            <h3 className="admin-portals-panel-name">{active.portalName}</h3>
            <p className="admin-portals-panel-tagline">{active.tagline}</p>
            <ul className="admin-portals-panel-list list-unstyled mb-4">
              {active.capabilities.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {active.loginPath ? (
              <Link to={active.loginPath} className="admin-portals-panel-cta">
                Log in to {active.portalName.replace(' Portal', '')}
                <i className="bi bi-arrow-up-right" aria-hidden />
              </Link>
            ) : (
              <a
                href={active.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark rounded-pill admin-portals-panel-cta-btn"
              >
                {active.ctaLabel}
              </a>
            )}
          </div>

          <div className="col-lg-7">
            <div
              className={`admin-portals-preview admin-portals-preview-${active.previewVariant}`}
            >
              {active.previewVariant === 'ads-mock' ? (
                <AdsAdminMock />
              ) : (
                <img
                  key={active.id}
                  src={active.screenshot}
                  alt={active.screenshotAlt}
                  className="admin-portals-preview-img"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
