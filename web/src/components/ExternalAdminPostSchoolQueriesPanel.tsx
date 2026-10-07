import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalPostRequestConversationView } from './ExternalPostRequestConversationView';
import { externalAdminPostRequestsService } from '../services/external-admin-post-requests.service';
import { externalPostStatusLabel, externalPostStatusPillClass } from '../utils/externalPostRequestStatus';
import { postThreadMessages } from '../utils/externalPostRequestThread';

export function ExternalAdminPostSchoolQueriesPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const postRequestId = searchParams.get('postRequestId');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['external-admin', 'post-requests', 'requests'],
    queryFn: externalAdminPostRequestsService.listRequests,
  });

  const openConversation = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'school-queries');
    next.set('postRequestId', id);
    setSearchParams(next);
  };

  const closeConversation = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('postRequestId');
    setSearchParams(next);
  };

  if (postRequestId) {
    return (
      <ExternalPostRequestConversationView
        role="external"
        requestId={postRequestId}
        preview={requests.find((r) => r.id === postRequestId) ?? null}
        onBack={closeConversation}
      />
    );
  }

  if (isLoading) return <div className="admin-loading-state">Loading…</div>;

  const withThread = requests.filter((r) => postThreadMessages(r).length > 0 || r.status === 'query');

  if (withThread.length === 0) {
    return (
      <div className="admin-empty-state">
        <p>No school admin queries on your posts yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Post</th>
            <th>School</th>
            <th>Category</th>
            <th>Status</th>
            <th>Latest</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withThread.map((row) => {
            const thread = postThreadMessages(row);
            const latest = thread[thread.length - 1];
            return (
              <tr key={row.id}>
                <td className="admin-table__strong">{row.title}</td>
                <td>{row.school.name}</td>
                <td>{row.externalCategory.name}</td>
                <td>
                  <span className={externalPostStatusPillClass(row.status)}>{externalPostStatusLabel(row.status)}</span>
                </td>
                <td className="small" style={{ maxWidth: 220 }}>
                  {latest ? (
                    <>
                      <span className="text-muted">{latest.senderRole === 'school_admin' ? 'School: ' : 'You: '}</span>
                      {latest.body.length > 80 ? `${latest.body.slice(0, 80)}…` : latest.body}
                    </>
                  ) : '—'}
                </td>
                <td>
                  <div className="admin-table-actions justify-content-end">
                    <button
                      type="button"
                      className="admin-icon-btn admin-icon-btn--edit"
                      title="View conversation"
                      aria-label="View conversation"
                      onClick={() => openConversation(row.id)}
                    >
                      <i className="bi bi-eye" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
