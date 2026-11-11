import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import {
  MasterAdminPostTargetBreadcrumb,
  MasterAdminPostTargetPicker,
  type MasterAdminPostTarget,
} from '../components/masterAdmin/MasterAdminPostTargetPicker';
import {
  MasterAdminCreatePostForm,
  type MasterAdminPostFormInitial,
} from '../components/masterAdmin/MasterAdminCreatePostForm';
import { masterAdminSchoolsService, type MasterAdminSchoolPostRow } from '../services/master-admin-schools.service';
import {
  masterAdminPostsService,
  type MasterAdminPostDetail,
} from '../services/master-admin-posts.service';
import type { EventActionButton } from '../types/event-post';

type Phase = 'browse' | 'pick-target' | 'create' | 'edit';

function formatPostDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function postStatusPill(status: string) {
  const map: Record<string, string> = {
    published: 'admin-pill admin-pill--status-done',
    approved: 'admin-pill admin-pill--status-done',
    scheduled: 'admin-pill admin-pill--status-progress',
    pending: 'admin-pill admin-pill--status-pending',
    draft: 'admin-pill admin-pill--status-pending',
  };
  const cls = map[status] ?? 'admin-pill admin-pill--neutral';
  return <span className={cls}>{status}</span>;
}

function mapPostToFormInitial(post: MasterAdminPostDetail): MasterAdminPostFormInitial {
  let actionButtons: EventActionButton[] = [];
  if (post.actionButtons) {
    try {
      const raw = JSON.parse(post.actionButtons) as { label: string; url: string }[];
      if (Array.isArray(raw)) {
        actionButtons = raw.map((b, index) => ({
          id: `edit-${index}-${b.label}`,
          label: b.label,
          url: b.url,
        }));
      }
    } catch {
      actionButtons = [];
    }
  }
  let imageUrls: string[] = [];
  if (post.imageUrls) {
    try {
      const raw = JSON.parse(post.imageUrls) as unknown;
      if (Array.isArray(raw)) {
        imageUrls = raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
      }
    } catch {
      imageUrls = [];
    }
  }
  const eventDate =
    post.eventDate && String(post.eventDate).length >= 10 ? String(post.eventDate).slice(0, 10) : '';

  return {
    title: post.title ?? '',
    description: post.description ?? '',
    externalLink: post.externalLink ?? '',
    eventDate,
    eventStartTime: post.eventStartTime ?? '',
    eventEndTime: post.eventEndTime ?? '',
    eventLocation: post.eventLocation ?? '',
    actionButtons,
    commentsEnabled: post.commentsEnabled ?? false,
    imageUrls,
  };
}

function postToTarget(post: MasterAdminPostDetail): MasterAdminPostTarget {
  return {
    schoolId: post.schoolId,
    schoolName: post.school.name,
    categoryId: post.categoryId,
    categoryName: post.subCategory.category.name,
    subCategoryId: post.subCategoryId,
    subCategoryName: post.subCategory.name,
  };
}

function TableViewAction({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="admin-table__link master-admin-posts-table__action"
      aria-label={`View: ${title}`}
      title="View"
    >
      View
      <i className="bi bi-box-arrow-up-right" aria-hidden />
    </a>
  );
}

function TableTextAction({
  label,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`admin-table__link master-admin-posts-table__action${
        danger ? ' master-admin-posts-table__action--danger' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export function MasterAdminPostsPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>('browse');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [target, setTarget] = useState<MasterAdminPostTarget | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);
  const selectedSchoolName = schoolOptions.find((s) => s.id === selectedSchoolId)?.name ?? '';

  useEffect(() => {
    const fromUrl = searchParams.get('schoolId');
    if (!fromUrl || phase !== 'browse') return;
    if (schoolOptions.some((s) => s.id === fromUrl)) {
      setSelectedSchoolId(fromUrl);
    }
  }, [searchParams, schoolOptions, phase]);

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'schools', selectedSchoolId, 'posts'],
    queryFn: () => masterAdminSchoolsService.listPosts(selectedSchoolId),
    enabled: Boolean(selectedSchoolId) && phase === 'browse',
  });

  const { data: editingPost, isLoading: editingLoading } = useQuery({
    queryKey: ['master-admin', 'posts', selectedSchoolId, editingPostId],
    queryFn: () => masterAdminPostsService.getPost(selectedSchoolId, editingPostId!),
    enabled: phase === 'edit' && Boolean(selectedSchoolId && editingPostId),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ schoolId, postId }: { schoolId: string; postId: string }) =>
      masterAdminPostsService.deletePost(schoolId, postId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'schools', vars.schoolId, 'posts'] });
    },
  });

  const invalidatePosts = (schoolId: string) => {
    void queryClient.invalidateQueries({ queryKey: ['master-admin', 'schools', schoolId, 'posts'] });
  };

  const startCreate = () => {
    setTarget(null);
    setEditingPostId(null);
    setPhase('pick-target');
  };

  const handleTargetProcessed = (next: MasterAdminPostTarget) => {
    setTarget(next);
    setEditingPostId(null);
    setPhase('create');
  };

  const handleSaved = (post: MasterAdminSchoolPostRow) => {
    const schoolId = post.schoolId ?? target?.schoolId ?? selectedSchoolId;
    if (schoolId) {
      setSelectedSchoolId(schoolId);
      invalidatePosts(schoolId);
    }
    if (target && post.subCategory) {
      setTarget({
        ...target,
        categoryId: post.subCategory.category.id,
        categoryName: post.subCategory.category.name,
        subCategoryId: post.subCategory.id,
        subCategoryName: post.subCategory.name,
      });
    }
    setEditingPostId(null);
    setPhase('browse');
  };

  const exitComposer = () => {
    setEditingPostId(null);
    setTarget(null);
    setPhase('browse');
  };

  const handleEdit = (post: MasterAdminSchoolPostRow) => {
    if (!selectedSchoolId) return;
    setTarget(null);
    setEditingPostId(post.id);
    setPhase('edit');
  };

  const handleDelete = async (post: MasterAdminSchoolPostRow) => {
    if (!selectedSchoolId) return;
    const ok = window.confirm(`Delete "${post.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ schoolId: selectedSchoolId, postId: post.id });
    } catch {
      window.alert('Could not delete this post.');
    }
  };

  const editTarget = editingPost ? postToTarget(editingPost) : null;
  const editInitial = editingPost ? mapPostToFormInitial(editingPost) : undefined;
  const isComposer = phase === 'pick-target' || phase === 'create' || phase === 'edit';

  return (
    <MasterAdminLayout>
      <div
        className={`admin-posts-page master-admin-posts-hub${
          phase === 'create' || phase === 'edit' ? ' admin-posts-page--create' : ''
        }`}
      >
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">Posts</h1>
              {!isComposer ? (
                <p className="admin-page-subtitle mb-0">Select a school to manage its posts.</p>
              ) : null}
            </div>
            {!isComposer ? (
              <button type="button" className="admin-btn-primary" onClick={startCreate}>
                <i className="bi bi-plus-lg me-2" aria-hidden />
                Create post
              </button>
            ) : null}
          </div>
          {(target ?? editTarget) && (phase === 'create' || phase === 'edit') ? (
            <MasterAdminPostTargetBreadcrumb target={(target ?? editTarget)!} />
          ) : null}
        </header>

        {!isComposer ? (
          <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
            <div className="admin-panel__body">
              <label className="admin-form-label" htmlFor="ma-posts-school-filter">
                Select school
              </label>
              <select
                id="ma-posts-school-filter"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                disabled={schoolsLoading}
              >
                <option value="">Choose school…</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {phase === 'pick-target' ? (
          <section className="admin-panel master-admin-post-target-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <MasterAdminPostTargetPicker
                key="create-target-pick"
                variant="progressive"
                initial={
                  selectedSchoolId
                    ? { schoolId: selectedSchoolId, schoolName: selectedSchoolName }
                    : undefined
                }
                onCancel={exitComposer}
                onSubmit={handleTargetProcessed}
              />
            </div>
          </section>
        ) : null}

        {phase === 'create' && target ? (
          <MasterAdminCreatePostForm
            key={`create-${target.subCategoryId}`}
            target={target}
            onSaved={handleSaved}
            onCancel={exitComposer}
          />
        ) : null}

        {phase === 'edit' && editingPostId ? (
          editingLoading || !editingPost || !editTarget || !editInitial ? (
            <p className="master-admin-detail-muted px-3">Loading post…</p>
          ) : (
            <MasterAdminCreatePostForm
              key={editingPostId}
              postId={editingPostId}
              target={editTarget}
              initialValues={editInitial}
              onSaved={handleSaved}
              onCancel={exitComposer}
            />
          )
        ) : null}

        {phase === 'browse' && selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              {isLoading ? (
                <p className="master-admin-detail-muted mb-0">Loading posts…</p>
              ) : isError ? (
                <p className="master-admin-detail-muted mb-0">Could not load posts.</p>
              ) : posts.length === 0 ? (
                <p className="master-admin-detail-muted mb-0">No posts yet for this school.</p>
              ) : (
                <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
                  <table className="admin-table master-admin-school-table master-admin-posts-table">
                    <thead>
                      <tr>
                        <th className="master-admin-posts-table__col-title">Title</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Posted by</th>
                        <th>Published</th>
                        <th>Status</th>
                        <th className="text-end master-admin-posts-table__col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => {
                        const author =
                          post.subCategoryAdmin?.name ??
                          post.subCategoryAdmin?.email ??
                          post.schoolAdmin?.name ??
                          post.schoolAdmin?.email ??
                          'Master Admin';
                        const viewUrl = `/master-admin/view-post/${post.id}?schoolId=${encodeURIComponent(selectedSchoolId)}`;
                        const deleting =
                          deleteMutation.isPending && deleteMutation.variables?.postId === post.id;
                        return (
                          <tr key={post.id}>
                            <td className="master-admin-posts-table__col-title">
                              <span className="admin-table__strong">{post.title}</span>
                            </td>
                            <td>{post.subCategory?.category?.name ?? '—'}</td>
                            <td>{post.subCategory?.name ?? '—'}</td>
                            <td>{author}</td>
                            <td className="master-admin-posts-table__published">
                              {formatPostDate(post.publishedAt ?? post.publishAt ?? post.createdAt)}
                            </td>
                            <td>{postStatusPill(post.status)}</td>
                            <td className="text-end master-admin-posts-table__col-actions">
                              <div className="master-admin-posts-page__row-actions">
                                <TableViewAction href={viewUrl} title={post.title} />
                                <TableTextAction label="Edit" onClick={() => handleEdit(post)} />
                                <TableTextAction
                                  label={deleting ? 'Deleting…' : 'Delete'}
                                  onClick={() => void handleDelete(post)}
                                  danger
                                  disabled={deleting}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {phase === 'browse' && !selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <p className="master-admin-detail-muted mb-0">Choose a school above to view its posts.</p>
            </div>
          </section>
        ) : null}
      </div>
    </MasterAdminLayout>
  );
}
