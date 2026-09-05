interface PublishScheduleFieldsProps {
  publishMode: 'now' | 'schedule';
  onPublishModeChange: (mode: 'now' | 'schedule') => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  helperText?: string;
}

export function PublishScheduleFields({
  publishMode,
  onPublishModeChange,
  scheduledAt,
  onScheduledAtChange,
  helperText,
}: PublishScheduleFieldsProps) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">Publish timing</label>
      <div className="d-flex flex-column gap-2">
        <label className="d-flex align-items-center gap-2 mb-0">
          <input
            type="radio"
            name="publishMode"
            checked={publishMode === 'now'}
            onChange={() => onPublishModeChange('now')}
          />
          Publish immediately
        </label>
        <label className="d-flex align-items-center gap-2 mb-0">
          <input
            type="radio"
            name="publishMode"
            checked={publishMode === 'schedule'}
            onChange={() => onPublishModeChange('schedule')}
          />
          Schedule for later
        </label>
      </div>
      {publishMode === 'schedule' && (
        <div className="mt-2">
          <input
            type="datetime-local"
            className="form-control"
            value={scheduledAt}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => onScheduledAtChange(e.target.value)}
          />
        </div>
      )}
      {helperText && <div className="form-text">{helperText}</div>}
    </div>
  );
}
