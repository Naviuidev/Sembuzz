import { useState } from 'react';
import { HomeAnalyticsShowcase } from './HomeAnalyticsShowcase';

type AnalyticsTabId = 'engagement' | 'ads';

const ANALYTICS_TABS: {
  id: AnalyticsTabId;
  label: string;
  desc: string;
  icon: string;
  title: string;
  intro: string;
  capabilities: string[];
  portals: string[];
}[] = [
  {
    id: 'engagement',
    label: 'News engagement',
    desc: 'Likes, comments & saves',
    icon: 'bi-bar-chart-line',
    title: 'See what students engage with',
    intro:
      'Track likes, comments, and saves across campus news — filtered by category, subcategory, or individual post. School, category, and subcategory admins each get a scoped dashboard.',
    capabilities: [
      'Summary cards for posts in scope, likes, comments, and saves',
      'Filter by category, subcategory, post, and 7/30/90-day ranges',
      'Line, bar, and donut chart views for engagement breakdown',
      'News performance table ranking your top campus content',
    ],
    portals: ['School Admin', 'Category Admin', 'Subcategory Admin'],
  },
  {
    id: 'ads',
    label: 'Ads performance',
    desc: 'Views & clicks over time',
    icon: 'bi-graph-up-arrow',
    title: 'Measure ad campaigns in the feed',
    intro:
      'Banner and sponsored ads report views and clicks as students scroll — with daily trend charts, per-campaign breakdowns, and date-range filters in the Ads Admin portal.',
    capabilities: [
      'Total views and clicks with click-through rate at a glance',
      'Daily line charts showing campaign momentum over time',
      'Separate analytics for banner ads and sponsored posts',
      'Filter by ad, date range, and export-ready performance tables',
    ],
    portals: ['Ads Admin', 'Category Admin'],
  },
];

const ANALYTICS_HIGHLIGHTS = [
  'Student likes, saves, comments, and ad interactions feed admin dashboards',
  'Role-based scope — each admin sees metrics for their campus level',
  'Date-range filters from 7 to 90 days or custom ranges',
  'Turn engagement data into better campus communication decisions',
];

export function HomeAnalyticsSection() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('engagement');
  const active = ANALYTICS_TABS.find((tab) => tab.id === activeTab) ?? ANALYTICS_TABS[0];

  return (
    <section id="analytics" className="home-analytics-section">
      <div className="home-hero-bg" aria-hidden>
        <div className="home-hero-wave home-hero-wave-black" />
        <div className="home-hero-wave home-hero-wave-white" />
        <div className="home-hero-wave home-hero-wave-gray" />
      </div>

      <div className="container position-relative home-analytics-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-5 home-analytics-copy">
            <p className="home-analytics-eyebrow mb-2">Analytics &amp; Insights</p>
            <h2 className="home-analytics-title">
              <span className="home-analytics-title-line">Real engagement insights</span>
              <span className="home-analytics-title-line">for every campus role</span>
            </h2>
            <p className="home-analytics-subtitle">
              SemBuzz turns student interactions into actionable dashboards — from news
              engagement to ad performance — so institutions know what resonates.
            </p>

            <div className="home-analytics-tabs" role="tablist" aria-label="Analytics types">
              {ANALYTICS_TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`home-analytics-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls="home-analytics-panel"
                    className={`home-analytics-tab${isActive ? ' home-analytics-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`bi ${tab.icon}`} aria-hidden />
                    <div>
                      <strong>{tab.label}</strong>
                      <span>{tab.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              id="home-analytics-panel"
              role="tabpanel"
              aria-labelledby={`home-analytics-tab-${active.id}`}
              className="home-analytics-panel-copy"
            >
              <h3 className="home-analytics-panel-title">{active.title}</h3>
              <p className="home-analytics-panel-intro">{active.intro}</p>
              <ul className="home-analytics-panel-list list-unstyled mb-3">
                {active.capabilities.map((item) => (
                  <li key={item}>
                    <i className="bi bi-check2" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="home-analytics-portals mb-3">
                {active.portals.map((portal) => (
                  <span key={portal} className="home-analytics-portal-tag">
                    {portal}
                  </span>
                ))}
              </div>
              <ul className="home-analytics-highlights list-unstyled mb-0">
                {ANALYTICS_HIGHLIGHTS.map((item) => (
                  <li key={item}>
                    <i className="bi bi-check2" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-lg-7">
            <HomeAnalyticsShowcase variant={active.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
