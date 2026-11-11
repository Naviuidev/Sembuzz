import { useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterAdminLayout } from '../components/MasterAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { MasterAdminSocialAccountForm } from '../components/masterAdmin/MasterAdminSocialAccountForm';
import { MasterAdminSocialAccountsBulkForm } from '../components/masterAdmin/MasterAdminSocialAccountsBulkForm';
import {
  MasterAdminSocialSchoolBreadcrumb,
  MasterAdminSocialSchoolPicker,
  type MasterAdminSocialSchoolTarget,
} from '../components/masterAdmin/MasterAdminSocialSchoolPicker';
import { masterAdminSchoolsService } from '../services/master-admin-schools.service';
import {
  masterAdminSocialAccountsService,
  type MasterAdminSocialAccount,
} from '../services/master-admin-social-accounts.service';
import { imageSrc, isImageIconValue } from '../utils/image';

type Phase = 'browse' | 'pick-school' | 'create' | 'edit';

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

function SocialPlatformCell({ account }: { account: MasterAdminSocialAccount }) {
  const icon = account.icon;
  return (
    <span className="admin-table__strong d-inline-flex align-items-center gap-2">
      {isImageIconValue(icon) ? (
        <img src={imageSrc(icon)} alt="" width={20} height={20} style={{ borderRadius: 4, objectFit: 'cover' }} />
      ) : (
        <i className={`bi ${icon.startsWith('bi-') ? icon : `bi-${icon}`}`} aria-hidden />
      )}
      {account.platformName}
    </span>
  );
}

export function MasterAdminSocialPage() {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('browse');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [target, setTarget] = useState<MasterAdminSocialSchoolTarget | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkDefaultPageName, setBulkDefaultPageName] = useState('');

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['master-admin', 'schools'],
    queryFn: () => masterAdminSchoolsService.list(),
  });

  const schoolOptions = useMemo(() => schools.filter((s) => s.isActive), [schools]);

  const accountsSchoolId = target?.schoolId ?? selectedSchoolId;

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: ['master-admin', 'social-accounts', accountsSchoolId],
    queryFn: () => masterAdminSocialAccountsService.list(accountsSchoolId),
    enabled: Boolean(accountsSchoolId) && (phase === 'browse' || phase === 'create'),
  });

  const { data: editingAccount, isLoading: editingLoading } = useQuery({
    queryKey: ['master-admin', 'social-accounts', selectedSchoolId, editingId],
    queryFn: () => masterAdminSocialAccountsService.getOne(selectedSchoolId, editingId!),
    enabled: phase === 'edit' && Boolean(selectedSchoolId && editingId),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ schoolId, id }: { schoolId: string; id: string }) =>
      masterAdminSocialAccountsService.delete(schoolId, id),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'social-accounts', vars.schoolId] });
    },
  });

  const isComposer = phase === 'pick-school' || phase === 'create' || phase === 'edit';

  const startCreate = () => {
    setEditingId(null);
    setBulkDefaultPageName('');
    const school = schoolOptions.find((s) => s.id === selectedSchoolId);
    if (school) {
      setTarget({ schoolId: school.id, schoolName: school.name });
      setPhase('create');
      return;
    }
    setTarget(null);
    setPhase('pick-school');
  };

  const startAddMorePlatforms = (pageName?: string) => {
    const school =
      target ??
      (selectedSchoolId
        ? {
            schoolId: selectedSchoolId,
            schoolName: schoolOptions.find((s) => s.id === selectedSchoolId)?.name ?? '',
          }
        : null);
    if (!school) return;
    setTarget(school);
    setSelectedSchoolId(school.schoolId);
    setEditingId(null);
    setBulkDefaultPageName(pageName?.trim() ?? '');
    setPhase('create');
  };

  const handleSchoolProcessed = (next: MasterAdminSocialSchoolTarget) => {
    setTarget(next);
    setSelectedSchoolId(next.schoolId);
    setPhase('create');
  };

  const exitComposer = () => {
    setTarget(null);
    setEditingId(null);
    setBulkDefaultPageName('');
    setPhase('browse');
  };

  const handleSaved = () => {
    if (target?.schoolId) {
      setSelectedSchoolId(target.schoolId);
      void queryClient.invalidateQueries({ queryKey: ['master-admin', 'social-accounts', target.schoolId] });
    }
    exitComposer();
  };

  const handleEdit = (account: MasterAdminSocialAccount) => {
    const schoolName = schoolOptions.find((s) => s.id === account.schoolId)?.name ?? '';
    setTarget({ schoolId: account.schoolId, schoolName });
    setSelectedSchoolId(account.schoolId);
    setEditingId(account.id);
    setPhase('edit');
  };

  const handleDelete = async (account: MasterAdminSocialAccount) => {
    const ok = window.confirm(`Delete "${account.pageName}" on ${account.platformName}?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ schoolId: account.schoolId, id: account.id });
    } catch {
      window.alert('Could not delete this account.');
    }
  };

  const breadcrumbSchool = target?.schoolName ?? schoolOptions.find((s) => s.id === selectedSchoolId)?.name;

  const disabledPlatformIds = useMemo(() => {
    if (!bulkDefaultPageName.trim()) return [];
    const key = bulkDefaultPageName.trim();
    return accounts
      .filter((a) => a.pageName.trim() === key)
      .map((a) => a.platformId);
  }, [accounts, bulkDefaultPageName]);

  return (
    <MasterAdminLayout>
      <div className="admin-posts-page master-admin-posts-hub">
        <header className="admin-page-header master-admin-posts-page__header" style={panelStyle}>
          <div className="master-admin-posts-page__header-row">
            <div>
              <h1 className="admin-page-title mb-1">Social share</h1>
              {!isComposer ? (
                <p className="admin-page-subtitle mb-0">
                  Select a school, then use <strong>Add platforms</strong> to link Instagram, TikTok, and others at once.
                  Edit changes one platform only.
                </p>
              ) : null}
            </div>
            {!isComposer ? (
              <button type="button" className="admin-btn-primary" onClick={startCreate}>
                <i className="bi bi-plus-lg me-2" aria-hidden />
                Add platforms
              </button>
            ) : null}
          </div>
          {breadcrumbSchool && isComposer ? <MasterAdminSocialSchoolBreadcrumb schoolName={breadcrumbSchool} /> : null}
        </header>

        {!isComposer ? (
          <section className="admin-panel master-admin-posts-school-filter" style={panelStyle}>
            <div className="admin-panel__body">
              <label className="admin-form-label" htmlFor="ma-social-filter-school">
                Select school
              </label>
              <select
                id="ma-social-filter-school"
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

        {phase === 'pick-school' ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              <MasterAdminSocialSchoolPicker
                initialSchoolId={selectedSchoolId || undefined}
                onCancel={exitComposer}
                onSubmit={handleSchoolProcessed}
              />
            </div>
          </section>
        ) : null}

        {phase === 'create' && target ? (
          <>
            <p className="admin-form-hint px-3 mb-0">
              Step 1: select one or more platforms. Step 2: enter the shared page name and a link for each platform.
            </p>
          <MasterAdminSocialAccountsBulkForm
            key={`${target.schoolId}-${bulkDefaultPageName}`}
            target={target}
            defaultPageName={bulkDefaultPageName}
            disabledPlatformIds={disabledPlatformIds}
            onSaved={handleSaved}
            onCancel={exitComposer}
          />
          </>
        ) : null}

        {phase === 'edit' && target && editingId ? (
          editingLoading || !editingAccount ? (
            <p className="master-admin-detail-muted px-3">Loading account…</p>
          ) : (
            <MasterAdminSocialAccountForm
              target={target}
              accountId={editingId}
              initial={editingAccount}
              onSaved={handleSaved}
              onCancel={exitComposer}
              onAddMorePlatforms={() => startAddMorePlatforms(editingAccount.pageName)}
            />
          )
        ) : null}

        {phase === 'browse' && selectedSchoolId ? (
          <section className="admin-panel" style={panelStyle}>
            <div className="admin-panel__body">
              {isLoading ? (
                <p className="master-admin-detail-muted mb-0">Loading accounts…</p>
              ) : isError ? (
                <p className="master-admin-detail-muted mb-0">Could not load social accounts.</p>
              ) : accounts.length === 0 ? (
                <p className="master-admin-detail-muted mb-0">
                  No social accounts for this school yet. Click <strong>Add platforms</strong> to select Instagram,
                  TikTok, and others in one go.
                </p>
              ) : (
                <div className="admin-table-wrap master-admin-school-table-wrap master-admin-school-table-wrap--posts">
                  <table className="admin-table master-admin-school-table master-admin-posts-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Page name</th>
                        <th>Link</th>
                        <th className="text-end master-admin-posts-table__col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => {
                        const deleting =
                          deleteMutation.isPending && deleteMutation.variables?.id === account.id;
                        return (
                          <tr key={account.id}>
                            <td>
                              <SocialPlatformCell account={account} />
                            </td>
                            <td>{account.pageName}</td>
                            <td>
                              <span
                                className="master-admin-table-meta text-truncate d-inline-block"
                                style={{ maxWidth: '12rem' }}
                              >
                                {account.link}
                              </span>
                            </td>
                            <td className="text-end master-admin-posts-table__col-actions">
                              <div className="master-admin-posts-page__row-actions">
                                <TableViewAction href={account.link} title={account.pageName} />
                                <TableTextAction label="Edit" onClick={() => handleEdit(account)} />
                                <TableTextAction
                                  label={deleting ? 'Deleting…' : 'Delete'}
                                  onClick={() => void handleDelete(account)}
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
              <p className="master-admin-detail-muted mb-0">Choose a school above to view social accounts.</p>
            </div>
          </section>
        ) : null}
      </div>
    </MasterAdminLayout>
  );
}
