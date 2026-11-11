import { useState } from 'react';
import { CreatePostLivePreview } from '../CreatePostLivePreview';
import { ADMIN_PORTAL_ACCENTS } from '../../constants/adminPortalTheme';
import type { ApprovedEventPublic } from '../../services/public-events.service';
import { approvedEventToCreatePostPreview } from '../../utils/eventPostPublic';

const PREVIEW_MODES = ['mobile', 'tablet', 'web'] as const;
type PreviewMode = (typeof PREVIEW_MODES)[number];

export function MasterAdminPostPreviewToggle({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}) {
  return (
    <div className="admin-create-post-preview-toggle mb-3" role="tablist" aria-label="Preview device">
      {PREVIEW_MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          className={mode === m ? 'is-active' : ''}
          onClick={() => onChange(m)}
        >
          {m === 'mobile' ? 'Mobile' : m === 'tablet' ? 'Tablet' : 'Web'}
        </button>
      ))}
    </div>
  );
}

/** Matches school admin “Web” live preview — how the post appears on sembuzz.com/events. */
export function MasterAdminPostLivePreview({ event }: { event: ApprovedEventPublic }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('web');
  const { previewMode: _ignored, ...previewProps } = approvedEventToCreatePostPreview(event);

  return (
    <>
      <MasterAdminPostPreviewToggle mode={previewMode} onChange={setPreviewMode} />
      <div className="admin-approved-posts__preview-frame master-admin-post-preview-frame">
        <CreatePostLivePreview
          {...previewProps}
          previewMode={previewMode}
          accentColor={ADMIN_PORTAL_ACCENTS.master}
        />
      </div>
    </>
  );
}
