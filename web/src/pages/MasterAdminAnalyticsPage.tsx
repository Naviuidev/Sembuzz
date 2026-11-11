import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  MasterAdminAnalyticsScopeBreadcrumb,
  MasterAdminAnalyticsScopePicker,
  type MasterAdminAnalyticsScope,
} from '../components/masterAdmin/MasterAdminAnalyticsScopePicker';
import {
  AdminEngagementAnalyticsPanel,
  type EngagementAnalyticsPost,
} from '../components/admin/AdminEngagementAnalyticsPanel';
import { masterAdminPostsService } from '../services/master-admin-posts.service';
import { resolveEngagementComparisonLevel } from '../utils/engagementComparison';

const PUBLISHED_STATUSES = new Set(['published', 'approved']);

function buildScopeLabel(scope: MasterAdminAnalyticsScope): string {
  if (scope.postTitle) return scope.postTitle;
  if (scope.subCategoryName && scope.categoryName) {
    return `${scope.categoryName} › ${scope.subCategoryName}`;
  }
  if (scope.categoryName) return scope.categoryName;
  return `${scope.schoolName} (all published news)`;
}

export function MasterAdminAnalyticsPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [scope, setScope] = useState<MasterAdminAnalyticsScope | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['master-admin', 'analytics-posts', scope?.schoolId],
    queryFn: () => masterAdminPostsService.list(scope!.schoolId),
    enabled: Boolean(scope?.schoolId),
  });

  const postsToShow = useMemo((): EngagementAnalyticsPost[] => {
    if (!scope) return [];
    return posts
      .filter((p) => PUBLISHED_STATUSES.has(p.status))
      .filter((p) => (scope.categoryId ? p.subCategory.category.id === scope.categoryId : true))
      .filter((p) => (scope.subCategoryId ? p.subCategory.id === scope.subCategoryId : true))
      .filter((p) => (scope.postId ? p.id === scope.postId : true))
      .map((p) => ({
        id: p.id,
        title: p.title,
        imageUrls: p.imageUrls ?? null,
        subCategory: {
          id: p.subCategory.id,
          name: p.subCategory.name,
          category: { id: p.subCategory.category.id, name: p.subCategory.category.name },
        },
      }));
  }, [posts, scope]);

  const comparisonLevel = scope ? resolveEngagementComparisonLevel(scope) : undefined;

  const handleProcess = (next: MasterAdminAnalyticsScope) => {
    setScope(next);
  };

  useEffect(() => {
    if (!scope) return;
    const scrollToResults = () => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    requestAnimationFrame(scrollToResults);
    const t = window.setTimeout(scrollToResults, 150);
    return () => window.clearTimeout(t);
  }, [scope]);

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-subtitle mb-0">
            Choose scope below and press Process. Results appear on this page — you can adjust filters and Process again.
          </p>
        </header>

        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
            <MasterAdminAnalyticsScopePicker initial={scope ?? undefined} onSubmit={handleProcess} />
          </div>
        </section>

        {scope ? (
          <div
            id="master-admin-analytics-results"
            ref={resultsRef}
            className="master-admin-analytics-results"
          >
            <section className="admin-panel mt-0" style={panelStyle}>
              <div className="admin-panel__body py-3">
                <MasterAdminAnalyticsScopeBreadcrumb scope={scope} />
              </div>
            </section>

            {postsLoading ? (
              <p className="master-admin-detail-muted px-1">Loading posts…</p>
            ) : (
              <AdminEngagementAnalyticsPanel
                panelStyle={panelStyle}
                scopeLabel={buildScopeLabel(scope)}
                postsToShow={postsToShow}
                queryKeyPrefix="master-admin"
                lineGradientId="masterAnalyticsLineGrad"
                showPageHeader={false}
                defaultDateRangePreset="all"
                comparisonLevel={comparisonLevel}
              />
            )}
          </div>
        ) : null}
      </div>
    </MasterAdminLayout>
  );
}
