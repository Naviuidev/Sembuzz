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

  return (
    <>
      <div className="col-12">
        <hr className="my-2" style={{ borderColor: '#dee2e6' }} />
        <h3 style={{ fontSize: '1.1rem', color: TEXT_DARK, marginBottom: '0.75rem' }}>Event details</h3>
      </div>

      <div className="col-md-4">
        <label className="form-label" style={{ color: TEXT_DARK, fontWeight: 500 }}>
          Date <span className="text-muted fw-normal">(optional)</span>
        </label>
        <input
          type="date"
          className="form-control"
          style={{ borderRadius: 0 }}
          value={details.eventDate}
          onChange={(e) => onDetailsChange({ eventDate: e.target.value })}
        />
      </div>

      <div className="col-md-4">
        <label className="form-label" style={{ color: TEXT_DARK, fontWeight: 500 }}>
          Time <span className="text-muted fw-normal">(optional)</span>
        </label>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input
            type="time"
            className="form-control"
            style={{ borderRadius: 0, maxWidth: '140px' }}
            value={details.eventStartTime}
            onChange={(e) => onDetailsChange({ eventStartTime: e.target.value })}
            aria-label="Start time"
          />
          <span className="text-muted small">to</span>
          <input
            type="time"
            className="form-control"
            style={{ borderRadius: 0, maxWidth: '140px' }}
            value={details.eventEndTime}
            onChange={(e) => onDetailsChange({ eventEndTime: e.target.value })}
            aria-label="End time"
          />
        </div>
      </div>

      <div className="col-md-4">
        <label className="form-label" style={{ color: TEXT_DARK, fontWeight: 500 }}>
          Location <span className="text-muted fw-normal">(optional)</span>
        </label>
        <input
          type="text"
          className="form-control"
          style={{ borderRadius: 0 }}
          placeholder="e.g. Student Union Room 204"
          value={details.eventLocation}
          onChange={(e) => onDetailsChange({ eventLocation: e.target.value })}
          maxLength={500}
        />
      </div>

      <div className="col-12">
        <p className="small text-muted mb-0">
          Event date, time, and location are shown on the public post (separate from publish schedule).
        </p>
      </div>

      <div className="col-12 mt-2">
        <hr className="my-2" style={{ borderColor: '#dee2e6' }} />
        <h3 style={{ fontSize: '1.1rem', color: TEXT_DARK, marginBottom: '0.25rem' }}>Action buttons</h3>
        <p style={{ color: TEXT_MUTED, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          Optional links shown on the post (RSVP, register, calendar, etc.). Calendar buttons require the URL from
          your calendar provider.
        </p>

        {actionButtons.length > 0 ? (
          <div className="d-flex flex-column gap-2 mb-2">
            {actionButtons.map((btn, index) => (
              <div key={btn.id} className="row g-2 align-items-center">
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
              </div>
            ))}
          </div>
        ) : null}

        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 0 }} onClick={addCustom}>
            + Add button
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            style={{ borderRadius: 0 }}
            onClick={() => addPreset(GOOGLE_CALENDAR_BUTTON_LABEL)}
            disabled={actionButtons.some((b) => b.label === GOOGLE_CALENDAR_BUTTON_LABEL)}
          >
            + Google Calendar
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            style={{ borderRadius: 0 }}
            onClick={() => addPreset(APPLE_CALENDAR_BUTTON_LABEL)}
            disabled={actionButtons.some((b) => b.label === APPLE_CALENDAR_BUTTON_LABEL)}
          >
            + Apple Calendar
          </button>
        </div>
      </div>
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
