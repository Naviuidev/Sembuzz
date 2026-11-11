import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { ADMIN_PORTAL_ACCENTS } from '../../constants/adminPortalTheme';
import { SOCIAL_PLATFORMS } from '../../constants/socialPlatforms';
import {
  masterAdminSocialAccountsService,
  type MasterAdminSocialAccount,
} from '../../services/master-admin-social-accounts.service';
import type { MasterAdminSocialSchoolTarget } from './MasterAdminSocialSchoolPicker';

type Props = {
  target: MasterAdminSocialSchoolTarget;
  accountId?: string;
  initial?: MasterAdminSocialAccount;
  onSaved: () => void;
  onCancel: () => void;
  onAddMorePlatforms?: () => void;
};

export function MasterAdminSocialAccountForm({
  target,
  accountId,
  initial,
  onSaved,
  onCancel,
  onAddMorePlatforms,
}: Props) {
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.master } as CSSProperties;
  const isEdit = Boolean(accountId);

  const [platformId, setPlatformId] = useState(initial?.platformId ?? SOCIAL_PLATFORMS[0]?.id ?? 'facebook');
  const [pageName, setPageName] = useState(initial?.pageName ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setPlatformId(initial.platformId);
    setPageName(initial.pageName);
    setLink(initial.link);
  }, [initial]);

  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId) ?? SOCIAL_PLATFORMS[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pageName.trim() || !link.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && accountId) {
        await masterAdminSocialAccountsService.update(accountId, {
          schoolId: target.schoolId,
          pageName: pageName.trim(),
          link: link.trim(),
          icon: platform.icon,
        });
      } else {
        await masterAdminSocialAccountsService.create({
          schoolId: target.schoolId,
          platformId: platform.id,
          platformName: platform.name,
          pageName: pageName.trim(),
          icon: platform.icon,
          link: link.trim(),
        });
      }
      onSaved();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(typeof msg === 'string' ? msg : 'Could not save social account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel" style={panelStyle}>
      <div className="admin-panel__body" style={{ maxWidth: '32rem' }}>
        {error ? <p className="admin-form-hint admin-form-hint--error">{error}</p> : null}
        <form onSubmit={handleSubmit}>
          {!isEdit ? (
            <div className="mb-3">
              <label className="admin-form-label" htmlFor="ma-social-platform">
                Platform
              </label>
              <select
                id="ma-social-platform"
                className="form-select admin-form-control"
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <p className="admin-form-hint mb-2">
                This screen edits <strong>one</strong> platform:{' '}
                <strong>{initial?.platformName ?? platform.name}</strong>.
              </p>
              {onAddMorePlatforms ? (
                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={onAddMorePlatforms}>
                  <i className="bi bi-plus-lg me-1" aria-hidden />
                  Add more platforms (Instagram, TikTok, …)
                </button>
              ) : null}
            </div>
          )}
          <div className="mb-3">
            <label className="admin-form-label" htmlFor="ma-social-page-name">
              Page / club name
            </label>
            <input
              id="ma-social-page-name"
              className="form-control admin-form-control"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="mb-3">
            <label className="admin-form-label" htmlFor="ma-social-link">
              Link
            </label>
            <input
              id="ma-social-link"
              type="url"
              className="form-control admin-form-control"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              required
              placeholder="https://"
            />
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save account'}
            </button>
            </div>
        </form>
      </div>
    </section>
  );
}
