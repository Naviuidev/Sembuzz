import { useState, useEffect } from 'react';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { schoolAdminSocialAccountsService } from '../services/school-admin-social-accounts.service';
import { imageSrc } from '../utils/image';

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
};

type View = 'main' | 'link-form' | 'saved-list';
type Step = 'club-info' | 'select' | 'animating' | 'form' | 'animating-save' | 'list';
type PopupMode = 'add' | 'edit';

/** Whether the stored icon is a URL (uploaded image) */
function isIconUrl(icon: string): boolean {
  return !!icon && (icon.startsWith('http://') || icon.startsWith('https://'));
}

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
    <div className="d-flex align-items-start gap-3" style={{ minHeight: '120px' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#e7f1ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <i
          className="bi bi-hourglass-split"
          style={{ fontSize: '1.5rem', color: '#0d6efd' }}
          aria-hidden
        />
      </div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1a1f2e',
            marginBottom: '0.5rem',
            marginTop: 0,
          }}
        >
          Adding
        </h3>
        <p style={{ fontSize: '1rem', color: '#6c757d', marginBottom: 0 }}>
          Please wait…
        </p>
      </div>
    </div>
  );
}

export const SchoolAdminSocialShare = () => {
  const { user: _user } = useSchoolAdminAuth();
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="mb-4">
            <h1 style={{ fontSize: '2rem', fontWeight: 'normal', color: '#1a1f2e', marginBottom: '0.5rem' }}>
              Social Share
            </h1>
            <p style={{ color: '#6c757d', fontSize: '1rem', marginBottom: 0 }}>
              Add and manage your school&apos;s social media links.{' '}
              <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--bs-primary)' }}>
                Font Awesome
              </a>
              {' '}— find icons for your clubs here.
            </p>
          </div>

          {view === 'main' && savedAccounts.length === 0 && (
            <div className="card border-0 shadow-lg" style={{ borderRadius: '0px', maxWidth: '480px' }}>
              <div className="card-body p-4 text-center">
                <p className="text-muted mb-4">Add your school&apos;s social media accounts to share with users.</p>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill social-share-add-btn-hover"
                  style={{ backgroundColor: 'var(--bs-primary)', color: '#fff' }}
                onClick={() => {
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
                }}
                >
                  <i className="bi bi-plus-circle me-2" />
                  Add social account
                </button>
              </div>
            </div>
          )}

          {apiError && (
            <div className="alert alert-danger alert-dismissible fade show mb-4" style={{ borderRadius: '0px' }} role="alert">
              {apiError}
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setApiError(null)} />
            </div>
          )}

          {(view === 'saved-list' || savedAccounts.length > 0) && (
            <>
              <div className="card border-0 shadow-none mb-4 social-share-card" style={{ borderRadius: 0, backgroundColor: 'transparent' }}>
                <div className="card-body p-0" style={{ backgroundColor: 'transparent' }}>
                  {loading ? (
                    <p className="text-muted mb-0">Loading…</p>
                  ) : (
                    (() => {
                      const groups = savedAccounts.reduce<{ key: string; icon: string; pageName: string; accounts: SavedSocialAccount[] }[]>((acc, account) => {
                        const key = `${account.pageName}|${account.icon}`;
                        const existing = acc.find((g) => g.key === key);
                        if (existing) existing.accounts.push(account);
                        else acc.push({ key, icon: account.icon, pageName: account.pageName, accounts: [account] });
                        return acc;
                      }, []);
                      return (
                        <div className="d-flex flex-wrap social-share-gap-4">
                          {groups.map((group) => (
                            <div
                              key={group.key}
                              className="rounded-3 club-card social-share-club-card shadow-sm"
                              style={{ borderColor: '#eee', backgroundColor: 'transparent', minWidth: '280px', flex: '1 1 280px', maxWidth: '400px', paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: 0, paddingRight: 0 }}
                            >
                              <div className="d-flex align-items-center p-2 justify-content-between gap-2 mb-3">
                                <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                                  <span
                                    className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 overflow-hidden"
                                    style={{ width: 44, height: 44, backgroundColor: '#fff' }}
                                  >
                                    {isIconUrl(group.icon) ? (
                                      <img src={imageSrc(group.icon)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : group.icon.startsWith('fa-') ? (
                                      <i className={group.icon} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                                    ) : (
                                      <i className={`bi ${group.icon}`} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                                    )}
                                  </span>
                                  <span style={{ fontWeight: 600, color: '#1a1f2e', fontSize: '1.1rem' }}>
                                    {group.pageName || 'Club'}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-1 flex-shrink-0 club-actions">
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-1 text-secondary"
                                    style={{ minWidth: 32, minHeight: 32 }}
                                    title="Edit club (name & icon)"
                                    onClick={() => openEditClub(group)}
                                  >
                                    <i className="bi bi-pencil" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm p-1 text-danger"
                                    style={{ minWidth: 32, minHeight: 32 }}
                                    title="Delete club and all its links"
                                    onClick={() => setDeleteClubGroupKey(group.key)}
                                  >
                                    <i className="bi bi-trash" />
                                  </button>
                                </div>
                              </div>
                              <div className="d-flex flex-wrap p-2 gap-2">
                                {group.accounts.map((acc) => {
                                  const iconColor = PLATFORM_COLORS[acc.platformId] ?? '#1a1f2e';
                                  return (
                                    <div
                                      key={acc.id}
                                      className="social-account-card d-flex align-items-center gap-2 rounded-3 position-relative"
                                      style={{
                                        padding: '0.35rem 0.5rem',
                                        minWidth: 'auto',
                                        borderColor: 'rgb(238, 238, 238)',
                                        backgroundColor: 'rgb(255, 255, 255)',
                                        transition: 'box-shadow 0.2s, border-color 0.2s',
                                        boxShadow: 'none',
                                      }}
                                    >
                                      <a
                                        href={acc.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="d-flex align-items-center justify-content-center rounded-2 text-decoration-none flex-shrink-0"
                                        style={{ width: 36, height: 36, backgroundColor: `${iconColor}18`, color: iconColor }}
                                        title={acc.platformName}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <i className={`bi ${ALL_PLATFORMS.find((p) => p.id === acc.platformId)?.icon ?? 'bi-link'}`} style={{ fontSize: '1.1rem' }} />
                                      </a>
                                      <div className="social-account-actions d-flex align-items-center gap-1 flex-shrink-0">
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-1 text-secondary"
                                          style={{ minWidth: 28, minHeight: 28 }}
                                          title="Edit"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            openEditPopup(acc);
                                          }}
                                        >
                                          <i className="bi bi-pencil" />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-1 text-danger"
                                          style={{ minWidth: 28, minHeight: 28 }}
                                          title="Delete"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(acc.id);
                                          }}
                                        >
                                          <i className="bi bi-trash" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-2 p-2">
                                <button
                                  type="button"
                                  className="btn rounded-pill social-share-add-btn-hover"
                                  style={{ backgroundColor: '#28a745', color: '#fff', border: 'none' }}
                                  onClick={() => openAddToClub(group)}
                                  title="Add another social link to this club"
                                >
                                  <i className="bi bi-plus-lg me-2" />
                                  Add More social links
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                  <style>{`
                    .social-share-card .social-share-gap-4 { gap: 0.5rem !important; padding-left: 0 !important; }
                    .social-share-card .social-share-club-card { padding-left: 0 !important; padding-right: 0 !important; }
                    .social-account-card .social-account-actions { opacity: 1; }
                    .club-card .club-actions { opacity: 1; }
                    .social-share-add-btn-hover { transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, border-width 0.2s ease; border: 1px solid transparent !important; }
                    .social-share-add-btn-hover:hover { background-color: #fff !important; color: #000 !important; border-color: #dee2e6 !important; }
                  `}</style>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary rounded-pill social-share-add-btn-hover"
                style={{ backgroundColor: 'var(--bs-primary)', color: '#fff' }}
                onClick={() => {
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
                }}
              >
                <i className="bi bi-plus-circle me-2" />
                Add social account
              </button>
            </>
          )}

          {/* Popup: Select platforms */}
          {popupOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="social-share-title"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: '1rem',
              }}
              onClick={() => {
                if (step === 'select' || step === 'club-info') setPopupOpen(false);
              }}
            >
              <div
                className="card border-0 shadow"
                style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflow: 'hidden', borderRadius: '12px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  {step === 'animating' && (
                    <AddingPopup onComplete={handleAnimatingDone} durationMs={2000} />
                  )}
                  {step === 'animating-save' && (
                    <AddingPopup onComplete={handleAnimatingSaveDone} durationMs={2000} />
                  )}
                  {step === 'club-info' && (
                    <>
                      <h2 id="social-share-title" className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                        Add social account
                      </h2>
                      <p className="text-muted small mb-3">
                        Enter the club name and upload an icon. Download the icon from{' '}
                        <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">Font Awesome</a> and upload it here.
                      </p>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontWeight: 500, color: '#1a1f2e' }}>
                          Name of the club
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Sports Club, Chess Club"
                          value={clubName}
                          onChange={(e) => setClubName(e.target.value)}
                          style={{ borderRadius: '8px' }}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label" style={{ fontWeight: 500, color: '#1a1f2e' }}>
                          Club icon (download from <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">Font Awesome</a> and upload)
                        </label>
                        <input
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
                              const msg =
                                err && typeof err === 'object' && 'response' in err
                                  ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                                  : null;
                              setApiError(typeof msg === 'string' ? msg : 'Failed to upload icon. Try again.');
                            } finally {
                              setClubIconUploading(false);
                              e.target.value = '';
                            }
                          }}
                          style={{ borderRadius: '8px' }}
                        />
                        {clubIconUploading && <small className="text-muted">Uploading…</small>}
                        {clubIconUrl && !clubIconUploading && (
                          <div className="mt-2 d-flex align-items-center gap-2">
                            <span className="text-muted small">Preview:</span>
                            <img
                              src={clubIconUrl}
                              alt="Club icon"
                              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '8px', border: '1px solid #dee2e6' }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setPopupOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
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
                      <h2 id="social-share-title" className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                        Add social account
                      </h2>
                      {popupMode === 'add' && clubName.trim() && (
                        <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                          <span
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 overflow-hidden"
                            style={{ width: 40, height: 40, backgroundColor: '#fff', color: '#1a1f2e' }}
                          >
                            {isIconUrl(clubIconUrl) ? (
                              <img src={imageSrc(clubIconUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : clubIconUrl?.startsWith('fa-') ? (
                              <i className={clubIconUrl} style={{ fontSize: '1.25rem' }} />
                            ) : clubIconUrl ? (
                              <i className={`bi ${clubIconUrl}`} style={{ fontSize: '1.25rem' }} />
                            ) : (
                              <i className="bi bi-image" style={{ fontSize: '1.25rem' }} />
                            )}
                          </span>
                          <span style={{ fontWeight: 500, color: '#1a1f2e' }}>{clubName.trim()}</span>
                        </div>
                      )}
                      <input
                        type="search"
                        className="form-control mb-3"
                        placeholder="Search social networks…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ borderRadius: '8px' }}
                      />
                      <div className="d-flex flex-wrap gap-2 mb-4" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filteredPlatforms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="d-flex align-items-center gap-2 rounded-3 border text-decoration-none"
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderColor: selectedIds.has(p.id) ? 'var(--bs-success)' : '#dee2e6',
                              backgroundColor: selectedIds.has(p.id) ? 'var(--bs-success)' : '#fff',
                              color: selectedIds.has(p.id) ? '#fff' : '#1a1f2e',
                            }}
                            onClick={() => togglePlatform(p.id)}
                          >
                            <i className={`bi ${p.icon}`} style={{ fontSize: '1.25rem' }} />
                            <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setPopupOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
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
                      <h2 className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                        {popupMode === 'edit' ? 'Edit page name & link' : 'Add links for each platform'}
                      </h2>
                      {popupMode === 'add' && (
                        <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-2" style={{ backgroundColor: '#f8f9fa' }}>
                          <span
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 overflow-hidden"
                            style={{ width: 40, height: 40, backgroundColor: '#fff', color: '#1a1f2e' }}
                          >
                            {isIconUrl(clubIconUrl) ? (
                              <img src={imageSrc(clubIconUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : clubIconUrl?.startsWith('fa-') ? (
                              <i className={clubIconUrl} style={{ fontSize: '1.25rem' }} />
                            ) : clubIconUrl ? (
                              <i className={`bi ${clubIconUrl}`} style={{ fontSize: '1.25rem' }} />
                            ) : (
                              <i className="bi bi-image" style={{ fontSize: '1.25rem' }} />
                            )}
                          </span>
                          <span style={{ fontWeight: 500, color: '#1a1f2e' }}>{clubName.trim()}</span>
                        </div>
                      )}
                      <p className="text-muted small mb-3">
                        {popupMode === 'edit'
                          ? 'Update the club/page name and link, then Save.'
                          : 'Enter the link for each selected platform. Click Update for each row, then Save.'}
                      </p>
                      <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {selectedPlatforms.map((p) => {
                          const data = formData[p.id] ?? { pageName: '', link: '' };
                          const isUpdated = updatedRows.has(p.id);
                          const canUpdate = popupMode === 'add' ? !!data.link.trim() : !!data.pageName.trim() && !!data.link.trim();
                          const iconColor = PLATFORM_COLORS[p.id] ?? '#1a1f2e';
                          return (
                            <div key={p.id} className="d-flex flex-wrap align-items-center gap-2">
                              <div
                                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                                style={{ width: 44, height: 44, backgroundColor: `${iconColor}18`, color: iconColor }}
                              >
                                <i className={`bi ${p.icon}`} style={{ fontSize: '1.25rem' }} />
                              </div>
                              {popupMode === 'edit' && (
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
                                  style={{ flex: '1 1 140px', minWidth: '140px', borderRadius: '8px' }}
                                />
                              )}
                              <input
                                type="url"
                                className="form-control"
                                placeholder={popupMode === 'add' ? `${p.name} link` : `${p.name} link`}
                                value={data.link}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [p.id]: { ...(prev[p.id] ?? { pageName: clubName, link: '' }), link: e.target.value },
                                  }))
                                }
                                style={{ flex: '1 1 160px', minWidth: '160px', borderRadius: '8px' }}
                              />
                              {popupMode === 'add' && (
                                <button
                                  type="button"
                                  className="btn btn-outline-success btn-sm flex-shrink-0"
                                  disabled={!canUpdate}
                                  onClick={() => handleUpdateRow(p.id)}
                                  title={isUpdated ? 'Updated' : 'Update this row'}
                                >
                                  {isUpdated ? (
                                    <i className="bi bi-check-circle-fill text-success" />
                                  ) : (
                                    'Update'
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        {popupMode === 'edit' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
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
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={!canSave}
                              onClick={handleSaveEdit}
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setStep('select');
                                setFormData({});
                                setUpdatedRows(new Set());
                              }}
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={!canSave}
                              onClick={handleSaveFromForm}
                            >
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
          )}
        </div>
      </div>

      {/* Edit club modal — change club name and icon */}
      {editingClubKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-club-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1055,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '1rem',
          }}
          onClick={() => setEditingClubKey(null)}
        >
          <div
            className="card border-0 shadow"
            style={{ maxWidth: '420px', width: '100%', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h2 id="edit-club-title" className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                Edit club
              </h2>
              <p className="text-muted small mb-3">Change the club name or upload a new icon.</p>
              <div className="mb-3">
                <label className="form-label" style={{ fontWeight: 500, color: '#1a1f2e' }}>
                  Club name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chess Club"
                  value={editingClubName}
                  onChange={(e) => setEditingClubName(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </div>
              <div className="mb-4">
                <label className="form-label" style={{ fontWeight: 500, color: '#1a1f2e' }}>
                  Club icon
                </label>
                <input
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
                      const msg =
                        err && typeof err === 'object' && 'response' in err
                          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                          : null;
                      setApiError(typeof msg === 'string' ? msg : 'Failed to upload icon.');
                    } finally {
                      setEditingClubIconUploading(false);
                      e.target.value = '';
                    }
                  }}
                  style={{ borderRadius: '8px' }}
                />
                {editingClubIconUploading && <small className="text-muted">Uploading…</small>}
                {editingClubIcon.trim() && (
                  <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                    <span className="text-muted small">Preview:</span>
                    {isIconUrl(editingClubIcon) ? (
                      <img
                        src={imageSrc(editingClubIcon)}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: '8px', border: '1px solid #dee2e6' }}
                      />
                    ) : (
                      <span
                        className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden"
                        style={{ width: 40, height: 40, backgroundColor: '#fff' }}
                      >
                        {editingClubIcon.startsWith('fa-') ? (
                          <i className={editingClubIcon} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                        ) : (
                          <i className={`bi ${editingClubIcon}`} style={{ fontSize: '1.25rem', color: '#1a1f2e' }} />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
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
                  className="btn btn-primary"
                  disabled={!editingClubName.trim()}
                  onClick={saveEditClub}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete club confirmation */}
      {deleteClubGroupKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-club-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '1rem',
          }}
          onClick={() => setDeleteClubGroupKey(null)}
        >
          <div
            className="card border-0 shadow"
            style={{ maxWidth: '400px', width: '100%', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h2 id="delete-club-title" className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                Delete this club?
              </h2>
              <p className="text-muted small mb-4">
                This will remove the club and all its social media links. This action cannot be undone.
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteClubGroupKey(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteClub}>
                  Delete club
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation — custom popup (same white card style as add/edit popup) */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '1rem',
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="card border-0 shadow"
            style={{ maxWidth: '400px', width: '100%', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4">
              <h2 id="delete-confirm-title" className="mb-3" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1f2e' }}>
                Remove this social account?
              </h2>
              <p className="text-muted small mb-4">This action cannot be undone.</p>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmDelete}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
