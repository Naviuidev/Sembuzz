import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { SchoolAdminExternalAdminRequestsPanel } from '../components/SchoolAdminExternalAdminRequestsPanel';
import { SchoolAdminExternalPostRequestsPanel } from '../components/SchoolAdminExternalPostRequestsPanel';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { schoolAdminExternalPipelineService } from '../services/school-admin-external-pipeline.service';
import { schoolAdminExternalPostRequestsService } from '../services/school-admin-external-post-requests.service';

type ExternalConfigTab = 'admin-requests' | 'post-approval';

const TABS: { id: ExternalConfigTab; label: string }[] = [
  { id: 'admin-requests', label: 'Admin request' },
  { id: 'post-approval', label: 'Post approval' },
];

function parseTab(raw: string | null): ExternalConfigTab {
  if (raw === 'post-approval' || raw === 'post-requests') return 'post-approval';
  return 'admin-requests';
}

const TAB_SUBTITLES: Record<ExternalConfigTab, string> = {
  'admin-requests':
    'Review external admin pipeline access requests. Email is sent only when an external admin submits a new pipeline request.',
  'post-approval':
    'Review pending external jobs and posts, or browse approved items. Jobs and posts do not trigger email.',
};

type PostFilter = 'pending' | 'approved';

export const SchoolAdminExternalConfig = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams]);
  const conversationRequestId = searchParams.get('requestId');
  const postRequestId = searchParams.get('postRequestId');

  const { data: pipelinePending } = useQuery({
    queryKey: ['school-admin', 'external-pipeline', 'pending-count'],
    queryFn: schoolAdminExternalPipelineService.pendingCount,
  });

  const { data: postPending } = useQuery({
    queryKey: ['school-admin', 'external-post-requests', 'pending-count'],
    queryFn: schoolAdminExternalPostRequestsService.pendingCount,
  });

  const postFilter: PostFilter = searchParams.get('postFilter') === 'approved' ? 'approved' : 'pending';

  const setTab = (tab: ExternalConfigTab) => {
    if (tab === 'admin-requests') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: 'post-approval', postFilter: 'pending' });
    }
  };

  const setPostFilter = (filter: PostFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'post-approval');
    next.set('postFilter', filter);
    next.delete('postRequestId');
    setSearchParams(next);
  };

  const adminRequestsSubtitle = conversationRequestId
    ? 'View the full thread with the external admin and send replies below.'
    : TAB_SUBTITLES['admin-requests'];

  const postApprovalSubtitle = postRequestId
    ? 'View the full post and conversation with the external admin.'
    : TAB_SUBTITLES['post-approval'];

  const badgeCount = (tab: ExternalConfigTab) => {
    if (tab === 'admin-requests') return pipelinePending?.pending ?? 0;
    return postPending?.pending ?? 0;
  };

  const showPostSubBadges = activeTab === 'post-approval' && !postRequestId;

  const badgesNav = (
    <nav
      className="admin-dashboard-badges admin-dashboard-badges--row school-external-config-badges"
      aria-label="External config sections"
    >
      {TABS.map(({ id, label }) => {
        const count = badgeCount(id);
        return (
          <button
            key={id}
            type="button"
            className={`admin-dashboard-badge${activeTab === id ? ' is-active' : ''}`}
            aria-current={activeTab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
            {count > 0 ? <span className="admin-privacy-tabs__badge">{count}</span> : null}
          </button>
        );
      })}
      {showPostSubBadges ? (
        <>
          <span className="school-external-config-badges__divider" aria-hidden />
          <button
            type="button"
            className={`admin-dashboard-badge${postFilter === 'pending' ? ' is-active' : ''}`}
            onClick={() => setPostFilter('pending')}
          >
            Pending
            {(postPending?.pending ?? 0) > 0 ? (
              <span className="admin-privacy-tabs__badge">{postPending!.pending}</span>
            ) : null}
          </button>
          <button
            type="button"
            className={`admin-dashboard-badge${postFilter === 'approved' ? ' is-active' : ''}`}
            onClick={() => setPostFilter('approved')}
          >
            Approved
          </button>
        </>
      ) : null}
    </nav>
  );

  const inConversation =
    (activeTab === 'admin-requests' && conversationRequestId) ||
    (activeTab === 'post-approval' && postRequestId);

  return (
    <SchoolAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">External config</h1>
          <p className="admin-page-subtitle">
            {activeTab === 'admin-requests' ? adminRequestsSubtitle : postApprovalSubtitle}
          </p>
          {badgesNav}
        </header>

        <section
          className={`admin-panel${inConversation ? ' admin-panel--pipeline-conversation' : ''}`}
          style={panelStyle}
        >
          {!inConversation ? (
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">
                {activeTab === 'admin-requests'
                  ? 'Admin requests'
                  : postFilter === 'approved'
                    ? 'Approved posts'
                    : 'Pending posts'}
              </h2>
            </div>
          ) : null}
          <div className={inConversation ? 'admin-panel__body' : 'admin-panel__body admin-panel__body--flush-top'}>
            {activeTab === 'admin-requests' ? <SchoolAdminExternalAdminRequestsPanel /> : null}
            {activeTab === 'post-approval' ? <SchoolAdminExternalPostRequestsPanel /> : null}
          </div>
        </section>
      </div>
    </SchoolAdminLayout>
  );
};
