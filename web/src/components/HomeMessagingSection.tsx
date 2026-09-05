import { useState } from 'react';
import { HomeMessagingShowcase } from './HomeMessagingShowcase';

type MessagingTabId = 'direct' | 'group' | 'club';

const MESSAGING_TABS: {
  id: MessagingTabId;
  label: string;
  desc: string;
  icon: string;
  title: string;
  intro: string;
  capabilities: string[];
}[] = [
  {
    id: 'direct',
    label: 'Direct messages',
    desc: '1:1 private chat',
    icon: 'bi-chat-left-dots',
    title: 'Private conversations between verified students',
    intro:
      'When individual messaging is enabled for your school, students can start direct chats with classmates — separate from group and club channels.',
    capabilities: [
      'One-to-one inbox on web and mobile',
      'Text messages with attachments and replies',
      'Available only when Individual Messaging is enabled for the school',
      'Moderation tools for school admins when needed',
    ],
  },
  {
    id: 'group',
    label: 'Student groups',
    desc: 'Public or private',
    icon: 'bi-people',
    title: 'Student chat groups beyond clubs',
    intro:
      'Subcategory admins can request public or private student chat groups — for study circles, project teams, or interest groups that are not tied to an official club.',
    capabilities: [
      'Requested by subcategory admins, approved by category or school admins',
      'Public groups open to join; private groups require admin approval',
      'Admin-only or open member posting per group settings',
      'Distinct from club chats — no Social Share listing required',
    ],
  },
  {
    id: 'club',
    label: 'Club chats',
    desc: 'Per official club',
    icon: 'bi-shield-check',
    title: 'Moderated chats tied to official clubs',
    intro:
      'Each official club can have its own group chat where verified students join after admin approval — keeping organization conversations in one place.',
    capabilities: [
      'Linked to clubs created under Social Share by school admins',
      'Join requests reviewed by club or school admins',
      'Ban and membership controls per club chat',
      'Push and in-app alerts for new messages and join requests',
    ],
  },
];

const MESSAGING_HIGHLIGHTS = [
  'Three chat types — direct, student group, and club — each with clear access rules',
  'Feature-gated by school: Group Messaging and Individual Messaging toggled per campus',
  'Unified inbox on web and mobile with attachments and threaded replies',
  'Admins approve groups, club join requests, and moderate membership',
];

export function HomeMessagingSection() {
  const [activeTab, setActiveTab] = useState<MessagingTabId>('direct');
  const active = MESSAGING_TABS.find((tab) => tab.id === activeTab) ?? MESSAGING_TABS[0];

  return (
    <section id="messaging" className="home-messaging-section">
      <div className="container py-4 py-lg-5">
        <div className="home-messaging-header text-center mx-auto">
          <p className="home-messaging-eyebrow mb-2">Campus Messaging</p>
          <h2 className="home-messaging-title">
            Direct messages, student groups, and club chats — clearly separated
          </h2>
          <p className="home-messaging-intro mb-0">
            SemBuzz supports three messaging modes so students connect the right way — with
            admin-controlled access at every level.
          </p>
        </div>

        <div className="home-messaging-tabs-wrap">
          <div className="home-messaging-tabs" role="tablist" aria-label="Messaging types">
            {MESSAGING_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`home-messaging-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls="home-messaging-panel"
                  className={`home-messaging-tab${isActive ? ' home-messaging-tab-active' : ''}`}
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
            id="home-messaging-panel"
            role="tabpanel"
            aria-labelledby={`home-messaging-tab-${active.id}`}
            className="home-messaging-panel"
          >
            <div className="row g-4 g-lg-5 align-items-center">
              <div className="col-lg-6 order-2 order-lg-1">
                <h3 className="home-messaging-panel-title">{active.title}</h3>
                <p className="home-messaging-panel-intro">{active.intro}</p>
                <ul className="home-messaging-panel-list list-unstyled mb-4">
                  {active.capabilities.map((item) => (
                    <li key={item}>
                      <i className="bi bi-check2" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="home-messaging-highlights list-unstyled mb-0">
                  {MESSAGING_HIGHLIGHTS.map((item) => (
                    <li key={item}>
                      <i className="bi bi-dot" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-lg-6 order-1 order-lg-2">
                <HomeMessagingShowcase variant={active.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
