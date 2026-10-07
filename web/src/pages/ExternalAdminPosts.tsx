import { useEffect, useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalAdminLayout } from '../components/ExternalAdminLayout';
import { ExternalAdminCreateJobPanel } from '../components/ExternalAdminCreateJobPanel';
import { ExternalAdminCreateCampaignPanel } from '../components/ExternalAdminCreateCampaignPanel';
import { ExternalAdminCreateOfferPanel } from '../components/ExternalAdminCreateOfferPanel';
import { ExternalAdminCreatePostPanel } from '../components/ExternalAdminCreatePostPanel';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { isExternalJobShareCategory } from '../constants/externalJobOptions';
import { isExternalCampaignCategory } from '../constants/externalCampaignOptions';
import { isExternalOffersCategory } from '../constants/externalOfferOptions';
import { externalAdminPipelineService } from '../services/external-admin-pipeline.service';

export const ExternalAdminPosts = () => {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['external-admin', 'pipeline', 'categories'],
    queryFn: externalAdminPipelineService.listCategories,
  });

  const activeCategoryId = useMemo(() => {
    if (categoryIdParam && categories.some((c) => c.id === categoryIdParam)) return categoryIdParam;
    return categories[0]?.id ?? null;
  }, [categoryIdParam, categories]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const postRequestId = searchParams.get('postRequestId');
    if (tab !== 'school-queries' && !postRequestId) return;
    const cid = searchParams.get('categoryId');
    setSearchParams(cid ? { categoryId: cid } : {}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (categories.length === 0) return;
    if (categoryIdParam && categories.some((c) => c.id === categoryIdParam)) return;
    setSearchParams({ categoryId: categories[0].id }, { replace: true });
  }, [categories, categoryIdParam, setSearchParams]);

  const selectCategory = (id: string) => {
    setSearchParams({ categoryId: id });
  };

  const categoryBadges =
    categories.length > 0 ? (
      <nav className="admin-dashboard-badges admin-dashboard-badges--row" aria-label="Your categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`admin-dashboard-badge${activeCategoryId === cat.id ? ' is-active' : ''}`}
            onClick={() => selectCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>
    ) : null;

  return (
    <ExternalAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Posts</h1>
          <p className="admin-page-subtitle">
            Create jobs, offers, campaigns, or events for your assigned external categories. Submissions are reviewed by the school admin under External config → Post approval.
          </p>
          {categoriesLoading ? <p className="small text-muted mt-3 mb-0">Loading your categories…</p> : categoryBadges}
        </header>

        {categoriesLoading ? (
          <div className="admin-loading-state">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="admin-empty-state">
            <p>No external categories are assigned to your account.</p>
          </div>
        ) : activeCategory ? (
          isExternalCampaignCategory(activeCategory.name) ? (
            <ExternalAdminCreateCampaignPanel categoryId={activeCategory.id} categoryName={activeCategory.name} />
          ) : isExternalOffersCategory(activeCategory.name) ? (
            <ExternalAdminCreateOfferPanel categoryId={activeCategory.id} categoryName={activeCategory.name} />
          ) : isExternalJobShareCategory(activeCategory.name) ? (
            <ExternalAdminCreateJobPanel categoryId={activeCategory.id} categoryName={activeCategory.name} />
          ) : (
            <ExternalAdminCreatePostPanel categoryId={activeCategory.id} categoryName={activeCategory.name} />
          )
        ) : null}
      </div>
    </ExternalAdminLayout>
  );
};
