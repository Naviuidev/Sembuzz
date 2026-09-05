import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HomeStudentExperienceShowcase } from './HomeStudentExperienceShowcase';

type ExperienceTabId = 'feed' | 'engage' | 'notify';

const EXPERIENCE_TABS: {
  id: ExperienceTabId;
  label: string;
  desc: string;
  icon: string;
  title: string;
  intro: string;
  capabilities: string[];
}[] = [
  {
    id: 'feed',
    label: 'Browse & search',
    desc: 'Web + mobile feed',
    icon: 'bi-search',
    title: 'One feed on web and mobile — filter by school and category',
    intro:
      'Students scroll an Inshorts-style campus feed on the mobile app and at /events on web — with category filters, search, and cross-school browsing when enabled.',
    capabilities: [
      'Swipe or scroll through events, internships, and campus news',
      'Search across posts and filter by category or subcategory',
      'Browse your school or explore content from other campuses',
      'Same verified session on iOS, Android, and the web app',
    ],
  },
  {
    id: 'engage',
    label: 'Save & interact',
    desc: 'Likes, comments, saves',
    icon: 'bi-heart',
    title: 'Like, comment, and save what matters',
    intro:
      'Every feed card supports student engagement — tap to like, leave comments, or save posts to your personal library for deadlines and opportunities.',
    capabilities: [
      'Like posts to show interest and boost engagement signals',
      'Comment threads on news and events for campus discussion',
      'Saved and Liked libraries — revisit opportunities anytime',
      'Engagement feeds back into admin analytics dashboards',
    ],
  },
  {
    id: 'notify',
    label: 'Notifications',
    desc: 'Push + in-app inbox',
    icon: 'bi-bell',
    title: 'Push alerts and an in-app notification inbox',
    intro:
      'Students stay on top of campus life with push notifications for important updates plus an in-app inbox — including chat messages, join requests, and subcategory preferences.',
    capabilities: [
      'Push notifications via FCM for time-sensitive campus updates',
      'In-app notification center with read/unread state',
      'Subcategory notification preferences per student',
      'Alerts for chat messages, approvals, and feed highlights',
    ],
  },
];

export function HomeStudentExperienceSection() {
  const [activeTab, setActiveTab] = useState<ExperienceTabId>('feed');
  const active = EXPERIENCE_TABS.find((tab) => tab.id === activeTab) ?? EXPERIENCE_TABS[0];

  return (
    <section id="student-experience" className="home-student-section">
      <div className="container py-4 py-lg-5">
        <div className="home-student-header text-center mx-auto">
          <p className="home-student-eyebrow mb-2">Student Experience</p>
          <h2 className="home-student-title">Web and mobile — search, save, like, comment, and stay notified</h2>
          <p className="home-student-intro mb-0">
            SemBuzz meets students where they are — the same campus feed and libraries on phone
            and browser, with engagement tools built in.
          </p>
        </div>

        <div className="home-student-tabs-wrap">
          <div className="home-student-tabs" role="tablist" aria-label="Student experience features">
            {EXPERIENCE_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`home-student-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="home-student-panel"
                  className={`home-student-tab${isActive ? ' home-student-tab-active' : ''}`}
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
            id="home-student-panel"
            role="tabpanel"
            aria-labelledby={`home-student-tab-${active.id}`}
            className="home-student-panel"
          >
            <div className="row g-4 g-lg-5 align-items-center">
              <div className="col-lg-5 order-2 order-lg-1">
                <h3 className="home-student-panel-title">{active.title}</h3>
                <p className="home-student-panel-intro">{active.intro}</p>
                <ul className="home-student-panel-list list-unstyled mb-4">
                  {active.capabilities.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check2" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="home-student-ctas">
                  <Link to="/events" className="home-student-cta">
                    Open web feed
                    <i className="bi bi-arrow-up-right" aria-hidden />
                  </Link>
                  <a
                    href="https://apps.apple.com/in/app/sembuzz-a4eec2/id6761261221"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-student-cta home-student-cta-secondary"
                  >
                    Download app
                    <i className="bi bi-phone" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="col-lg-7 order-1 order-lg-2">
                <HomeStudentExperienceShowcase variant={active.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
