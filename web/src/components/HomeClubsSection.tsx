import { HomeClubsShowcase } from './HomeClubsShowcase';

const CLUB_PILLARS = [
  {
    icon: 'bi-people-fill',
    title: 'Official club profiles',
    text: 'School admins create clubs with name, icon, and description under Social Share.',
  },
  {
    icon: 'bi-link-45deg',
    title: 'Social links attached',
    text: 'Each club links to Instagram, LinkedIn, YouTube, or a website — surfaced in the Apps tab.',
  },
  {
    icon: 'bi-chat-square-heart',
    title: 'Optional club chat',
    text: 'Clubs can enable a moderated group chat — see Messaging for how club chats work.',
  },
];

const CLUB_WORKFLOW = [
  { icon: 'bi-building', label: 'School admin', desc: 'Creates official club' },
  { icon: 'bi-grid-3x3-gap', label: 'Apps tab', desc: 'Students discover clubs' },
  { icon: 'bi-box-arrow-up-right', label: 'Social links', desc: 'Follow external channels' },
  { icon: 'bi-chat-dots', label: 'Club chat', desc: 'Optional group messaging' },
];

const CLUB_HIGHLIGHTS = [
  'Only school-approved clubs appear — no unverified student listings',
  'Club pages live in the mobile Apps tab and connect to Social Share',
  'Admins control which clubs exist and who can join club chats',
  'Pairs with the Social Share section for the full student discovery flow',
];

export function HomeClubsSection() {
  return (
    <section id="clubs-and-chats" className="home-clubs-section">
      <div className="home-hero-bg" aria-hidden>
        <div className="home-hero-wave home-hero-wave-black" />
        <div className="home-hero-wave home-hero-wave-white" />
        <div className="home-hero-wave home-hero-wave-gray" />
      </div>

      <div className="container position-relative home-clubs-container">
        <div className="row align-items-center g-4 g-xl-5">
          <div className="col-lg-6 home-clubs-copy">
            <p className="home-clubs-eyebrow mb-2">Official Campus Clubs</p>
            <h2 className="home-clubs-title">
              <span className="home-clubs-title-line">School-approved clubs</span>
              <span className="home-clubs-title-line">with social links and optional chats</span>
            </h2>
            <p className="home-clubs-subtitle">
              SemBuzz gives every official organization a home — created by school admins,
              discovered by students in the Apps tab, and optionally connected to a moderated
              club chat.
            </p>

            <div className="home-clubs-workflow" aria-label="Club setup workflow">
              {CLUB_WORKFLOW.map((step, i) => (
                <div key={step.label} className="home-clubs-workflow-item">
                  <div className="home-clubs-workflow-step">
                    <i className={`bi ${step.icon}`} aria-hidden />
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                    </div>
                  </div>
                  {i < CLUB_WORKFLOW.length - 1 && (
                    <i className="bi bi-arrow-right home-clubs-workflow-arrow" aria-hidden />
                  )}
                </div>
              ))}
            </div>

            <div className="home-clubs-pillars">
              {CLUB_PILLARS.map((pillar) => (
                <article key={pillar.title} className="home-clubs-pillar">
                  <div className="home-clubs-pillar-icon">
                    <i className={`bi ${pillar.icon}`} aria-hidden />
                  </div>
                  <div>
                    <h3 className="home-clubs-pillar-title">{pillar.title}</h3>
                    <p className="home-clubs-pillar-text mb-0">{pillar.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <ul className="home-clubs-highlights list-unstyled mb-0">
              {CLUB_HIGHLIGHTS.map((item) => (
                <li key={item}>
                  <i className="bi bi-check2" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-6">
            <HomeClubsShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
