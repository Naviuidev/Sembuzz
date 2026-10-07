import { useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubCategoryAdminLayout } from '../components/SubCategoryAdminLayout';
import { SubCategoryAdminExternalCategoryApprovalPanel } from '../components/SubCategoryAdminExternalCategoryApprovalPanel';
import { SubCategoryAdminExternalApprovedPostsPanel } from '../components/SubCategoryAdminExternalApprovedPostsPanel';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { subcategoryAdminExternalConfigService } from '../services/subcategory-admin-external-config.service';

type Tab = 'category-approval' | 'approved-posts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'category-approval', label: 'Category name approval' },
  { id: 'approved-posts', label: 'Approved categories post' },
];

function parseTab(raw: string | null): Tab {
  return raw === 'approved-posts' ? 'approved-posts' : 'category-approval';
}

export const SubCategoryAdminExternalConfig = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.subcategory } as CSSProperties;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams]);
  const inView = Boolean(searchParams.get('linkId') || searchParams.get('postId'));

  const { data: linkPending } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'link-pending'],
    queryFn: subcategoryAdminExternalConfigService.linkPendingCount,
  });
  const { data: postPending } = useQuery({
    queryKey: ['subcategory-admin', 'external-config', 'post-pending'],
    queryFn: subcategoryAdminExternalConfigService.postPendingCount,
  });

  const setTab = (next: Tab) => {
    setSearchParams(next === 'category-approval' ? {} : { tab: next });
  };

  const badges = (
    <nav className="admin-dashboard-badges" aria-label="External config">
      {TABS.map(({ id, label }) => {
        const count = id === 'category-approval' ? linkPending?.pending ?? 0 : postPending?.pending ?? 0;
        return (
          <button
            key={id}
            type="button"
            className={`admin-dashboard-badge${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
            {count > 0 ? <span className="admin-privacy-tabs__badge">{count}</span> : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <SubCategoryAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">External config</h1>
          <p className="admin-page-subtitle">
            Approve external category names for your subcategories and review school-approved external event posts (not jobs).
          </p>
          {badges}
        </header>
        <section className={`admin-panel${inView ? ' admin-panel--pipeline-conversation' : ''}`} style={panelStyle}>
          {!inView ? (
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">{tab === 'category-approval' ? 'Category name approval' : 'Approved categories post'}</h2>
            </div>
          ) : null}
          <div className={inView ? 'admin-panel__body' : 'admin-panel__body admin-panel__body--flush-top'}>
            {tab === 'category-approval' ? <SubCategoryAdminExternalCategoryApprovalPanel /> : <SubCategoryAdminExternalApprovedPostsPanel />}
          </div>
        </section>
      </div>
    </SubCategoryAdminLayout>
  );
};
