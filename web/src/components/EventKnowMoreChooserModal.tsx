type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSource: () => void;
  onShowInApp: () => void;
};

/** “Read this post” — open source URL or full post in-app (matches mobile). */
export function EventKnowMoreChooserModal({ open, onClose, onOpenSource, onShowInApp }: Props) {
  if (!open) return null;

  return (
    <div
      className="event-know-more-chooser-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-know-more-chooser-title"
      onClick={onClose}
    >
      <div className="event-know-more-chooser-card" onClick={(e) => e.stopPropagation()}>
        <h3 id="event-know-more-chooser-title" className="event-know-more-chooser-title">
          Read this post
        </h3>
        <p className="event-know-more-chooser-subtitle">Choose how you would like to continue.</p>
        <div className="event-know-more-chooser-pill-row">
          <button type="button" className="event-know-more-chooser-pill event-know-more-chooser-pill--success" onClick={onOpenSource}>
            Open source link
          </button>
          <button type="button" className="event-know-more-chooser-pill event-know-more-chooser-pill--info" onClick={onShowInApp}>
            Show within app
          </button>
        </div>
        <button type="button" className="event-know-more-chooser-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
