import type { ReactNode } from 'react';
import type { EventActionButton } from '../types/event-post';

const TEXT_DARK = '#1a1f2e';
const TEXT_MUTED = '#6c757d';

export const GOOGLE_CALENDAR_BUTTON_LABEL = 'Add to Google Calendar';
export const APPLE_CALENDAR_BUTTON_LABEL = 'Add to Apple Calendar';

export type EventDetailsFormValues = {
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventLocation: string;
};

type Props = {
  details: EventDetailsFormValues;
  onDetailsChange: (patch: Partial<EventDetailsFormValues>) => void;
  actionButtons: EventActionButton[];
  onActionButtonsChange: (buttons: EventActionButton[]) => void;
  /** When set, render only event fields or action buttons (for multi-section layouts). */
  part?: 'all' | 'event' | 'actions';
  /** Use admin portal form classes instead of Bootstrap grid columns. */
  layout?: 'grid' | 'stacked';
};

let actionButtonIdSeq = 0;
function newRow(label = '', url = ''): EventActionButton {
  actionButtonIdSeq += 1;
  return { id: `action-btn-${actionButtonIdSeq}`, label, url };
}

export function EventPostDetailFields({
  details,
  onDetailsChange,
  actionButtons,
  onActionButtonsChange,
  part = 'all',
  layout = 'grid',
}: Props) {
  const addCustom = () => {
    onActionButtonsChange([...actionButtons, newRow()]);
  };

  const addPreset = (label: string) => {
    if (actionButtons.some((b) => b.label === label)) return;
    onActionButtonsChange([...actionButtons, newRow(label, '')]);
  };

  const updateAt = (index: number, patch: Partial<EventActionButton>) => {
    onActionButtonsChange(
      actionButtons.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    );
  };

  const removeAt = (index: number) => {
    onActionButtonsChange(actionButtons.filter((_, i) => i !== index));
  };

  const labelClass = layout === 'stacked' ? 'admin-form-label' : 'form-label';
  const controlClass =
    layout === 'stacked' ? 'form-control admin-form-control' : 'form-control';
  const fieldWrap = (cls: string, content: ReactNode) =>
    layout === 'stacked' ? <div className={cls}>{content}</div> : <div className={cls}>{content}</div>;

  const eventFields = (
    <>
      {part === 'all' && layout === 'grid' ? (
        <div className="col-12">
          <hr className="my-2" style={{ borderColor: '#dee2e6' }} />
          <h3 style={{ fontSize: '1.1rem', color: TEXT_DARK, marginBottom: '0.75rem' }}>Event details</h3>
        </div>
      ) : null}

      {fieldWrap(
        layout === 'stacked' ? 'admin-create-post-field-row' : 'col-md-4',
        <>
          <label className={labelClass} style={layout === 'grid' ? { color: TEXT_DARK, fontWeight: 500 } : undefined}>
            Date {layout === 'stacked' ? null : <span className="text-muted fw-normal">(optional)</span>}
          </label>
          <input
            type="date"
            className={controlClass}
            style={layout === 'grid' ? { borderRadius: 0 } : undefined}
            value={details.eventDate}
            onChange={(e) => onDetailsChange({ eventDate: e.target.value })}
          />
        </>,
      )}

      {layout === 'stacked' ? (
        fieldWrap(
          'admin-create-post-field-row',
          <>
            <label className={`${labelClass} admin-create-post-event-label`}>
              <span className="admin-create-post-event-label__group">Time</span>
              <span className="admin-create-post-event-label__field">From</span>
            </label>
            <input
              type="time"
              className={controlClass}
              value={details.eventStartTime}
              onChange={(e) => onDetailsChange({ eventStartTime: e.target.value })}
              aria-label="Start time"
            />
          </>,
        )
      ) : (
        fieldWrap(
          'col-md-4',
          <>
            <label className={labelClass} style={{ color: TEXT_DARK, fontWeight: 500 }}>
              Time <span className="text-muted fw-normal">(optional)</span>
            </label>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <input
                type="time"
                className={controlClass}
                style={{ borderRadius: 0, maxWidth: '140px' }}
                value={details.eventStartTime}
                onChange={(e) => onDetailsChange({ eventStartTime: e.target.value })}
                aria-label="Start time"
              />
              <span className="text-muted small">to</span>
              <input
                type="time"
                className={controlClass}
                style={{ borderRadius: 0, maxWidth: '140px' }}
                value={details.eventEndTime}
                onChange={(e) => onDetailsChange({ eventEndTime: e.target.value })}
                aria-label="End time"
              />
            </div>
          </>,
        )
      )}

      {layout === 'stacked' ? (
        fieldWrap(
          'admin-create-post-field-row',
          <>
            <label className={`${labelClass} admin-create-post-event-label`}>
              <span
                className="admin-create-post-event-label__group admin-create-post-event-label__group--placeholder"
                aria-hidden="true"
              >
                Time
              </span>
              <span className="admin-create-post-event-label__field">To</span>
            </label>
            <input
              type="time"
              className={controlClass}
              value={details.eventEndTime}
              onChange={(e) => onDetailsChange({ eventEndTime: e.target.value })}
              aria-label="End time"
            />
          </>,
        )
      ) : null}

      {fieldWrap(
        layout === 'stacked' ? 'admin-create-post-field-row' : 'col-md-4',
        <>
          <label className={labelClass} style={layout === 'grid' ? { color: TEXT_DARK, fontWeight: 500 } : undefined}>
            Location {layout === 'stacked' ? null : <span className="text-muted fw-normal">(optional)</span>}
          </label>
          <input
            type="text"
            className={controlClass}
            style={layout === 'grid' ? { borderRadius: 0 } : undefined}
            placeholder="e.g. Student Union Room 204"
            value={details.eventLocation}
            onChange={(e) => onDetailsChange({ eventLocation: e.target.value })}
            maxLength={500}
          />
        </>,
      )}

      {layout === 'grid' ? (
        <div className="col-12">
          <p className="small text-muted mb-0">
            Event date, time, and location are shown on the public post (separate from publish schedule).
          </p>
        </div>
      ) : (
        <p className="admin-form-hint mb-0">
          Event date, time, and location appear on the public post (separate from publish schedule).
        </p>
      )}
    </>
  );

  const actionFields = (
    <>
      {part === 'all' && layout === 'grid' ? (
        <div className="col-12 mt-2">
          <hr className="my-2" style={{ borderColor: '#dee2e6' }} />
          <h3 style={{ fontSize: '1.1rem', color: TEXT_DARK, marginBottom: '0.25rem' }}>Action buttons</h3>
        </div>
      ) : null}

      {layout === 'stacked' ? (
        <p className="admin-form-hint">
          Optional links on the post (RSVP, register, calendar, etc.). Calendar buttons need the URL from your
          provider.
        </p>
      ) : (
        <div className="col-12">
          <p style={{ color: TEXT_MUTED, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Optional links shown on the post (RSVP, register, calendar, etc.). Calendar buttons require the URL
            from your calendar provider.
          </p>
        </div>
      )}

      {actionButtons.length > 0 ? (
        <div className={`d-flex flex-column gap-2 mb-2${layout === 'stacked' ? ' admin-create-post-action-list' : ''}`}>
          {actionButtons.map((btn, index) => (
            <div
              key={btn.id}
              className={layout === 'stacked' ? 'admin-create-post-action-row' : 'row g-2 align-items-center'}
            >
              {layout === 'stacked' ? (
                <>
                  <span className="admin-create-post-action-row__drag" aria-hidden>
                    <i className="bi bi-grip-vertical" />
                  </span>
                  <input
                    type="text"
                    className="form-control admin-form-control"
                    placeholder="Button label"
                    value={btn.label}
                    onChange={(e) => updateAt(index, { label: e.target.value })}
                  />
                  <input
                    type="url"
                    className="form-control admin-form-control"
                    placeholder="https://"
                    value={btn.url}
                    onChange={(e) => updateAt(index, { url: e.target.value })}
                    required={!!btn.label.trim()}
                  />
                  <button
                    type="button"
                    className="admin-icon-btn admin-icon-btn--danger"
                    aria-label="Remove button"
                    onClick={() => removeAt(index)}
                  >
                    <i className="bi bi-trash" aria-hidden />
                  </button>
                </>
              ) : (
                <>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      style={{ borderRadius: 0 }}
                      placeholder="Button label"
                      value={btn.label}
                      onChange={(e) => updateAt(index, { label: e.target.value })}
                    />
                  </div>
                  <div className="col-md-7">
                    <input
                      type="url"
                      className="form-control form-control-sm"
                      style={{ borderRadius: 0 }}
                      placeholder={
                        btn.label === GOOGLE_CALENDAR_BUTTON_LABEL
                          ? 'https://calendar.google.com/calendar/render?action=TEMPLATE&...'
                          : btn.label === APPLE_CALENDAR_BUTTON_LABEL
                            ? 'https://... (webcal or https link to .ics)'
                            : 'https://'
                      }
                      value={btn.url}
                      onChange={(e) => updateAt(index, { url: e.target.value })}
                      required={!!btn.label.trim()}
                    />
                  </div>
                  <div className="col-md-1 text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      style={{ borderRadius: 0 }}
                      aria-label="Remove button"
                      onClick={() => removeAt(index)}
                    >
                      <i className="bi bi-trash" aria-hidden />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className={`d-flex flex-wrap gap-2${layout === 'grid' ? '' : ' align-items-center'}`}>
        <button
          type="button"
          className={layout === 'stacked' ? 'admin-btn-secondary admin-btn-sm' : 'btn btn-outline-secondary btn-sm'}
          style={layout === 'grid' ? { borderRadius: 0 } : undefined}
          onClick={addCustom}
        >
          + Add button
        </button>
        <button
          type="button"
          className={layout === 'stacked' ? 'admin-btn-secondary admin-btn-sm' : 'btn btn-outline-primary btn-sm'}
          style={layout === 'grid' ? { borderRadius: 0 } : undefined}
          onClick={() => addPreset(GOOGLE_CALENDAR_BUTTON_LABEL)}
          disabled={actionButtons.some((b) => b.label === GOOGLE_CALENDAR_BUTTON_LABEL)}
        >
          + Google Calendar
        </button>
        <button
          type="button"
          className={layout === 'stacked' ? 'admin-btn-secondary admin-btn-sm' : 'btn btn-outline-primary btn-sm'}
          style={layout === 'grid' ? { borderRadius: 0 } : undefined}
          onClick={() => addPreset(APPLE_CALENDAR_BUTTON_LABEL)}
          disabled={actionButtons.some((b) => b.label === APPLE_CALENDAR_BUTTON_LABEL)}
        >
          + Apple Calendar
        </button>
      </div>
    </>
  );

  if (part === 'event') return <>{eventFields}</>;
  if (part === 'actions') return <>{actionFields}</>;
  return (
    <>
      {eventFields}
      {layout === 'grid' ? actionFields : <div className="mt-3">{actionFields}</div>}
    </>
  );
}

export function validateActionButtons(buttons: EventActionButton[]): string | null {
  for (const b of buttons) {
    const label = b.label.trim();
    const url = b.url.trim();
    if (!label && !url) continue;
    if (!label || !url) return 'Each action button needs both a label and a URL.';
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return 'Action button URLs must start with http:// or https://';
      }
    } catch {
      return 'Enter a valid URL for each action button.';
    }
  }
  return null;
}

export function actionButtonsForApi(buttons: EventActionButton[]): { label: string; url: string }[] {
  return buttons
    .map((b) => ({ label: b.label.trim(), url: b.url.trim() }))
    .filter((b) => b.label && b.url);
}

export function parseStoredActionButtons(stored: string | null | undefined): EventActionButton[] {
  if (!stored?.trim()) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        const base = newRow('', '');
        return {
          ...base,
          label: typeof row?.label === 'string' ? row.label : '',
          url: typeof row?.url === 'string' ? row.url : '',
        };
      })
      .filter((b) => b.label || b.url);
  } catch {
    return [];
  }
}

export function eventDateToInputValue(iso: string | null | undefined): string {
  if (!iso?.trim()) return '';
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function eventTimeToInputValue(value: string | null | undefined): string {
  if (!value?.trim()) return '';
  const s = value.trim();
  return HM.test(s) ? s : '';
}
