import { HomeUpcomingNewsShowcase } from './HomeUpcomingNewsShowcase';

const UPCOMING_WORKFLOW = [
  { icon: 'bi-pencil-square', label: 'School admin', desc: 'Drafts teaser post' },
  { icon: 'bi-calendar-plus', label: 'Show from', desc: 'Teaser appears in feed' },
  { icon: 'bi-calendar-check', label: 'Publish on', desc: 'Full post goes live' },
  { icon: 'bi-phone', label: 'Students', desc: 'See countdown in feed' },
];

const UPCOMING_CAPABILITIES = [
  'Schedule “coming soon” teasers before the full announcement goes live',
  'Set separate show-from and publish-on dates for each post',
  'Students see upcoming items in the feed with a clear coming-soon label',
  'Works alongside scheduled publishing in the category approval workflow',
];

export function HomeUpcomingNewsSection() {
  return (
    <section id="upcoming-news" className="home-upcoming-section">
      <div className="home-hero-bg" aria-hidden>
        <div className="home-hero-wave home-hero-wave-black" />
        <div className="home-hero-wave home-hero-wave-white" />
        <div className="home-hero-wave home-hero-wave-gray" />
      </div>

      <div className="container position-relative home-upcoming-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-6 home-upcoming-copy">
            <p className="home-upcoming-eyebrow mb-2">Upcoming News</p>
            <h2 className="home-upcoming-title">
              <span className="home-upcoming-title-line">Teaser posts before</span>
              <span className="home-upcoming-title-line">the full announcement</span>
            </h2>
            <p className="home-upcoming-subtitle">
              School admins can schedule upcoming news — a “coming soon” card appears in the
              student feed on the show-from date, then expands to the full post on publish day.
            </p>

            <div className="home-upcoming-workflow" aria-label="Upcoming news workflow">
              {UPCOMING_WORKFLOW.map((step, i) => (
                <div key={step.label} className="home-upcoming-workflow-item">
                  <div className="home-upcoming-workflow-step">
                    <i className={`bi ${step.icon}`} aria-hidden />
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                    </div>
                  </div>
                  {i < UPCOMING_WORKFLOW.length - 1 && (
                    <i className="bi bi-arrow-right home-upcoming-workflow-arrow" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <ul className="home-upcoming-list list-unstyled mb-0">
              {UPCOMING_CAPABILITIES.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-6">
            <HomeUpcomingNewsShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
