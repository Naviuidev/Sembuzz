import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { SchoolAdminLayout } from '../components/SchoolAdminLayout';
import { ADMIN_PORTAL_ACCENTS } from '../constants/adminPortalTheme';
import { schoolAdminSocialAccountsService } from '../services/school-admin-social-accounts.service';
import { getApiErrorMessage } from '../utils/apiError';
import { imageSrc, isImageIconValue } from '../utils/image';

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
}

const ALL_PLATFORMS: SocialPlatform[] = [
  { id: 'facebook', name: 'Facebook', icon: 'bi-facebook' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'bi-linkedin' },
  { id: 'youtube', name: 'YouTube', icon: 'bi-youtube' },
  { id: 'google', name: 'Google', icon: 'bi-google' },
  { id: 'instagram', name: 'Instagram', icon: 'bi-instagram' },
  { id: 'x', name: 'X (Twitter)', icon: 'bi-twitter-x' },
  { id: 'tiktok', name: 'TikTok', icon: 'bi-tiktok' },
  { id: 'pinterest', name: 'Pinterest', icon: 'bi-pinterest' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'bi-whatsapp' },
  { id: 'telegram', name: 'Telegram', icon: 'bi-telegram' },
  { id: 'reddit', name: 'Reddit', icon: 'bi-reddit' },
  { id: 'snapchat', name: 'Snapchat', icon: 'bi-snapchat' },
  { id: 'linktree', name: 'Linktree', icon: 'bi-link-45deg' },
  { id: 'weebly', name: 'Weebly', icon: 'bi-columns-gap' },
];

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  google: '#4285F4',
  instagram: '#E4405F',
  x: '#000000',
  tiktok: '#000000',
  pinterest: '#BD081C',
  whatsapp: '#25D366',
  telegram: '#26A5E4',
  reddit: '#FF4500',
  snapchat: '#FFFC00',
  linktree: '#43E660',
  weebly: '#1cb0a1',
};

type View = 'main' | 'link-form' | 'saved-list';
type Step = 'club-info' | 'select' | 'animating' | 'form' | 'animating-save' | 'list';
type PopupMode = 'add' | 'edit';

export interface SavedSocialAccount {
  id: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
}

/** Custom "Adding" popup — same style as Success popup (icon + title + message), no letter animation */
function AddingPopup({ onComplete, durationMs = 2000 }: { onComplete: () => void; durationMs?: number }) {
  useEffect(() => {
    const t = setTimeout(onComplete, durationMs);
    return () => clearTimeout(t);
  }, [onComplete, durationMs]);

  return (
    <div className="admin-social-adding">
      <div className="admin-social-adding__icon" aria-hidden>
        <i className="bi bi-hourglass-split" />
      </div>
      <div>
        <h3 className="admin-panel__title mb-2">Adding</h3>
        <p className="admin-form-hint mb-0">Please wait…</p>
      </div>
    </div>
  );
}

function platformIcon(platformId: string): string {
  return ALL_PLATFORMS.find((p) => p.id === platformId)?.icon ?? 'bi-link';
}

function SocialAddWizardSteps({ step }: { step: Step }) {
  const activeIndex = step === 'club-info' ? 0 : step === 'select' ? 1 : step === 'form' ? 2 : 0;
  const labels = ['Club details', 'Platforms', 'Links'];

  return (
    <ol className="admin-social-wizard" aria-label="Add social account progress">
      {labels.map((label, index) => (
        <li
          key={label}
          className={`admin-social-wizard__step${index < activeIndex ? ' is-done' : ''}${index === activeIndex ? ' is-current' : ''}`}
        >
          <span className="admin-social-wizard__num">{index + 1}</span>
          <span className="admin-social-wizard__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function ClubIconMark({ icon, size = 44, large }: { icon: string; size?: number; large?: boolean }) {
  return (
    <span
      className={`admin-social-club-icon${large ? ' admin-social-club-icon--lg' : ''}`}
      style={large ? undefined : { width: size, height: size }}
    >
      {isImageIconValue(icon) ? (
        <img src={imageSrc(icon)} alt="" />
      ) : icon.startsWith('fa-') ? (
        <i className={icon} style={{ fontSize: '1.25rem', color: '#0f172a' }} aria-hidden />
      ) : (
        <i className={`bi ${icon}`} style={{ fontSize: '1.25rem', color: '#0f172a' }} aria-hidden />
      )}
    </span>
  );
}

export const SchoolAdminSocialShare = () => {
  const [savedAccounts, setSavedAccounts] = useState<SavedSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMode, setPopupMode] = useState<PopupMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>('select');
  const [clubName, setClubName] = useState('');
  const [clubIconUrl, setClubIconUrl] = useState('');
  const [clubIconUploading, setClubIconUploading] = useState(false);
  const [formData, setFormData] = useState<Record<string, { pageName: string; link: string }>>({});
  const [updatedRows, setUpdatedRows] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>('main');
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingClubKey, setEditingClubKey] = useState<string | null>(null);
  const [editingClubName, setEditingClubName] = useState('');
  const [editingClubIcon, setEditingClubIcon] = useState('');
  const [editingClubIconUploading, setEditingClubIconUploading] = useState(false);
  const [deleteClubGroupKey, setDeleteClubGroupKey] = useState<string | null>(null);
  const [clubFilter, setClubFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    schoolAdminSocialAccountsService
      .list()
      .then((list) => {
        if (!cancelled) {
          setSavedAccounts(
            list.map((a) => ({
              id: a.id,
              platformId: a.platformId,
              platformName: a.platformName,
              pageName: a.pageName,
              icon: a.icon,
              link: a.link,
            })),
          );
          if (list.length > 0) setView('saved-list');
        }
      })
      .catch(() => {
        if (!cancelled) setSavedAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlatforms = ALL_PLATFORMS.filter(
    (p) => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const togglePlatform = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNextFromClubInfo = () => {
    setStep('select');
  };

  const handleNextFromSelect = () => {
    const initial: Record<string, { pageName: string; link: string }> = {};
    selectedIds.forEach((id) => {
      initial[id] =
        popupMode === 'add'
          ? { pageName: clubName, link: formData[id]?.link ?? '' }
          : formData[id] ?? { pageName: '', link: '' };
    });
    setFormData(initial);
    setUpdatedRows(new Set());
    setStep('animating');
  };

  const handleAnimatingDone = () => setStep('form');

  const handleUpdateRow = (platformId: string) => {
    const data = formData[platformId];
    if (popupMode === 'add') {
      if (!data?.link.trim()) return;
    } else {
      if (!data?.pageName.trim() || !data?.link.trim()) return;
    }
    setUpdatedRows((prev) => new Set(prev).add(platformId));
  };

  const canSave =
    popupMode === 'edit'
      ? (() => {
          const id = Array.from(selectedIds)[0];
          return id && !!formData[id]?.pageName.trim() && !!formData[id]?.link.trim();
        })()
      : selectedIds.size > 0 &&
        Array.from(selectedIds).every(
          (id) => formData[id]?.link.trim() && updatedRows.has(id)
        );

  const handleSaveFromForm = () => {
    if (!canSave) return;
    setStep('animating-save');
  };

  const handleAnimatingSaveDone = () => {
    if (popupMode === 'add') {
      const platformMap = ALL_PLATFORMS.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, SocialPlatform>);
      const iconValue = clubIconUrl || '';
      const accounts = Array.from(selectedIds).map((id) => ({
        platformId: id,
        platformName: platformMap[id]?.name ?? id,
        pageName: clubName.trim(),
        icon: iconValue,
        link: (formData[id]?.link ?? '').trim(),
      }));
      schoolAdminSocialAccountsService
        .createBulk(accounts)
        .then((created) => {
          setSavedAccounts((prev) => [
            ...prev,
            ...created.map((a) => ({
              id: a.id,
              platformId: a.platformId,
              platformName: a.platformName,
              pageName: a.pageName,
              icon: a.icon,
              link: a.link,
            })),
          ]);
          setView('saved-list');
          setApiError(null);
        })
        .catch((err) => {
          setApiError(err?.response?.data?.message || 'Failed to save. Ensure the database migration has been run.');
        })
        .finally(() => {
          setStep('select');
          setPopupOpen(false);
          setSelectedIds(new Set());
          setFormData({});
          setUpdatedRows(new Set());
          setClubName('');
          setClubIconUrl('');
        });
    } else {
      setStep('select');
      setPopupOpen(false);
      setEditingId(null);
      setFormData({});
      setUpdatedRows(new Set());
    }
  };

  const openEditPopup = (acc: SavedSocialAccount) => {
    setEditingId(acc.id);
    setPopupMode('edit');
    setPopupOpen(true);
    setStep('form');
    setSelectedIds(new Set([acc.platformId]));
    setFormData({ [acc.platformId]: { pageName: acc.pageName, link: acc.link } });
    setUpdatedRows(new Set([acc.platformId]));
  };

  const handleSaveEdit = () => {
    if (!editingId || selectedIds.size === 0) return;
    const id = Array.from(selectedIds)[0];
    const data = formData[id];
    if (!data?.pageName.trim() || !data?.link.trim()) return;
    schoolAdminSocialAccountsService
      .update(editingId, { pageName: data.pageName.trim(), link: data.link.trim() })
      .then((updated) => {
        setSavedAccounts((prev) =>
          prev.map((a) => (a.id === editingId ? { ...a, pageName: updated.pageName, link: updated.link } : a)),
        );
        setPopupOpen(false);
        setEditingId(null);
        setStep('select');
        setFormData({});
        setUpdatedRows(new Set());
        setApiError(null);
      })
      .catch((err) => {
        setApiError(err?.response?.data?.message || 'Failed to update. Ensure the database migration has been run.');
      });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    schoolAdminSocialAccountsService.delete(id).then(() => {
      setSavedAccounts((prev) => prev.filter((a) => a.id !== id));
    }).catch(() => {});
  };

  const openEditClub = (group: { key: string; pageName: string; icon: string }) => {
    setEditingClubKey(group.key);
    setEditingClubName(group.pageName);
    setEditingClubIcon(group.icon);
  };

  const saveEditClub = () => {
    if (!editingClubKey || !editingClubName.trim()) return;
    const groups = savedAccounts.reduce<{ key: string; icon: string; pageName: string; accounts: SavedSocialAccount[] }[]>((acc, account) => {
      const key = `${account.pageName}|${account.icon}`;
      const existing = acc.find((g) => g.key === key);
      if (existing) existing.accounts.push(account);
      else acc.push({ key, icon: account.icon, pageName: account.pageName, accounts: [account] });
      return acc;
    }, []);
    const group = groups.find((g) => g.key === editingClubKey);
    if (!group) return;
    const newName = editingClubName.trim();
    const newIcon = editingClubIcon || group.icon;
    Promise.all(
      group.accounts.map((acc) =>
        schoolAdminSocialAccountsService.update(acc.id, { pageName: newName, icon: newIcon }),
      ),
    )
      .then(() => {
        setSavedAccounts((prev) =>
          prev.map((a) => {
            if (group.accounts.some((acc) => acc.id === a.id)) {
              return { ...a, pageName: newName, icon: newIcon };
            }
            return a;
          }),
        );
        setEditingClubKey(null);
        setEditingClubName('');
        setEditingClubIcon('');
        setApiError(null);
      })
      .catch((err) => {
        setApiError(err?.response?.data?.message || 'Failed to update club.');
      });
  };

  const confirmDeleteClub = () => {
    if (!deleteClubGroupKey) return;
    const groups = savedAccounts.reduce<{ key: string; accounts: SavedSocialAccount[] }[]>((acc, account) => {
      const key = `${account.pageName}|${account.icon}`;
      const existing = acc.find((g) => g.key === key);
      if (existing) existing.accounts.push(account);
      else acc.push({ key, accounts: [account] });
      return acc;
    }, []);
    const group = groups.find((g) => g.key === deleteClubGroupKey);
    if (!group) return;
    Promise.all(group.accounts.map((acc) => schoolAdminSocialAccountsService.delete(acc.id)))
      .then(() => {
        setSavedAccounts((prev) => prev.filter((a) => !group.accounts.some((acc) => acc.id === a.id)));
        setDeleteClubGroupKey(null);
      })
      .catch(() => setApiError('Failed to delete club.'));
  };

  const openAddToClub = (group: { pageName: string; icon: string }) => {
    setClubName(group.pageName);
    setClubIconUrl(group.icon);
    setPopupOpen(true);
    setPopupMode('add');
    setStep('select');
    setSelectedIds(new Set());
    setFormData({});
    setUpdatedRows(new Set());
    setApiError(null);
  };

  const selectedPlatforms = ALL_PLATFORMS.filter((p) => selectedIds.has(p.id));
  const panelStyle = { '--admin-accent': ADMIN_PORTAL_ACCENTS.school } as CSSProperties;

  const startAddSocialAccount = () => {
    setView('main');
    setPopupOpen(true);
    setPopupMode('add');
    setEditingId(null);
    setStep('club-info');
    setClubName('');
    setClubIconUrl('');
    setSelectedIds(new Set());
    setSearchQuery('');
    setFormData({});
    setUpdatedRows(new Set());
    setApiError(null);
  };

  const clubGroups = savedAccounts.reduce<
    { key: string; icon: string; pageName: string; accounts: SavedSocialAccount[] }[]
  >((acc, account) => {
    const key = `${account.pageName}|${account.icon}`;
    const existing = acc.find((g) => g.key === key);
    if (existing) existing.accounts.push(account);
    else acc.push({ key, icon: account.icon, pageName: account.pageName, accounts: [account] });
    return acc;
  }, []);

  const filteredClubGroups = useMemo(() => {
    const q = clubFilter.trim().toLowerCase();
    if (!q) return clubGroups;
    return clubGroups.filter(
      (g) =>
        g.pageName.toLowerCase().includes(q) ||
        g.accounts.some((a) => a.platformName.toLowerCase().includes(q)),
    );
  }, [clubGroups, clubFilter]);

  const totalLinks = savedAccounts.length;
  const totalClubs = clubGroups.length;
  const platformCount = useMemo(() => new Set(savedAccounts.map((a) => a.platformId)).size, [savedAccounts]);

  return (
    <SchoolAdminLayout>
      <header className="admin-page-header" style={panelStyle}>
        <h1 className="admin-page-title">Social share</h1>
        <p className="admin-page-subtitle">
          Group clubs and social links students see on your school experience. Icons from{' '}
          <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">
            Font Awesome
          </a>
          .
        </p>
      </header>

      {apiError ? (
        <div className="admin-notice d-flex justify-content-between align-items-start gap-2 mb-4">
          <p className="admin-form-hint admin-form-hint--error mb-0">{apiError}</p>
          <button type="button" className="admin-modal__close" aria-label="Dismiss" onClick={() => setApiError(null)}>
            <i className="bi bi-x-lg" aria-hidden />
          </button>
        </div>
      ) : null}

      {!loading && savedAccounts.length > 0 ? (
        <div className="admin-social-stats" style={panelStyle}>
          <div className="admin-social-stat">
            <span className="admin-social-stat__icon" aria-hidden>
              <i className="bi bi-people" />
            </span>
            <div>
              <p className="admin-social-stat__value">{totalClubs}</p>
              <p className="admin-social-stat__label">Clubs</p>
            </div>
          </div>
          <div className="admin-social-stat">
            <span className="admin-social-stat__icon" aria-hidden>
              <i className="bi bi-link-45deg" />
            </span>
            <div>
              <p className="admin-social-stat__value">{totalLinks}</p>
              <p className="admin-social-stat__label">Social links</p>
            </div>
          </div>
          <div className="admin-social-stat">
            <span className="admin-social-stat__icon" aria-hidden>
              <i className="bi bi-grid" />
            </span>
            <div>
              <p className="admin-social-stat__value">{platformCount}</p>
              <p className="admin-social-stat__label">Platforms used</p>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && view === 'main' && savedAccounts.length === 0 ? (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__body">
            <div className="admin-social-empty-hero">
              <div className="admin-social-empty-hero__orbit" aria-hidden>
                <span>
                  <i className="bi bi-facebook" />
                </span>
                <span>
                  <i className="bi bi-instagram" />
                </span>
                <span>
                  <i className="bi bi-linkedin" />
                </span>
                <span className="admin-social-empty-hero__orbit-core">
                  <i className="bi bi-share" />
                </span>
              </div>
              <h2 className="admin-social-empty-hero__title">Connect your clubs to social</h2>
              <p className="admin-form-hint mb-4">
                Create a club (sports, arts, etc.), pick platforms, and paste profile links—students tap through from
                the app.
              </p>
              <ol className="admin-social-empty-steps">
                <li>
                  <span className="admin-social-empty-steps__num">1</span>
                  <span>
                    <strong>Name &amp; icon</strong> — upload a club logo from Font Awesome.
                  </span>
                </li>
                <li>
                  <span className="admin-social-empty-steps__num">2</span>
                  <span>
                    <strong>Choose networks</strong> — Facebook, Instagram, LinkedIn, and more.
                  </span>
                </li>
                <li>
                  <span className="admin-social-empty-steps__num">3</span>
                  <span>
                    <strong>Add URLs</strong> — one link per platform, then publish.
                  </span>
                </li>
              </ol>
              <button type="button" className="admin-btn-primary" onClick={startAddSocialAccount}>
                <i className="bi bi-plus-circle me-2" aria-hidden />
                Create your first club
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {(view === 'saved-list' || savedAccounts.length > 0) && (
        <section className="admin-panel" style={panelStyle}>
          <div className="admin-panel__header">
            <h2 className="admin-panel__title">Your clubs</h2>
            <button type="button" className="admin-btn-primary" onClick={startAddSocialAccount}>
              <i className="bi bi-plus-circle me-2" aria-hidden />
              New club
            </button>
          </div>
          <div className="admin-panel__body">
            {loading ? (
              <div className="admin-loading-state">Loading…</div>
            ) : (
              <>
                <div className="admin-social-toolbar">
                  <div className="admin-search-wrap">
                    <i className="bi bi-search admin-search-icon" aria-hidden />
                    <input
                      type="search"
                      className="form-control admin-search-input"
                      placeholder="Search clubs or platforms…"
                      value={clubFilter}
                      onChange={(e) => setClubFilter(e.target.value)}
                    />
                  </div>
                  <span className="admin-form-hint mb-0">
                    {filteredClubGroups.length} of {totalClubs} clubs
                  </span>
                </div>
                {filteredClubGroups.length === 0 ? (
                  <div className="admin-empty-state">
                    <p className="mb-0">No clubs match your search.</p>
                  </div>
                ) : (
                  <div className="admin-social-clubs">
                    {filteredClubGroups.map((group) => (
                      <article key={group.key} className="admin-social-club-card">
                        <div className="admin-social-club-card__inner">
                          <div className="admin-social-club-card__head">
                            <div className="admin-social-club-card__identity">
                              <ClubIconMark icon={group.icon} large />
                              <div>
                                <h3 className="admin-social-club-card__title">{group.pageName || 'Club'}</h3>
                                <p className="admin-social-club-card__meta">
                                  {group.accounts.length} link{group.accounts.length === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                            <div className="admin-social-club-card__actions">
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--edit"
                                title="Edit club (name & icon)"
                                aria-label="Edit club"
                                onClick={() => openEditClub(group)}
                              >
                                <i className="bi bi-pencil" aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--danger"
                                title="Delete club and all its links"
                                aria-label="Delete club"
                                onClick={() => setDeleteClubGroupKey(group.key)}
                              >
                                <i className="bi bi-trash" aria-hidden />
                              </button>
                            </div>
                          </div>
                          <ul className="admin-social-link-list">
                            {group.accounts.map((acc) => {
                              const iconColor = PLATFORM_COLORS[acc.platformId] ?? '#0f172a';
                              return (
                                <li key={acc.id} className="admin-social-link-item">
                                  <a
                                    href={acc.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin-social-link-item__main"
                                    title={`Open ${acc.platformName}`}
                                  >
                                    <span
                                      className="admin-social-link-item__icon"
                                      style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
                                    >
                                      <i className={`bi ${platformIcon(acc.platformId)}`} aria-hidden />
                                    </span>
                                    <span className="admin-social-link-item__text">
                                      <span className="admin-social-link-item__name">{acc.platformName}</span>
                                      <span className="admin-social-link-item__url">{acc.link}</span>
                                    </span>
                                  </a>
                                  <div className="admin-social-link-item__actions">
                                    <button
                                      type="button"
                                      className="admin-icon-btn admin-icon-btn--edit"
                                      title="Edit link"
                                      aria-label="Edit link"
                                      onClick={() => openEditPopup(acc)}
                                    >
                                      <i className="bi bi-pencil" aria-hidden />
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-icon-btn admin-icon-btn--danger"
                                      title="Delete link"
                                      aria-label="Delete link"
                                      onClick={() => handleDelete(acc.id)}
                                    >
                                      <i className="bi bi-trash" aria-hidden />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="admin-social-club-card__add">
                            <button
                              type="button"
                              className="admin-btn-secondary"
                              onClick={() => openAddToClub(group)}
                            >
                              <i className="bi bi-plus-lg me-2" aria-hidden />
                              Add platform to this club
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {popupOpen ? (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => {
            if (step === 'select' || step === 'club-info') setPopupOpen(false);
          }}
        >
          <div
            className="admin-modal admin-form"
            style={panelStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-share-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              {popupMode === 'add' && step !== 'animating' && step !== 'animating-save' ? (
                <SocialAddWizardSteps step={step} />
              ) : null}
                  {step === 'animating' && (
                    <AddingPopup onComplete={handleAnimatingDone} durationMs={2000} />
                  )}
                  {step === 'animating-save' && (
                    <AddingPopup onComplete={handleAnimatingSaveDone} durationMs={2000} />
                  )}
                  {step === 'club-info' && (
                    <>
                      <h2 id="social-share-title" className="admin-modal__title mb-2">
                        Add social account
                      </h2>
                      <p className="admin-form-hint mb-3">
                        Enter the club name and upload an icon. Download the icon from{' '}
                        <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">Font Awesome</a> and upload it here.
                      </p>
                      <div className="mb-3">
                        <label className="admin-form-label" htmlFor="social-club-name">
                          Name of the club
                        </label>
                        <input
                          id="social-club-name"
                          type="text"
                          className="form-control"
                          placeholder="e.g. Sports Club, Chess Club"
                          value={clubName}
                          onChange={(e) => setClubName(e.target.value)}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="admin-form-label" htmlFor="social-club-icon">
                          Club icon (download from <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">Font Awesome</a> and upload)
                        </label>
                        <input
                          id="social-club-icon"
                          type="file"
                          className="form-control"
                          accept="image/*"
                          disabled={clubIconUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setClubIconUploading(true);
                            try {
                              const { url } = await schoolAdminSocialAccountsService.uploadIcon(file);
                              setClubIconUrl(url);
                            } catch (err: unknown) {
                              setApiError(getApiErrorMessage(err, 'Failed to upload icon. Try again.'));
                            } finally {
                              setClubIconUploading(false);
                              e.target.value = '';
                            }
                          }}
                        />
                        {clubIconUploading ? <span className="admin-form-hint">Uploading…</span> : null}
                        {clubIconUrl && !clubIconUploading && (
                          <div className="mt-2 d-flex align-items-center gap-2">
                            <span className="text-muted small">Preview:</span>
                            <img
                              src={imageSrc(clubIconUrl)}
                              alt="Club icon"
                              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '8px', border: '1px solid #dee2e6' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="admin-modal__footer">
                        <button type="button" className="admin-btn-secondary" onClick={() => setPopupOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={!clubName.trim() || !clubIconUrl}
                          onClick={handleNextFromClubInfo}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                  {step === 'select' && (
                    <>
                      <h2 id="social-share-title" className="admin-modal__title mb-2">
                        Add social account
                      </h2>
                      {popupMode === 'add' && clubName.trim() ? (
                        <div className="admin-social-club-preview">
                          <ClubIconMark icon={clubIconUrl || 'bi-image'} size={40} />
                          <span className="admin-detail-value">{clubName.trim()}</span>
                        </div>
                      ) : null}
                      <div className="admin-search-wrap mb-3">
                        <i className="bi bi-search admin-search-icon" aria-hidden />
                        <input
                          type="search"
                          className="form-control admin-search-input"
                          placeholder="Search social networks…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="admin-social-platform-grid">
                        {filteredPlatforms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`admin-social-platform-btn${selectedIds.has(p.id) ? ' is-selected' : ''}`}
                            onClick={() => togglePlatform(p.id)}
                          >
                            <i className={`bi ${p.icon}`} aria-hidden />
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="admin-modal__footer">
                        <button type="button" className="admin-btn-secondary" onClick={() => setPopupOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={selectedIds.size === 0}
                          onClick={handleNextFromSelect}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                  {step === 'form' && (
                    <>
                      <h2 className="admin-modal__title mb-2">
                        {popupMode === 'edit' ? 'Edit page name & link' : 'Add links for each platform'}
                      </h2>
                      {popupMode === 'add' && clubName.trim() ? (
                        <div className="admin-social-club-preview">
                          <ClubIconMark icon={clubIconUrl || 'bi-image'} size={40} />
                          <span className="admin-detail-value">{clubName.trim()}</span>
                        </div>
                      ) : null}
                      <p className="admin-form-hint mb-3">
                        {popupMode === 'edit'
                          ? 'Update the club/page name and link, then Save.'
                          : 'Enter the link for each selected platform. Click Update for each row, then Save.'}
                      </p>
                      <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {selectedPlatforms.map((p) => {
                          const data = formData[p.id] ?? { pageName: '', link: '' };
                          const isUpdated = updatedRows.has(p.id);
                          const canUpdate =
                            popupMode === 'add' ? !!data.link.trim() : !!data.pageName.trim() && !!data.link.trim();
                          const iconColor = PLATFORM_COLORS[p.id] ?? '#0f172a';
                          return (
                            <div key={p.id} className="admin-social-form-row">
                              <div
                                className="admin-social-link-item__icon flex-shrink-0"
                                style={{ width: 44, height: 44, backgroundColor: `${iconColor}18`, color: iconColor }}
                              >
                                <i className={`bi ${p.icon}`} aria-hidden />
                              </div>
                              {popupMode === 'edit' ? (
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Page name (e.g. Sports Club)"
                                  value={data.pageName}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      [p.id]: { ...(prev[p.id] ?? { pageName: '', link: '' }), pageName: e.target.value },
                                    }))
                                  }
                                />
                              ) : null}
                              <input
                                type="url"
                                className="form-control"
                                placeholder={`${p.name} link`}
                                value={data.link}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [p.id]: { ...(prev[p.id] ?? { pageName: clubName, link: '' }), link: e.target.value },
                                  }))
                                }
                              />
                              {popupMode === 'add' ? (
                                <button
                                  type="button"
                                  className="admin-btn-secondary flex-shrink-0"
                                  disabled={!canUpdate}
                                  onClick={() => handleUpdateRow(p.id)}
                                  title={isUpdated ? 'Updated' : 'Update this row'}
                                >
                                  {isUpdated ? <i className="bi bi-check-circle-fill text-success" aria-hidden /> : 'Update'}
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className="admin-modal__footer">
                        {popupMode === 'edit' ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn-secondary"
                              onClick={() => {
                                setPopupOpen(false);
                                setEditingId(null);
                                setStep('select');
                                setFormData({});
                                setUpdatedRows(new Set());
                              }}
                            >
                              Cancel
                            </button>
                            <button type="button" className="admin-btn-primary" disabled={!canSave} onClick={handleSaveEdit}>
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-btn-secondary"
                              onClick={() => {
                                setStep('select');
                                setFormData({});
                                setUpdatedRows(new Set());
                              }}
                            >
                              Back
                            </button>
                            <button type="button" className="admin-btn-primary" disabled={!canSave} onClick={handleSaveFromForm}>
                              Save
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
            </div>
          </div>
        </div>
      ) : null}

      {editingClubKey ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setEditingClubKey(null)}>
          <div
            className="admin-modal admin-form"
            style={panelStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-club-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h2 id="edit-club-title" className="admin-modal__title mb-2">
                Edit club
              </h2>
              <p className="admin-form-hint mb-3">Change the club name or upload a new icon.</p>
              <div className="mb-3">
                <label className="admin-form-label" htmlFor="edit-club-name">
                  Club name
                </label>
                <input
                  id="edit-club-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chess Club"
                  value={editingClubName}
                  onChange={(e) => setEditingClubName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="admin-form-label" htmlFor="edit-club-icon-file">
                  Club icon
                </label>
                <input
                  id="edit-club-icon-file"
                  type="file"
                  className="form-control"
                  accept="image/*"
                  disabled={editingClubIconUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setEditingClubIconUploading(true);
                    try {
                      const { url } = await schoolAdminSocialAccountsService.uploadIcon(file);
                      setEditingClubIcon(url);
                    } catch (err: unknown) {
                      setApiError(getApiErrorMessage(err, 'Failed to upload icon.'));
                    } finally {
                      setEditingClubIconUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                {editingClubIconUploading ? <span className="admin-form-hint">Uploading…</span> : null}
                {editingClubIcon.trim() ? (
                  <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                    <span className="admin-form-hint mb-0">Preview:</span>
                    <ClubIconMark icon={editingClubIcon} size={40} />
                  </div>
                ) : null}
              </div>
              <div className="admin-modal__footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => {
                    setEditingClubKey(null);
                    setEditingClubName('');
                    setEditingClubIcon('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={!editingClubName.trim()}
                  onClick={saveEditClub}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteClubGroupKey ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setDeleteClubGroupKey(null)}>
          <div
            className="admin-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-club-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h2 id="delete-club-title" className="admin-modal__title mb-2">
                Delete this club?
              </h2>
              <p className="admin-modal__text mb-4">
                This will remove the club and all its social media links. This action cannot be undone.
              </p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setDeleteClubGroupKey(null)}>
                  Cancel
                </button>
                <button type="button" className="admin-btn-danger" onClick={confirmDeleteClub}>
                  Delete club
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmId ? (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setDeleteConfirmId(null)}>
          <div
            className="admin-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__body">
              <h2 id="delete-confirm-title" className="admin-modal__title mb-2">
                Remove this social account?
              </h2>
              <p className="admin-modal__text mb-4">This action cannot be undone.</p>
              <div className="admin-modal__footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
                <button type="button" className="admin-btn-danger" onClick={confirmDelete}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SchoolAdminLayout>
  );
};
