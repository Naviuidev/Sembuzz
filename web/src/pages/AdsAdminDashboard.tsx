import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdsAdminLayout } from '../components/AdsAdminLayout';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { adsAdminBannerAdsService } from '../services/ads-admin-banner-ads.service';
import { adsAdminSponsoredAdsService } from '../services/ads-admin-sponsored-ads.service';

function isAdActive(startAt: string, endAt: string, now = new Date()) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return now >= start && now <= end;
}

const QUICK_LINKS = [
  {
    to: '/ads-admin/ads',
    icon: 'bi-megaphone',
    title: 'Create ads',
    meta: 'Post banner or sponsored ads for your school feed',
  },
  {
    to: '/ads-admin/ads-analytics',
    icon: 'bi-bar-chart-line',
    title: 'Ads analytics',
    meta: 'Views, clicks, schedules, and performance by ad',
  },
] as const;

export const AdsAdminDashboard = () => {
  const { user } = useAdsAdminAuth();
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.ads } as CSSProperties;

  const { data: bannerAds = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['ads-admin', 'banner-ads', 'list'],
    queryFn: () => adsAdminBannerAdsService.list(),
  });

  const { data: sponsoredAds = [], isLoading: sponsoredLoading } = useQuery({
    queryKey: ['ads-admin', 'sponsored-ads', 'list'],
    queryFn: () => adsAdminSponsoredAdsService.list(),
  });

  const { activeBanners, activeSponsored } = useMemo(() => {
    const now = new Date();
    return {
      activeBanners: bannerAds.filter((a: { startAt: string; endAt: string }) =>
        isAdActive(a.startAt, a.endAt, now),
      ).length,
      activeSponsored: sponsoredAds.filter((a: { startAt: string; endAt: string }) =>
        isAdActive(a.startAt, a.endAt, now),
      ).length,
    };
  }, [bannerAds, sponsoredAds]);

  const totalAds = bannerAds.length + sponsoredAds.length;
  const activeTotal = activeBanners + activeSponsored;
  const listsLoading = bannersLoading || sponsoredLoading;

  return (
    <AdsAdminLayout>
      <div className="admin-category-dashboard">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Welcome back, {user?.name ?? 'Ads Admin'}</h1>
          <p className="admin-page-subtitle">
            Manage banner and sponsored ads for {user?.schoolName ?? 'your school'}. Track what is live and
            review performance in analytics.
          </p>
        </header>

        <div className="admin-analytics-stat-grid admin-category-dashboard__stats" style={panelStyle}>
          <div className="admin-analytics-stat admin-analytics-stat--scope">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Total ads</span>
              <i className="bi bi-collection admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{listsLoading ? '…' : totalAds}</p>
            <p className="admin-analytics-stat__hint">Banner + sponsored</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--likes">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Active now</span>
              <i className="bi bi-broadcast admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{listsLoading ? '…' : activeTotal}</p>
            <p className="admin-analytics-stat__hint">Showing in the feed</p>
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--comments">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Banner ads</span>
              <i className="bi bi-image admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{listsLoading ? '…' : bannerAds.length}</p>
            {activeBanners > 0 ? (
              <p className="admin-analytics-stat__hint">{activeBanners} active</p>
            ) : null}
          </div>
          <div className="admin-analytics-stat admin-analytics-stat--saved">
            <div className="admin-analytics-stat__top">
              <span className="admin-analytics-stat__label">Sponsored ads</span>
              <i className="bi bi-badge-ad admin-analytics-stat__icon" aria-hidden />
            </div>
            <p className="admin-analytics-stat__value">{listsLoading ? '…' : sponsoredAds.length}</p>
            {activeSponsored > 0 ? (
              <p className="admin-analytics-stat__hint">{activeSponsored} active</p>
            ) : null}
          </div>
        </div>

        <div className="admin-dashboard-columns">
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Your profile</h2>
              {user?.schoolName ? (
                <span className="admin-pill admin-pill--neutral">{user.schoolName}</span>
              ) : null}
            </div>
            <div className="admin-panel__body">
              <div className="admin-detail-grid">
                <div>
                  <span className="admin-detail-label">Name</span>
                  <p className="admin-detail-value mb-0">{user?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Email</span>
                  <p className="admin-detail-value mb-0">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">School</span>
                  <p className="admin-detail-value mb-0">{user?.schoolName ?? '—'}</p>
                </div>
                <div>
                  <span className="admin-detail-label">Role</span>
                  <p className="admin-detail-value mb-0">Ads Admin</p>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Quick links</h2>
            </div>
            <div className="admin-panel__body">
              <div className="admin-quick-links">
                {QUICK_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} className="admin-quick-link">
                    <span className="admin-quick-link__icon" aria-hidden>
                      <i className={`bi ${link.icon}`} />
                    </span>
                    <span className="admin-quick-link__body">
                      <p className="admin-quick-link__title">{link.title}</p>
                      <p className="admin-quick-link__meta">{link.meta}</p>
                    </span>
                    <i className="bi bi-chevron-right admin-quick-link__chevron" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdsAdminLayout>
  );
};
