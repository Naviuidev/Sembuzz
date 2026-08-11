import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { imageSrc, isImageIconValue } from '../utils/image';
import { StatusPopup } from './StatusPopup';
import {
  subCategoryAdminClubGroupChatRequestsService,
  type SubCategoryAdminClubOption,
} from '../services/subcategory-admin-club-group-chat-requests.service';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

function ClubIcon({ icon, name }: { icon: string; name: string }) {
  if (isImageIconValue(icon) || icon.startsWith('http') || icon.startsWith('/')) {
    return (
      <img
        src={imageSrc(icon)}
        alt={name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        backgroundColor: 'rgba(26,31,46,0.1)',
        color: TEXT_DARK,
        fontWeight: 600,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function statusBadge(status: string) {
  if (status === 'approved') {
    return <span className="badge bg-success">Approved</span>;
  }
  if (status === 'declined') {
    return <span className="badge bg-danger">Declined</span>;
  }
  return <span className="badge bg-warning text-dark">Pending</span>;
}

function resetRequestForm(
  setSearch: (v: string) => void,
  setSelectedClub: (v: SubCategoryAdminClubOption | null) => void,
  setGroupChatIcon: (v: string) => void,
  setNote: (v: string) => void,
  setError: (v: string | null) => void,
) {
  setSearch('');
  setSelectedClub(null);
  setGroupChatIcon('');
  setNote('');
  setError(null);
}

export function SubCategoryAdminMessageConfigPanel() {
  const queryClient = useQueryClient();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<SubCategoryAdminClubOption | null>(null);
  const [groupChatIcon, setGroupChatIcon] = useState('');
  const [iconUploading, setIconUploading] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [popupShow, setPopupShow] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['subcategory-admin', 'club-group-chat-requests', 'clubs'],
    queryFn: subCategoryAdminClubGroupChatRequestsService.listClubs,
    enabled: requestModalOpen,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['subcategory-admin', 'club-group-chat-requests'],
    queryFn: subCategoryAdminClubGroupChatRequestsService.listMine,
  });

  const createMutation = useMutation({
    mutationFn: subCategoryAdminClubGroupChatRequestsService.create,
    onSuccess: () => {
      setPopupMessage('Request sent to category and school admins for approval.');
      setPopupShow(true);
      setError(null);
      resetRequestForm(setSearch, setSelectedClub, setGroupChatIcon, setNote, setError);
      setRequestModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['subcategory-admin', 'club-group-chat-requests'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send request.';
      setError(typeof msg === 'string' ? msg : 'Could not send request.');
    },
  });

  const filteredClubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter((c) => c.pageName.toLowerCase().includes(q));
  }, [clubs, search]);

  const closeModal = () => {
    setRequestModalOpen(false);
    resetRequestForm(setSearch, setSelectedClub, setGroupChatIcon, setNote, setError);
  };

  const openModal = () => {
    resetRequestForm(setSearch, setSelectedClub, setGroupChatIcon, setNote, setError);
    setRequestModalOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedClub) {
      setError('Select a club to request a group chat.');
      return;
    }
    if (selectedClub.hasGroupChat) {
      setError('This club already has a group chat.');
      return;
    }
    if (selectedClub.hasPendingRequest) {
      setError('A request for this club is already pending.');
      return;
    }
    if (!groupChatIcon.trim()) {
      setError('Upload a group chat icon before sending the request.');
      return;
    }
    createMutation.mutate({
      clubKey: selectedClub.key,
      pageName: selectedClub.pageName,
      clubIcon: selectedClub.icon,
      groupChatIcon: groupChatIcon.trim(),
      note: note.trim() || undefined,
    });
  };

  return (
    <div>
      <p style={{ color: TEXT_MUTED, marginBottom: '1.25rem' }}>
        Choose a club created under Social Share and send a group chat setup request to your category and school admins.
      </p>

      <button type="button" className="btn-rounded-dark mb-4" onClick={openModal}>
        Request group chat config
      </button>

      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body">
          <h2 className="h5 mb-3" style={{ color: TEXT_DARK }}>
            Your requested chat creations
          </h2>
          {requestsLoading ? (
            <p className="text-muted mb-0">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-muted mb-0">No requests yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Club</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ClubIcon icon={row.icon} name={row.pageName} />
                          <span>{row.pageName}</span>
                        </div>
                      </td>
                      <td>
                        {statusBadge(row.status)}
                        {row.status === 'declined' && row.declineReason ? (
                          <div className="small text-danger mt-1">{row.declineReason}</div>
                        ) : null}
                      </td>
                      <td className="small text-muted">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="small text-muted">{row.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {requestModalOpen ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1050 }}
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-chat-request-title"
            className="bg-white shadow"
            style={{
              width: 'min(520px, 92vw)',
              maxHeight: '88vh',
              overflowY: 'auto',
              borderRadius: 25,
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 id="group-chat-request-title" className="h5 mb-1" style={{ color: TEXT_DARK }}>
                  Request group chat
                </h2>
                <p className="small text-muted mb-0">
                  Select a club and send the request for admin approval.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeModal}
              />
            </div>

            {error ? <div className="alert alert-danger py-2">{error}</div> : null}

            <input
              type="search"
              className="form-control mb-3"
              placeholder="Search clubs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {clubsLoading ? (
              <p className="text-muted mb-3">Loading clubs…</p>
            ) : filteredClubs.length === 0 ? (
              <p className="text-muted mb-3">
                No clubs found. Ask your school admin to add clubs under Social Share.
              </p>
            ) : (
              <div className="list-group mb-3" style={{ maxHeight: 240, overflow: 'auto' }}>
                {filteredClubs.map((club) => {
                  const disabled = club.hasGroupChat || club.hasPendingRequest;
                  const selected = selectedClub?.key === club.key;
                  return (
                    <button
                      key={club.key}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${selected ? 'active' : ''}`}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedClub(club);
                        setGroupChatIcon('');
                        setError(null);
                      }}
                    >
                      <ClubIcon icon={club.icon} name={club.pageName} />
                      <div className="text-start flex-grow-1">
                        <div className="fw-semibold">{club.pageName}</div>
                        <div className="small opacity-75">
                          {club.socialLinkCount} social link{club.socialLinkCount === 1 ? '' : 's'}
                          {club.hasGroupChat ? ' · Group chat live' : ''}
                          {club.hasPendingRequest ? ' · Request pending' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedClub ? (
              <div className="mb-4 p-3 border rounded-3">
                <label className="form-label small fw-semibold mb-2" style={{ color: TEXT_DARK }}>
                  Group chat icon
                </label>
                <p className="small text-muted mb-2">
                  Upload a separate icon for this group chat. It can differ from the club&apos;s Social Share icon.
                </p>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <ClubIcon
                    icon={groupChatIcon || selectedClub.icon}
                    name={selectedClub.pageName}
                  />
                  <div className="small text-muted">
                    {groupChatIcon ? 'Custom group chat icon' : 'Club icon (upload to replace)'}
                  </div>
                </div>
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={iconUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIconUploading(true);
                    setError(null);
                    try {
                      const { url } =
                        await subCategoryAdminClubGroupChatRequestsService.uploadGroupChatIcon(file);
                      setGroupChatIcon(url);
                    } catch (err: unknown) {
                      const msg =
                        (err as { response?: { data?: { message?: string } } })?.response?.data
                          ?.message || 'Failed to upload icon.';
                      setError(typeof msg === 'string' ? msg : 'Failed to upload icon.');
                    } finally {
                      setIconUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
                {iconUploading ? <small className="text-muted">Uploading…</small> : null}
              </div>
            ) : null}

            <label className="form-label small text-muted">Optional note for admins</label>
            <textarea
              className="form-control mb-4"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why should this club have a group chat?"
            />

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderRadius: 50, padding: '0.5rem 1.25rem' }}
                onClick={closeModal}
                disabled={createMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-rounded-dark"
                disabled={!selectedClub || !groupChatIcon.trim() || createMutation.isPending || iconUploading}
                onClick={handleSubmit}
              >
                {createMutation.isPending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StatusPopup
        show={popupShow}
        type="success"
        message={popupMessage}
        onClose={() => setPopupShow(false)}
      />
    </div>
  );
}
