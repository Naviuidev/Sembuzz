import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { SubCategoryAdminCreatePost, type SubCategoryAdminResubmitEvent } from './SubCategoryAdminCreatePost';
import { SubCategoryAdminApprovalsPendingPanel } from '../components/SubCategoryAdminApprovalsPendingPanel';
import { SubCategoryAdminApprovedPanel } from '../components/SubCategoryAdminApprovedPanel';
import { SubCategoryAdminReceivedCorrectionsPanel } from '../components/SubCategoryAdminReceivedCorrectionsPanel';
import type { RevertedEvent } from '../services/subcategory-admin-events.service';

type PostsTab = 'create' | 'corrections' | 'pending' | 'approved';

const POST_TABS: { id: PostsTab; label: string }[] = [
  { id: 'create', label: 'Create post' },
  { id: 'corrections', label: 'Received corrections' },
  { id: 'pending', label: 'Approvals pending' },
  { id: 'approved', label: 'Approved list' },
];

function parsePostsTab(raw: string | null): PostsTab {
  if (raw === 'corrections' || raw === 'received-corrections') return 'corrections';
  if (raw === 'pending' || raw === 'approvals-pending') return 'pending';
  if (raw === 'approved') return 'approved';
  return 'create';
}

const TAB_SUBTITLES: Record<PostsTab, string> = {
  create: 'Create an event post and submit it for category admin approval.',
  corrections: 'Feedback from your category admin. Revise and resubmit for approval.',
  pending: 'Posts waiting for category admin approval.',
  approved: 'Posts approved by the category admin and live for your school.',
};

function toResubmitEvent(event: RevertedEvent): SubCategoryAdminResubmitEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    externalLink: event.externalLink,
    eventDate: event.eventDate,
    eventStartTime: event.eventStartTime,
    eventEndTime: event.eventEndTime,
    eventLocation: event.eventLocation,
    actionButtons: event.actionButtons,
    commentsEnabled: event.commentsEnabled,
    subCategory: event.subCategory,
  };
}

export const SubCategoryAdminPosts = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parsePostsTab(searchParams.get('tab')), [searchParams]);
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;

  const [resubmitEvent, setResubmitEvent] = useState<SubCategoryAdminResubmitEvent | null>(null);
  const hasAppliedNavResubmit = useRef(false);

  useEffect(() => {
    const fromState = (location.state as { resubmitEvent?: SubCategoryAdminResubmitEvent })?.resubmitEvent;
    if (fromState && !hasAppliedNavResubmit.current) {
      hasAppliedNavResubmit.current = true;
      setResubmitEvent(fromState);
      setSearchParams({ tab: 'create' }, { replace: true });
    }
  }, [location.state, setSearchParams]);

  const setTab = (tab: PostsTab) => {
    if (tab === 'create') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const handleMakeCorrections = useCallback((event: RevertedEvent) => {
    setResubmitEvent(toResubmitEvent(event));
    setSearchParams({});
  }, [setSearchParams]);

  const handleSubmitted = useCallback(() => {
    setResubmitEvent(null);
    setSearchParams({ tab: 'pending' });
  }, [setSearchParams]);

  const badgesNav = (
    <nav className="admin-dashboard-badges" aria-label="Post sections">
      {POST_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`admin-dashboard-badge${activeTab === id ? ' is-active' : ''}`}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => setTab(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );

  const postsHubHeader = (
    <header className="admin-page-header admin-page-header--in-grid mb-0" style={panelStyle}>
      <h1 className="admin-page-title">Posts</h1>
      <p className="admin-page-subtitle">{TAB_SUBTITLES.create}</p>
      {badgesNav}
    </header>
  );

  return (
    <SubCategoryAdminLayout>
      <div className={`admin-posts-page${activeTab === 'create' ? ' admin-posts-page--create' : ''}`}>
        {activeTab === 'create' ? (
          <SubCategoryAdminCreatePost
            embedded
            hubHeader={postsHubHeader}
            resubmitEvent={resubmitEvent}
            onSubmitted={handleSubmitted}
          />
        ) : (
          <>
            <header className="admin-page-header" style={panelStyle}>
              <h1 className="admin-page-title">Posts</h1>
              <p className="admin-page-subtitle">{TAB_SUBTITLES[activeTab]}</p>
              {badgesNav}
            </header>
            <section className="admin-panel" style={panelStyle}>
              <div className="admin-panel__body admin-panel__body--flush-top">
                {activeTab === 'corrections' ? (
                  <SubCategoryAdminReceivedCorrectionsPanel onMakeCorrections={handleMakeCorrections} />
                ) : null}
                {activeTab === 'pending' ? <SubCategoryAdminApprovalsPendingPanel /> : null}
                {activeTab === 'approved' ? <SubCategoryAdminApprovedPanel /> : null}
              </div>
            </section>
          </>
        )}
      </div>
    </SubCategoryAdminLayout>
  );
};
