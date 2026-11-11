import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ADMIN_PORTAL_ACCENTS } from '../../constants/adminPortalTheme';
import { SOCIAL_PLATFORMS } from '../../constants/socialPlatforms';
import { masterAdminSocialAccountsService } from '../../services/master-admin-social-accounts.service';
import type { MasterAdminSocialSchoolTarget } from './MasterAdminSocialSchoolPicker';

type Step = 'platforms' | 'links';

type Props = {
  target: MasterAdminSocialSchoolTarget;
  defaultPageName?: string;
  disabledPlatformIds?: string[];
  onSaved: () => void;
  onCancel: () => void;
};

export function MasterAdminSocialAccountsBulkForm({
  target,
  defaultPageName = '',
  disabledPlatformIds = [],
  onSaved,
  onCancel,
}: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const [step, setStep] = useState<Step>('platforms');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageName, setPageName] = useState(defaultPageName);
  const [linksByPlatform, setLinksByPlatform] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPlatforms = useMemo(
    () =>
      SOCIAL_PLATFORMS.filter(
        (p) => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [searchQuery],
  );

  const selectedPlatforms = SOCIAL_PLATFORMS.filter((p) => selectedIds.has(p.id));

  const disabledSet = useMemo(() => new Set(disabledPlatformIds), [disabledPlatformIds]);

  const togglePlatform = (id: string) => {
    if (disabledSet.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToLinks = () => {
    if (selectedIds.size === 0) return;
    const next: Record<string, string> = {};
    selectedIds.forEach((id) => {
      next[id] = linksByPlatform[id] ?? '';
    });
    setLinksByPlatform(next);
    setStep('links');
  };

  const canSave =
    pageName.trim().length > 0 &&
    selectedPlatforms.length > 0 &&
    selectedPlatforms.every((p) => (linksByPlatform[p.id] ?? '').trim().length > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const accounts = selectedPlatforms.map((p) => ({
        platformId: p.id,
        platformName: p.name,
        pageName: pageName.trim(),
        icon: p.icon,
        link: linksByPlatform[p.id].trim(),
      }));
      await masterAdminSocialAccountsService.createBulk(target.schoolId, accounts);
      onSaved();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Could not save social accounts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel" style={panelStyle}>
      <div className="admin-panel__body">
        {error ? <p className="admin-form-hint admin-form-hint--error">{error}</p> : null}

        {step === 'platforms' ? (
          <>
            <h2 className="admin-panel__title mb-2">Select platforms</h2>
            <p className="admin-form-hint mb-3">Choose one or more platforms to add for {target.schoolName}.</p>
            <input
              type="search"
              className="form-control admin-form-control mb-3"
              placeholder="Search platforms…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '20rem' }}
            />
            <div className="admin-social-platform-grid mb-4">
              {filteredPlatforms.map((p) => {
                const isDisabled = disabledSet.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`admin-social-platform-btn${selectedIds.has(p.id) ? ' is-selected' : ''}${
                      isDisabled ? ' is-disabled' : ''
                    }`}
                    onClick={() => togglePlatform(p.id)}
                    aria-pressed={selectedIds.has(p.id)}
                    disabled={isDisabled}
                    title={isDisabled ? 'Already added for this page name' : undefined}
                  >
                    <i className={`bi ${p.icon}`} aria-hidden />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <button type="button" className="admin-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={selectedIds.size === 0}
                onClick={goToLinks}
              >
                Next ({selectedIds.size} selected)
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="admin-panel__title mb-2">Add links</h2>
            <p className="admin-form-hint mb-3">
              Same page name is used for all selected platforms. Enter a link for each.
            </p>
            <div className="mb-3" style={{ maxWidth: '24rem' }}>
              <label className="admin-form-label" htmlFor="ma-social-bulk-page-name">
                Page / club name
              </label>
              <input
                id="ma-social-bulk-page-name"
                className="form-control admin-form-control"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <ul className="list-unstyled mb-4">
              {selectedPlatforms.map((p) => (
                <li key={p.id} className="mb-3" style={{ maxWidth: '32rem' }}>
                  <label className="admin-form-label d-flex align-items-center gap-2" htmlFor={`link-${p.id}`}>
                    <i className={`bi ${p.icon}`} aria-hidden />
                    {p.name}
                  </label>
                  <input
                    id={`link-${p.id}`}
                    type="url"
                    className="form-control admin-form-control"
                    value={linksByPlatform[p.id] ?? ''}
                    onChange={(e) =>
                      setLinksByPlatform((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    required
                    placeholder="https://"
                  />
                </li>
              ))}
            </ul>
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <button type="button" className="admin-btn-secondary" onClick={() => setStep('platforms')} disabled={saving}>
                Back
              </button>
              <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary" disabled={saving || !canSave}>
                {saving ? 'Saving…' : `Save ${selectedPlatforms.length} account${selectedPlatforms.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
