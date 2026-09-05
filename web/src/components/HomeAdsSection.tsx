import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeAdsShowcase } from './HomeAdsShowcase';

type AdFormatId = 'sponsored' | 'banner';

const AD_FORMAT_TABS: {
  id: AdFormatId;
  label: string;
  desc: string;
  icon: string;
  title: string;
  intro: string;
  capabilities: string[];
}[] = [
  {
    id: 'sponsored',
    label: 'Sponsored Posts',
    desc: 'Full feed cards',
    icon: 'bi-newspaper',
    title: 'Sponsored posts in the scroll feed',
    intro:
      'Story-driven ads that appear as dedicated feed slides between campus news — with a light-blue background, “Ad” badge, and “Sponsored” label so students always know what they are viewing.',
    capabilities: [
      'Optional title, description, and up to four images',
      'Interleaved naturally every few news posts on web and mobile',
      'Tap-through to an external link with views and clicks tracked',
      'Scheduled start and end times — campaigns go live automatically',
    ],
  },
  {
    id: 'banner',
    label: 'Banner Ads',
    desc: 'Inline on news cards',
    icon: 'bi-image',
    title: 'Banner ads beneath campus news',
    intro:
      'Compact image banners that sit inline at the bottom of news cards in the student feed — ideal for promotions, local offers, and quick calls-to-action without interrupting the scroll.',
    capabilities: [
      'Single-image banner with “Ad Banner” disclosure tag',
      'Appears inline on news cards as students swipe the feed',
      'Click opens your landing page; performance tracked in admin analytics',
      'Schedule campaigns by date and time for each school',
    ],
  },
];

const AD_HIGHLIGHTS = [
  'Delivered only to verified students browsing their school feed',
  'Managed via Ads Admin or Category Admin portals',
  'Clearly labeled — sponsored content does not imply university endorsement',
  'Views, clicks, and daily performance charts in the admin dashboard',
];

export function HomeAdsSection() {
  const [activeFormat, setActiveFormat] = useState<AdFormatId>('sponsored');
  const active = AD_FORMAT_TABS.find((tab) => tab.id === activeFormat) ?? AD_FORMAT_TABS[0];

  return (
    <section id="campus-ads" className="home-ads-section">
      <div className="container py-4 py-lg-5">
        <div className="home-ads-header text-center mx-auto">
          <p className="home-ads-eyebrow mb-2">Campus Advertising</p>
          <h2 className="home-ads-title">Ads &amp; banner ads in the student feed</h2>
          <p className="home-ads-intro mb-0">
            Reach students inside their daily campus scroll with native ad formats — clearly
            labeled, scheduled, and measurable on web and mobile.
          </p>
        </div>

        <div className="home-ads-tabs-wrap">
          <div className="home-ads-tabs" role="tablist" aria-label="Ad formats in the feed">
            {AD_FORMAT_TABS.map((tab) => {
              const isActive = tab.id === activeFormat;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`home-ads-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="home-ads-panel"
                  className={`home-ads-tab${isActive ? ' home-ads-tab-active' : ''}`}
                  onClick={() => setActiveFormat(tab.id)}
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
            id="home-ads-panel"
            role="tabpanel"
            aria-labelledby={`home-ads-tab-${active.id}`}
            className="home-ads-panel"
          >
            <div className="row g-4 g-lg-5 align-items-center">
              <div className="col-lg-6 order-2 order-lg-1">
                <h3 className="home-ads-panel-title">{active.title}</h3>
                <p className="home-ads-panel-intro">{active.intro}</p>
                <ul className="home-ads-panel-list list-unstyled mb-4">
                  {active.capabilities.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check2" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="home-ads-highlights list-unstyled mb-4">
                  {AD_HIGHLIGHTS.map((item) => (
                    <li key={item}>
                      <i className="bi bi-dot" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/ads-admin/login" className="home-ads-panel-cta">
                  Log in to Ads Admin
                  <i className="bi bi-arrow-up-right" aria-hidden />
                </Link>
              </div>

              <div className="col-lg-6 order-1 order-lg-2">
                <HomeAdsShowcase variant={active.id} />
              </div>
            </div>
          </div>
        </div>

        <p className="home-ads-footer text-center mb-0">
          Ads must be clearly labeled and relevant to students. Available when the Ads feature
          is enabled for your school.
        </p>
      </div>
    </section>
  );
}
