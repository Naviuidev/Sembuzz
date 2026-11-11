import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { masterAdminUsersService } from '../../services/master-admin-users.service';
import type { PendingUser } from '../../services/school-admin-pending-users.service';
import type { SchoolStudent } from '../../services/school-admin-students.service';
import type { UserHelpQueryForAdmin } from '../../services/school-admin-user-help.service';
import { VerificationDocViewModal } from '../admin/VerificationDocViewModal';

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
  } catch {
    return iso;
  }
}

function userDisplayName(row: { name: string; firstName: string | null; lastName: string | null }) {
  const fromParts = [row.firstName, row.lastName].filter(Boolean).join(' ');
  return fromParts || row.name || '—';
}

function MasterAdminUsersTableShell({
  children,
  emptyIcon,
  emptyTitle,
  emptyHint,
  isLoading,
  isError,
  isEmpty,
}: {
  children: ReactNode;
  emptyIcon: string;
  emptyTitle: string;
  emptyHint?: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}) {
  if (isLoading) {
    return <p className="master-admin-detail-muted mb-0">Loading…</p>;
  }
  if (isError) {
    return <p className="master-admin-detail-muted mb-0">Could not load data for this school.</p>;
  }
  if (isEmpty) {
    return (
      <div className="text-center py-4">
        <i className={`bi ${emptyIcon} d-block mb-2`} style={{ fontSize: '2.25rem', color: '#94a3b8' }} aria-hidden />
        <p className="mb-1">{emptyTitle}</p>
        {emptyHint ? <p className="admin-form-hint mb-0">{emptyHint}</p> : null}
      </div>
    );
  }
  return (
    <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
      <table className="admin-table master-admin-school-table master-admin-posts-table">{children}</table>
    </div>
  );
}

export function MasterAdminUserRequestsPanel({ schoolId }: { schoolId: string }) {
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);

  const { data: pending = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'users', schoolId, 'pending'],
    queryFn: () => masterAdminUsersService.listPending(schoolId),
    enabled: Boolean(schoolId),
  });

  return (
    <>
      <MasterAdminUsersTableShell
        isLoading={isLoading}
        isError={isError}
        isEmpty={pending.length === 0}
        emptyIcon="bi-inbox"
        emptyTitle="No pending user requests."
        emptyHint="Gmail/Yahoo signups awaiting school approval appear here."
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Requested</th>
            <th>Documents</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((user: PendingUser) => (
            <tr key={user.id}>
              <td>
                <span className="admin-table__strong">{userDisplayName(user)}</span>
              </td>
              <td>{user.email}</td>
              <td className="master-admin-posts-table__published">{formatDateTime(user.createdAt)}</td>
              <td>
                <div className="d-flex flex-wrap gap-1">
                  {user.verificationDocUrl ? (
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      onClick={() => setViewDocUrl(user.verificationDocUrl)}
                    >
                      View doc
                    </button>
                  ) : null}
                  {user.additionalVerificationDocUrl ? (
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      onClick={() => setViewDocUrl(user.additionalVerificationDocUrl)}
                    >
                      View additional
                    </button>
                  ) : null}
                  {!user.verificationDocUrl && !user.additionalVerificationDocUrl ? (
                    <span className="admin-form-hint">No doc uploaded</span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </MasterAdminUsersTableShell>
      {viewDocUrl ? (
        <VerificationDocViewModal key={viewDocUrl} viewDocUrl={viewDocUrl} onClose={() => setViewDocUrl(null)} />
      ) : null}
    </>
  );
}

function StudentRowsWithBan({
  schoolId,
  users,
  listKey,
  showDoc,
  onError,
  onViewDoc,
}: {
  schoolId: string;
  users: SchoolStudent[];
  listKey: 'approved' | 'automated';
  showDoc?: boolean;
  onError: (message: string | null) => void;
  onViewDoc: (url: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['master-admin', 'users', schoolId, listKey] });
  };

  const handleBan = async (s: SchoolStudent) => {
    setActioningId(s.id);
    onError(null);
    try {
      await masterAdminUsersService.ban(schoolId, s.id);
      invalidate();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      onError(msg || 'Failed to ban user.');
    } finally {
      setActioningId(null);
    }
  };

  const handleUnban = async (s: SchoolStudent) => {
    setActioningId(s.id);
    onError(null);
    try {
      await masterAdminUsersService.unban(schoolId, s.id);
      invalidate();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      onError(msg || 'Failed to unban user.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Joined</th>
          <th>Status</th>
          {showDoc ? <th>Doc</th> : null}
          <th className="text-end master-admin-posts-table__col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((s) => (
          <tr key={s.id}>
            <td>
              <span className="admin-table__strong">{userDisplayName(s)}</span>
            </td>
            <td>{s.email}</td>
            <td className="master-admin-posts-table__published">{formatDate(s.createdAt)}</td>
            <td>
              {s.status === 'banned' ? (
                <span className="admin-pill admin-pill--inactive">Banned</span>
              ) : (
                <span className="admin-pill admin-pill--active">Active</span>
              )}
            </td>
            {showDoc ? (
              <td>
                <div className="d-flex flex-wrap gap-1">
                  {s.verificationDocUrl ? (
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      onClick={() => onViewDoc(s.verificationDocUrl)}
                    >
                      View doc
                    </button>
                  ) : null}
                  {s.additionalVerificationDocUrl ? (
                    <button
                      type="button"
                      className="admin-btn-secondary admin-btn-sm"
                      onClick={() => onViewDoc(s.additionalVerificationDocUrl)}
                    >
                      View additional
                    </button>
                  ) : null}
                  {!s.verificationDocUrl && !s.additionalVerificationDocUrl ? (
                    <span className="admin-form-hint">—</span>
                  ) : null}
                </div>
              </td>
            ) : null}
            <td className="text-end master-admin-posts-table__col-actions">
              {s.status === 'banned' ? (
                <button
                  type="button"
                  className="admin-table__link master-admin-posts-table__action"
                  disabled={actioningId === s.id}
                  onClick={() => void handleUnban(s)}
                >
                  {actioningId === s.id ? 'Unbanning…' : 'Unban'}
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-table__link master-admin-posts-table__action master-admin-posts-table__action--danger"
                  disabled={actioningId === s.id}
                  onClick={() => void handleBan(s)}
                >
                  {actioningId === s.id ? 'Banning…' : 'Ban'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
}

function StudentsBanListPanel({
  schoolId,
  listKey,
  emptyIcon,
  emptyTitle,
  emptyHint,
  showDoc,
  fetchList,
}: {
  schoolId: string;
  listKey: 'approved' | 'automated';
  emptyIcon: string;
  emptyTitle: string;
  emptyHint: string;
  showDoc?: boolean;
  fetchList: (schoolId: string) => Promise<SchoolStudent[]>;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'users', schoolId, listKey],
    queryFn: () => fetchList(schoolId),
    enabled: Boolean(schoolId),
  });

  return (
    <>
      {actionError ? (
        <div className="alert alert-danger mb-3" style={{ borderRadius: 0 }}>
          {actionError}
        </div>
      ) : null}
      <MasterAdminUsersTableShell
        isLoading={isLoading}
        isError={isError}
        isEmpty={users.length === 0}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
      >
        <StudentRowsWithBan
          schoolId={schoolId}
          users={users}
          listKey={listKey}
          showDoc={showDoc}
          onError={setActionError}
          onViewDoc={setViewDocUrl}
        />
      </MasterAdminUsersTableShell>
      {viewDocUrl ? (
        <VerificationDocViewModal key={viewDocUrl} viewDocUrl={viewDocUrl} onClose={() => setViewDocUrl(null)} />
      ) : null}
    </>
  );
}

export function MasterAdminApprovedUsersPanel({ schoolId }: { schoolId: string }) {
  return (
    <StudentsBanListPanel
      schoolId={schoolId}
      listKey="approved"
      emptyIcon="bi-person-check"
      emptyTitle="No approved users yet."
      emptyHint="Students approved after Gmail signup appear here."
      fetchList={masterAdminUsersService.listApproved}
    />
  );
}

export function MasterAdminAutomatedUsersPanel({ schoolId }: { schoolId: string }) {
  return (
    <StudentsBanListPanel
      schoolId={schoolId}
      listKey="automated"
      emptyIcon="bi-people"
      emptyTitle="No automated users yet."
      emptyHint="School-domain email signups verified via OTP appear here."
      showDoc
      fetchList={masterAdminUsersService.listAutomated}
    />
  );
}

function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open' || s === 'pending') return 'admin-pill admin-pill--warning';
  if (s === 'resolved' || s === 'closed') return 'admin-pill admin-pill--active';
  return 'admin-pill admin-pill--neutral';
}

export function MasterAdminUserHelpPanel({ schoolId }: { schoolId: string }) {
  const { data: queries = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'users', schoolId, 'help'],
    queryFn: () => masterAdminUsersService.listHelp(schoolId),
    enabled: Boolean(schoolId),
  });

  if (isLoading) {
    return <p className="master-admin-detail-muted mb-0">Loading user help queries…</p>;
  }
  if (isError) {
    return <p className="master-admin-detail-muted mb-0">Could not load user help queries.</p>;
  }
  if (queries.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-question-circle d-block mb-2" style={{ fontSize: '2.25rem', color: '#94a3b8' }} aria-hidden />
        <p className="mb-1">No user queries yet.</p>
        <p className="admin-form-hint mb-0">Help requests from app users for this school appear here.</p>
      </div>
    );
  }

  return (
    <ul className="admin-help-query-list list-unstyled mb-0">
      {queries.map((q: UserHelpQueryForAdmin) => (
        <li key={q.id} className="admin-help-query-list__item">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <span className="admin-table__strong">{q.user?.name ?? 'Unknown'}</span>
              {q.user?.email ? <span className="text-muted small ms-2">{q.user.email}</span> : null}
            </div>
            <span className={statusPillClass(q.status)}>{q.status}</span>
          </div>
          <p className="admin-form-hint mb-2 mt-1">{formatDateTime(q.createdAt)}</p>
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: 1.5 }}>
            {q.message}
          </p>
        </li>
      ))}
    </ul>
  );
}
