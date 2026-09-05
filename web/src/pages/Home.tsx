import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { SiteFooter } from '../components/SiteFooter';
import { HomeHeroShowcase } from '../components/HomeHeroShowcase';
import { AdminPortalTabs } from '../components/AdminPortalTabs';
import { HomeBlogsSection } from '../components/HomeBlogsSection';
import { HomeSocialAppsSection } from '../components/HomeSocialAppsSection';
import { HomeMessagingSection } from '../components/HomeMessagingSection';
import { HomeVerificationSection } from '../components/HomeVerificationSection';
import { HomeStudentExperienceSection } from '../components/HomeStudentExperienceSection';
import { HomeUpcomingNewsSection } from '../components/HomeUpcomingNewsSection';
import { HomeClubsSection } from '../components/HomeClubsSection';
import { HomeAdsSection } from '../components/HomeAdsSection';
import { HomeAnalyticsSection } from '../components/HomeAnalyticsSection';
import { HomeFaqSection } from '../components/HomeFaqSection';
import { HomeGuidelinesSection } from '../components/HomeGuidelinesSection';
import { HomeContactSection } from '../components/HomeContactSection';
import { HomeScrollAssist } from '../components/HomeScrollAssist';

const HERO_FEATURES = [
  { icon: 'bi-phone', text: 'One app' },
  { icon: 'bi-building', text: 'Multiple schools' },
  { icon: 'bi-shield-check', text: 'Verified campus access' },
  { icon: 'bi-graph-up-arrow', text: 'Real engagement insights' },
];

/**
 * Home page — hero, feature showcases, FAQ, guidelines, contact, footer.
 */
export const Home = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen home-page-bg">
      <Navbar />
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden>
          <div className="home-hero-wave home-hero-wave-black" />
          <div className="home-hero-wave home-hero-wave-white" />
          <div className="home-hero-wave home-hero-wave-gray" />
        </div>

        <div className="container position-relative home-hero-container">
          <div className="row align-items-center g-4 g-xl-5">
            <div className="col-lg-6 home-hero-copy">
              <h1 className="home-hero-title">
                <span className="home-hero-title-line">Stay connected with your campus.</span>
                <span className="home-hero-title-line">Everything you need, in one place.</span>
              </h1>
              <p className="home-hero-subtitle">
                SemBuzz centralizes campus announcements, events, research opportunities,
                internships, student organization updates, and important deadlines into one
                clean, scrollable feed built for students and designed for institutions.
              </p>

              <ul className="home-hero-features list-unstyled mb-4">
                {HERO_FEATURES.map(({ icon, text }) => (
                  <li key={text}>
                    <i className={`bi ${icon}`} aria-hidden />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="home-hero-cta-wrap">
                <div className="home-hero-cta-row">
                  <a
                    href="https://apps.apple.com/in/app/sembuzz-a4eec2/id6761261221"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark rounded-pill home-hero-cta-primary text-decoration-none d-inline-flex align-items-center gap-2"
                  >
                    <span aria-hidden style={{ fontSize: '1.15rem' }}>
                      &#63743;
                    </span>
                    Download the App
                  </a>
                  <Link to="/contact" className="home-hero-cta-secondary text-decoration-none">
                    Request a University Demo
                  </Link>
                </div>
                <p className="home-hero-cta-note mb-0">
                  <span className="home-hero-cta-arrow" aria-hidden>
                    ↗
                  </span>
                  Free for students · Verified campus access
                </p>
              </div>
            </div>

            <div className="col-lg-6">
              <HomeHeroShowcase />
            </div>
          </div>
        </div>
      </section>

      <HomeScrollAssist />

      <section id="admin-portals" className="admin-portals-section">
        <div className="container py-4 py-lg-5">
          <div className="admin-portals-header text-center mx-auto">
            <p className="admin-portals-eyebrow mb-2">Admin Portals</p>
            <h2 className="admin-portals-title">
              Role-based portals for every level of campus communication
            </h2>
            <p className="admin-portals-intro mb-0">
              SemBuzz separates responsibilities across dedicated web portals — from
              institution-wide setup to department-level content creation — so the right
              people control the right workflows.
            </p>
          </div>

          <AdminPortalTabs />

          <p className="admin-portals-footer text-center mb-0">
            Only verified admins may share content. Students browse; admins publish.
          </p>
        </div>
      </section>

      <HomeBlogsSection />
      <HomeSocialAppsSection />
      <HomeMessagingSection />
      <HomeVerificationSection />
      <HomeStudentExperienceSection />
      <HomeUpcomingNewsSection />
      <HomeClubsSection />
      <HomeAdsSection />
      <HomeAnalyticsSection />
      <HomeFaqSection />
      <HomeGuidelinesSection />
      <HomeContactSection />

      <SiteFooter />
    </div>
  );
};
