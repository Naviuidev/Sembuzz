import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

type SubCategoryAdminBlogSuggestionsPanelProps = {
  onReviseAndResubmit: (blog: BlogRow) => void;
};

export function SubCategoryAdminBlogSuggestionsPanel({
  onReviseAndResubmit,
}: SubCategoryAdminBlogSuggestionsPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedBlog, setSelectedBlog] = useState<BlogRow | null>(null);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['subcategory-admin', 'blogs', 'reverted'],
    queryFn: () => subcategoryAdminBlogsService.getReverted(),
  });

  const filtered = useMemo(() => {
    const withNotes = rows.filter((r) => r.revertNotes?.trim());
    if (!search.trim()) return withNotes;
    const q = search.toLowerCase();
    return withNotes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.subCategory?.name ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (isLoading) {
    return <div className="admin-loading-state">Loading corrections…</div>;
  }

  if (filtered.length === 0 && rows.filter((r) => r.revertNotes?.trim()).length === 0) {
    return (
      <div className="admin-empty-state">
        <i className="bi bi-arrow-down-circle admin-category-dashboard__empty-icon" aria-hidden />
        <p className="admin-form-hint mb-0">No blog corrections received yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-search-wrap admin-search-wrap--wide mb-4">
        <i className="bi bi-search admin-search-icon" aria-hidden />
        <input
          type="search"
          className="form-control admin-search-input"
          placeholder="Search by title or subcategory…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state"><p>No blogs match your search.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Subcategory</th>
                <th scope="col">Feedback</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="admin-table__strong">{b.title}</td>
                  <td>{b.subCategory?.name ?? '—'}</td>
                  <td className="admin-table__details">{b.revertNotes}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--edit"
                        title="View details"
                        aria-label={`View ${b.title}`}
                        onClick={() => setSelectedBlog(b)}
                      >
                        <i className="bi bi-eye" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-primary admin-btn-sm"
                        onClick={() => onReviseAndResubmit(b)}
                      >
                        Revise & resubmit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBlog ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setSelectedBlog(null)}>
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h3 className="admin-modal__title mb-2">{selectedBlog.title}</h3>
              <div className="admin-notice admin-notice--info mb-3">
                <p className="admin-form-label mb-1">Category admin notes</p>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedBlog.revertNotes}</p>
              </div>
              {selectedBlog.content ? (
                <div className="admin-table__details mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedBlog.content}
                </div>
              ) : null}
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setSelectedBlog(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    onReviseAndResubmit(selectedBlog);
                    setSelectedBlog(null);
                  }}
                >
                  Revise & resubmit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
