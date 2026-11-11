import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MasterAdminPostLivePreview } from '../components/masterAdmin/MasterAdminPostPreview';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import type { ApprovedEventPublic } from '../services/public-events.service';

export const MasterAdminPostView = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId') ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'post', schoolId, eventId],
    queryFn: () => masterAdminSchoolsService.getPost(schoolId, eventId!),
    enabled: Boolean(schoolId && eventId),
  });

  const backTo = schoolId ? `/master-admin/schools/${schoolId}/posts` : '/master-admin/schools';

  return (
    <div className="master-admin-post-view-page">
      <header className="master-admin-post-view-page__bar">
        <Link to={backTo} className="admin-btn-secondary">
          <i className="bi bi-arrow-left me-2" aria-hidden />
          Back to posts
        </Link>
      </header>
      <main className="master-admin-post-view-page__main master-admin-post-view-page__main--preview">
        {isLoading ? (
          <p className="master-admin-detail-muted">Loading post…</p>
        ) : isError || !data ? (
          <p className="master-admin-detail-muted">Could not load this post.</p>
        ) : (
          <section className="master-admin-post-preview-panel" aria-label="Post preview">
            <h1 className="master-admin-post-preview-panel__title">Post preview</h1>
            <p className="admin-form-hint master-admin-post-preview-panel__subtitle">{data.title}</p>
            <MasterAdminPostLivePreview event={data as ApprovedEventPublic} />
          </section>
        )}
      </main>
    </div>
  );
};
