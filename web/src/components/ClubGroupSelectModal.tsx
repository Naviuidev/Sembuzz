import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { schoolAdminSocialAccountsService } from '../services/school-admin-social-accounts.service';
import { schoolAdminClubGroupChatsService } from '../services/school-admin-club-group-chats.service';
import { groupSocialAccountsIntoClubs, type ClubGroup } from '../utils/clubGroups';
import { imageSrc, isImageIconValue } from '../utils/image';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

type ModalStep = 'select' | 'config';

interface ClubGroupSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export const ClubGroupSelectModal = ({ open, onClose }: ClubGroupSelectModalProps) => {
  const [step, setStep] = useState<ModalStep>('select');
  const [clubs, setClubs] = useState<ClubGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubKey, setSelectedClubKey] = useState<string | null>(null);
  const [enabledClubKeys, setEnabledClubKeys] = useState<Set<string>>(new Set());
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [existingConfig, setExistingConfig] = useState<{ id: string } | null>(null);

  const selectedClub = useMemo(
    () => clubs.find((c) => c.key === selectedClubKey) ?? null,
    [clubs, selectedClubKey],
  );

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((c) => c.pageName.toLowerCase().includes(q));
  }, [clubs, searchQuery]);

  useEffect(() => {
    if (!open) return;

    setStep('select');
    setSearchQuery('');
    setSelectedClubKey(null);
    setLoadError(null);
    setConfigError(null);
    setConfigSuccess(false);
    setExistingConfig(null);
    setLoading(true);

    let cancelled = false;
    Promise.all([
      schoolAdminSocialAccountsService.list(),
      schoolAdminClubGroupChatsService.list().catch(() => []),
    ])
      .then(([accounts, enabledChats]) => {
        if (cancelled) return;
        setClubs(groupSocialAccountsIntoClubs(accounts));
        setEnabledClubKeys(new Set(enabledChats.map((c) => c.clubKey)));
      })
      .catch(() => {
        if (!cancelled) {
          setClubs([]);
          setLoadError('Could not load clubs. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (step !== 'config' || !selectedClub) {
      setExistingConfig(null);
      return;
    }
    let cancelled = false;
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(false);
    schoolAdminClubGroupChatsService
      .findByClubKey(selectedClub.key)
      .then((config) => {
        if (!cancelled) setExistingConfig(config);
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, selectedClub]);

  if (!open) return null;

  function handleClose() {
    onClose();
  }

  function handleConfig() {
    if (!selectedClub) return;
    setStep('config');
  }

  async function handleEnableGroupChat() {
    if (!selectedClub) return;
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(false);
    try {
      const created = await schoolAdminClubGroupChatsService.upsert({
        clubKey: selectedClub.key,
        pageName: selectedClub.pageName,
        icon: selectedClub.icon,
      });
      setExistingConfig(created);
      setConfigSuccess(true);
      setEnabledClubKeys((prev) => new Set(prev).add(selectedClub.key));
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setConfigError(typeof msg === 'string' ? msg : 'Failed to enable group chat.');
    } finally {
      setConfigLoading(false);
    }
  }

  function handleBackToSelect() {
    setStep('select');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-group-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '1rem',
      }}
      onClick={handleClose}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          borderRadius: 0,
          minWidth: '400px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-body p-4 d-flex flex-column" style={{ minHeight: 0 }}>
          {step === 'select' ? (
            <>
              <h2
                id="club-group-modal-title"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: TEXT_DARK,
                  marginBottom: '0.5rem',
                }}
              >
                Create club group
              </h2>
              <p className="small mb-3" style={{ color: TEXT_MUTED }}>
                Select a club to set up its group message channel.
              </p>

              {!loading && clubs.length > 0 ? (
                <div className="mb-3">
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search clubs…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: 0, padding: '0.65rem 0.85rem' }}
                  />
                </div>
              ) : null}

              <div className="flex-grow-1 overflow-auto mb-3" style={{ minHeight: 120 }}>
                {loading ? (
                  <div className="d-flex align-items-center gap-2 text-muted py-4">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
                    Loading clubs…
                  </div>
                ) : loadError ? (
                  <div className="alert alert-danger border-0 mb-0" style={{ borderRadius: 0 }}>
                    {loadError}
                  </div>
                ) : clubs.length === 0 ? (
                  <div
                    className="text-center py-4 px-2"
                    style={{ color: TEXT_MUTED, border: '1px dashed #dee2e6' }}
                  >
                    <i className="bi bi-people d-block mb-2" style={{ fontSize: '1.75rem' }} aria-hidden />
                    <p className="mb-2">No clubs found yet.</p>
                    <p className="small mb-3">
                      Clubs are created when you add social accounts under Social Share.
                    </p>
                    <Link
                      to="/school-admin/social-share"
                      className="btn btn-sm"
                      style={{ backgroundColor: TEXT_DARK, color: '#fff', borderRadius: 0 }}
                      onClick={handleClose}
                    >
                      Go to Social Share
                    </Link>
                  </div>
                ) : filteredClubs.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No clubs match your search.</p>
                ) : (
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {filteredClubs.map((club) => {
                      const isSelected = selectedClubKey === club.key;
                      const hasGroupChat = enabledClubKeys.has(club.key);
                      return (
                        <li key={club.key}>
                          <button
                            type="button"
                            className="w-100 text-start border d-flex align-items-center gap-3 p-3 position-relative"
                            style={{
                              borderRadius: 0,
                              cursor: 'pointer',
                              borderColor: isSelected ? TEXT_DARK : '#dee2e6',
                              borderWidth: isSelected ? 2 : 1,
                              backgroundColor: isSelected ? 'rgba(26, 31, 46, 0.05)' : '#fff',
                              transition: 'border-color 0.15s ease, background-color 0.15s ease',
                            }}
                            onClick={() => setSelectedClubKey(club.key)}
                          >
                            <ClubIcon icon={club.icon} name={club.pageName} />
                            <div className="flex-grow-1 min-w-0">
                              <div
                                className="fw-semibold text-truncate d-flex align-items-center gap-2"
                                style={{ color: TEXT_DARK, fontSize: '1rem' }}
                              >
                                {club.pageName || 'Club'}
                                {hasGroupChat ? (
                                  <span
                                    className="badge rounded-pill"
                                    style={{
                                      backgroundColor: 'rgba(26, 31, 46, 0.1)',
                                      color: TEXT_DARK,
                                      fontSize: '0.65rem',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <i className="bi bi-chat-dots-fill me-1" aria-hidden />
                                    Group chat
                                  </span>
                                ) : null}
                              </div>
                              <div className="small text-muted">
                                {club.socialLinkCount}{' '}
                                {club.socialLinkCount === 1 ? 'social link' : 'social links'}
                              </div>
                            </div>
                            {isSelected ? (
                              <i
                                className="bi bi-check-circle-fill flex-shrink-0"
                                style={{ color: TEXT_DARK }}
                                aria-hidden
                              />
                            ) : (
                              <i
                                className="bi bi-circle flex-shrink-0 text-muted"
                                style={{ fontSize: '1.1rem' }}
                                aria-hidden
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: 0,
                    color: TEXT_DARK,
                  }}
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!selectedClub}
                  style={{
                    backgroundColor: selectedClub ? TEXT_DARK : '#adb5bd',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 0,
                  }}
                  onClick={handleConfig}
                >
                  Config
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-link p-0 mb-3 text-decoration-none d-inline-flex align-items-center gap-1"
                style={{ color: TEXT_MUTED, fontSize: '0.875rem' }}
                onClick={handleBackToSelect}
              >
                <i className="bi bi-arrow-left" aria-hidden />
                Back to club list
              </button>

              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'normal',
                  color: TEXT_DARK,
                  marginBottom: '1rem',
                }}
              >
                Configure group message
              </h2>

              {selectedClub ? (
                <div
                  className="d-flex align-items-center gap-3 p-3 mb-4"
                  style={{ border: '1px solid #dee2e6', backgroundColor: '#fafafa' }}
                >
                  <ClubIcon icon={selectedClub.icon} name={selectedClub.pageName} size={48} />
                  <div>
                    <div className="fw-semibold" style={{ color: TEXT_DARK }}>
                      {selectedClub.pageName || 'Club'}
                    </div>
                    <div className="small text-muted">Group message setup</div>
                  </div>
                </div>
              ) : null}

              <div
                className="alert alert-light border mb-4"
                style={{ borderRadius: 0, color: TEXT_MUTED, fontSize: '0.9rem' }}
              >
                {existingConfig
                  ? 'Group chat is enabled for this club. Students will see a message icon on the Events screen.'
                  : 'Enable group chat so students at your school can message in this club channel from the Events screen.'}
              </div>

              {configError ? (
                <div className="alert alert-danger border-0 mb-3" style={{ borderRadius: 0 }}>
                  {configError}
                </div>
              ) : null}
              {configSuccess ? (
                <div className="alert alert-success border-0 mb-3" style={{ borderRadius: 0 }}>
                  Group chat enabled. Students can now chat in this club from Events.
                </div>
              ) : null}

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #dee2e6',
                    borderRadius: 0,
                    color: TEXT_DARK,
                  }}
                  onClick={handleClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={configLoading}
                  style={{
                    backgroundColor: TEXT_DARK,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 0,
                  }}
                  onClick={handleEnableGroupChat}
                >
                  {configLoading
                    ? 'Please wait…'
                    : existingConfig
                      ? 'Update group chat'
                      : 'Enable group chat'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function ClubIcon({
  icon,
  name,
  size = 40,
}: {
  icon: string;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'rgba(26, 31, 46, 0.08)',
        borderRadius: 8,
      }}
    >
      {isImageIconValue(icon) ? (
        <img
          src={imageSrc(icon)}
          alt={name}
          style={{ width: size - 8, height: size - 8, objectFit: 'contain' }}
        />
      ) : (
        <i
          className={`bi ${icon || 'bi-people-fill'}`}
          style={{ fontSize: `${size * 0.45}px`, color: TEXT_DARK }}
          aria-hidden
        />
      )}
    </div>
  );
}
