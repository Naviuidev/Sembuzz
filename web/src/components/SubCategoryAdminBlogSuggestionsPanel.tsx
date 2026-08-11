import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subcategoryAdminBlogsService, type BlogRow } from '../services/subcategory-admin-blogs.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type SubCategoryAdminBlogSuggestionsPanelProps = {
  onReviseAndResubmit: (blog: BlogRow) => void;
};

export function SubCategoryAdminBlogSuggestionsPanel({
  onReviseAndResubmit,
}: SubCategoryAdminBlogSuggestionsPanelProps) {
  const [search, setSearch] = useState('');
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

  return (
    <>
      <p style={{ color: TEXT_MUTED, fontSize: '1rem', marginBottom: '1.5rem' }}>
        Category admin asked for changes. Edit and resubmit as a new post.
      </p>
      <div className="mb-4" style={{ maxWidth: '600px' }}>
        <div style={{ position: 'relative' }}>
          <i
            className="bi bi-search"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: TEXT_MUTED,
              fontSize: '1.1rem',
            }}
          />
          <input
            type="search"
            className="form-control"
            placeholder="Search blog suggestions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              borderRadius: '50px',
              padding: '0.75rem 1rem 0.75rem 3rem',
              fontSize: '1rem',
              border: '1px solid #dee2e6',
            }}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No suggestions.</p>
      ) : (
        <div className="table-responsive card border-0 shadow-sm" style={{ borderRadius: 0 }}>
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Title</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Subcategory</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK }}>Feedback</th>
                <th style={{ fontWeight: '600', color: TEXT_DARK, width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: '500', color: TEXT_DARK }}>{b.title}</td>
                  <td style={{ color: TEXT_MUTED }}>{b.subCategory?.name ?? '—'}</td>
                  <td style={{ color: TEXT_MUTED, fontSize: '0.9rem' }}>{b.revertNotes}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-dark"
                      style={{ borderRadius: '50px', padding: '0.35rem 0.9rem', fontWeight: '500' }}
                      onClick={() => onReviseAndResubmit(b)}
                    >
                      Revise & resubmit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
