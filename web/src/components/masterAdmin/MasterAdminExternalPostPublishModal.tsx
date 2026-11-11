import { useMutation } from '@tanstack/react-query';
import {
  masterAdminExternalConfigService,
  type ExternalContentKind,
} from '../../services/master-admin-external-config.service';
import { getApiErrorMessage } from '../../utils/apiError';

const CONTENT_KIND_OPTIONS: { id: ExternalContentKind; label: string }[] = [
  { id: 'job', label: 'Job share' },
  { id: 'offer', label: 'Offers' },
  { id: 'campaign', label: 'Campaigns' },
];

type Props = {
  postId: string;
  postTitle: string;
  schoolId: string;
  schoolName: string;
  contentKind: ExternalContentKind;
  onClose: () => void;
  onPublished: () => void;
};

export function MasterAdminExternalPostPublishModal({
  postId,
  postTitle,
  schoolId,
  schoolName,
  contentKind,
  onClose,
  onPublished,
}: Props) {
  const kindLabel = CONTENT_KIND_OPTIONS.find((o) => o.id === contentKind)?.label ?? contentKind;

  const publishMutation = useMutation({
    mutationFn: () =>
      masterAdminExternalConfigService.publishExternalPost(postId, {
        schoolId,
        contentKind,
      }),
    onSuccess: () => {
      onPublished();
      onClose();
    },
  });

  const error =
    publishMutation.error != null
      ? getApiErrorMessage(publishMutation.error, 'Could not publish this post.')
      : null;

  return (
    <div className="admin-modal-overlay admin-modal-overlay--elevated" role="presentation" onClick={onClose}>
      <div
        className="admin-modal master-admin-ext-publish-modal"
        role="dialog"
        aria-modal
        aria-labelledby="ma-ext-publish-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal__body">
          <h2 id="ma-ext-publish-title" className="admin-modal__title mb-1">
            Ready to publish
          </h2>
          <p className="admin-form-hint mb-4">
            Post: <strong>{postTitle}</strong>
          </p>
          {error ? <p className="admin-form-hint admin-form-hint--error mb-3">{error}</p> : null}

          <div className="master-admin-ext-publish-modal__fields">
            <div className="master-admin-ext-publish-modal__field">
              <label className="admin-form-label" htmlFor="ma-ext-publish-school">
                School
              </label>
              <select
                id="ma-ext-publish-school"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={schoolId}
                disabled
                aria-readonly
              >
                <option value={schoolId}>{schoolName}</option>
              </select>
            </div>
            <div className="master-admin-ext-publish-modal__field">
              <label className="admin-form-label" htmlFor="ma-ext-publish-kind">
                External type
              </label>
              <select
                id="ma-ext-publish-kind"
                className="form-select admin-form-control master-admin-posts-school-filter__select"
                value={contentKind}
                disabled
                aria-readonly
              >
                {CONTENT_KIND_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="admin-form-hint mb-0 mt-3">
            This will publish to <strong>{schoolName}</strong>&apos;s external {kindLabel} feed.
          </p>

          <div className="admin-modal__footer mt-4">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              {publishMutation.isPending ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
