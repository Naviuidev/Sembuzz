import { useMemo, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalAdminLayout } from '../components/ExternalAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { ExternalPipelineRequestConversationView } from '../components/ExternalPipelineRequestConversationView';
import { externalAdminPipelineService } from '../services/external-admin-pipeline.service';
import { pipelineStatusLabel, pipelineStatusPillClass } from '../utils/externalPipelineStatus';
import { pipelineAwaitingExternalReply, pipelineThreadMessages } from '../utils/externalPipelineThread';
import { getApiErrorMessage } from '../utils/apiError';

type Tab = 'pipeline' | 'queries';

export const ExternalAdminPrivacy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'queries' ? 'queries' : 'pipeline';
  const conversationRequestId = searchParams.get('requestId');
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.external } as CSSProperties;
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pipelineSuccessOpen, setPipelineSuccessOpen] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['external-admin', 'pipeline', 'categories'],
    queryFn: externalAdminPipelineService.listCategories,
  });

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['external-admin', 'pipeline', 'schools'],
    queryFn: externalAdminPipelineService.listSchools,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['external-admin', 'pipeline', 'requests'],
    queryFn: externalAdminPipelineService.listRequests,
  });

  const filteredSchools = useMemo(() => {
    const q = schoolSearch.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.refNum.toLowerCase().includes(q),
    );
  }, [schools, schoolSearch]);

  const createMutation = useMutation({
    mutationFn: externalAdminPipelineService.createRequests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'pipeline', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['external-admin', 'pipeline', 'summary'] });
      setSelectedSchoolIds([]);
      setRequestMessage('');
      setFormError(null);
      setPipelineSuccessOpen(true);
      createMutation.reset();
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, 'Failed to send pipeline requests.'));
    },
  });

  const setTab = (next: Tab) => {
    setSearchParams(next === 'queries' ? { tab: 'queries' } : {});
  };

  const openConversation = (requestId: string) => {
    setSearchParams({ tab: 'queries', requestId });
  };

  const closeConversation = () => {
    setSearchParams({ tab: 'queries' });
  };

  const toggleSchool = (id: string) => {
    setSelectedSchoolIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const closePipelineSuccess = () => {
    setPipelineSuccessOpen(false);
    createMutation.reset();
  };

  const onSendPipeline = () => {
    setFormError(null);
    if (!selectedCategoryId) {
      setFormError('Select an external category on the left.');
      return;
    }
    if (selectedSchoolIds.length === 0) {
      setFormError('Select at least one school.');
      return;
    }
    createMutation.mutate({
      externalCategoryId: selectedCategoryId,
      schoolIds: selectedSchoolIds,
      message: requestMessage.trim() || undefined,
    });
  };

  const queriesNeedingReply = requests.filter((r) => pipelineAwaitingExternalReply(r));

  return (
    <ExternalAdminLayout>
      <div className="admin-category-dashboard admin-category-dashboard--compact">
        <header className="admin-page-header" style={panelStyle}>
          <h1 className="admin-page-title">Privacy</h1>
          <p className="admin-page-subtitle">
            {conversationRequestId && tab === 'queries'
              ? 'Full conversation with the school admin. Use the composer below to reply.'
              : 'Request pipeline access to connect your external categories with schools. School admin responses appear under School admin queries.'}
          </p>
        </header>

        <div className="admin-privacy-tabs mb-3" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pipeline'}
            className={`admin-privacy-tabs__btn${tab === 'pipeline' ? ' is-active' : ''}`}
            onClick={() => setTab('pipeline')}
          >
            Pipeline access
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'queries'}
            className={`admin-privacy-tabs__btn${tab === 'queries' ? ' is-active' : ''}`}
            onClick={() => setTab('queries')}
          >
            School admin queries
            {queriesNeedingReply.length > 0 ? (
              <span className="admin-privacy-tabs__badge">{queriesNeedingReply.length}</span>
            ) : null}
          </button>
        </div>

        {tab === 'pipeline' ? (
          <section className="admin-panel external-privacy-split" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">Connect schools</h2>
            </div>
            <div className="admin-panel__body">
              <div className="row g-3">
                <div className="col-lg-4">
                  <p className="small fw-semibold text-muted mb-2">Your categories</p>
                  <div className="external-privacy-category-list">
                    {categories.length === 0 ? (
                      <p className="small text-muted mb-0">No categories assigned.</p>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`external-privacy-category-btn${selectedCategoryId === cat.id ? ' is-active' : ''}`}
                          onClick={() => setSelectedCategoryId(cat.id)}
                        >
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-lg-8">
                  <p className="small fw-semibold text-muted mb-2">Schools on SemBuzz</p>
                  <input
                    type="search"
                    className="form-control form-control-sm mb-2"
                    placeholder="Search schools…"
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                  />
                  {schoolsLoading ? (
                    <p className="small text-muted">Loading schools…</p>
                  ) : (
                    <div className="external-privacy-school-list">
                      {filteredSchools.map((school) => (
                        <label key={school.id} className="external-privacy-school-row">
                          <input
                            type="checkbox"
                            checked={selectedSchoolIds.includes(school.id)}
                            onChange={() => toggleSchool(school.id)}
                          />
                          <span>
                            <span className="fw-semibold">{school.name}</span>
                            <span className="small text-muted d-block">{school.city}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <label className="small fw-semibold mt-3 mb-1">Message to school admin (optional)</label>
                  <textarea
                    className="form-control form-control-sm mb-2"
                    rows={2}
                    maxLength={2000}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Why you want to connect this category to the selected schools…"
                  />
                  {formError ? <p className="small text-danger">{formError}</p> : null}
                  <button
                    type="button"
                    className="admin-btn-primary admin-btn-sm"
                    disabled={createMutation.isPending}
                    onClick={onSendPipeline}
                  >
                    {createMutation.isPending ? 'Sending…' : 'Send pipeline request'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : conversationRequestId ? (
          <section className="admin-panel admin-panel--pipeline-conversation" style={panelStyle}>
            <div className="admin-panel__body">
              <ExternalPipelineRequestConversationView
                role="external"
                requestId={conversationRequestId}
                preview={requests.find((r) => r.id === conversationRequestId) ?? null}
                onBack={closeConversation}
              />
            </div>
          </section>
        ) : (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__header">
              <h2 className="admin-panel__title">School admin queries & responses</h2>
            </div>
            <div className="admin-panel__body admin-panel__body--flush-top">
              {requestsLoading ? (
                <div className="admin-loading-state">Loading…</div>
              ) : requests.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No pipeline requests yet. Use Pipeline access to connect with schools.</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>School</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Latest message</th>
                        <th>Updated</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((row) => {
                        const thread = pipelineThreadMessages(row);
                        const latest = thread[thread.length - 1];
                        return (
                        <tr key={row.id}>
                          <td>
                            <span className="admin-table__strong">{row.school.name}</span>
                            <div className="small text-muted">{row.school.city}</div>
                          </td>
                          <td>{row.externalCategory.name}</td>
                          <td>
                            <span className={pipelineStatusPillClass(row.status)}>
                              {pipelineStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="small" style={{ maxWidth: 280 }}>
                            {latest ? (
                              <>
                                <span className="text-muted">
                                  {latest.senderRole === 'school_admin' ? 'School: ' : 'You: '}
                                </span>
                                {latest.body.length > 120 ? `${latest.body.slice(0, 120)}…` : latest.body}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="small text-muted">
                            {new Date(row.updatedAt).toLocaleDateString()}
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
              )}
            </div>
          </section>
        )}
      </div>

      {pipelineSuccessOpen ? (
        <div
          className="admin-modal-overlay admin-modal-overlay--elevated"
          role="presentation"
          onClick={closePipelineSuccess}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-labelledby="external-pipeline-success-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body admin-modal__body--with-close">
              <button type="button" className="admin-modal__close" aria-label="Close" onClick={closePipelineSuccess}>
                <i className="bi bi-x-lg" aria-hidden />
              </button>
              <div className="admin-modal__head">
                <i className="bi bi-check-circle-fill admin-modal__icon admin-modal__icon--success" aria-hidden />
                <h2 id="external-pipeline-success-title" className="admin-modal__title">
                  Sent to school admin
                </h2>
              </div>
              <p className="admin-modal__text">
                Pipeline request(s) were sent to the school admin. They will review your access request and can approve,
                reject, or send a query.
              </p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-primary" onClick={closePipelineSuccess}>OK</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ExternalAdminLayout>
  );
};
