import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { schoolAdminDirectChatsService } from '../services/school-admin-direct-chats.service';

const TEXT_DARK = '#1a1f2e';

export function SchoolAdminDirectMessagingPanel() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['school-admin', 'direct-chats', 'settings'],
    queryFn: schoolAdminDirectChatsService.getSettings,
  });

  const updateMutation = useMutation({
    mutationFn: (isEnabled: boolean) => schoolAdminDirectChatsService.updateSettings(isEnabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['school-admin', 'direct-chats', 'settings'] });
      setMessage({ type: 'success', text: '1:1 chat settings saved.' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save 1:1 chat settings.';
      setMessage({ type: 'error', text: typeof msg === 'string' ? msg : 'Failed to save 1:1 chat settings.' });
    },
  });

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 0 }}>
      <div className="card-body">
        <h2 className="h6 mb-2" style={{ color: TEXT_DARK }}>
          1:1 student messaging
        </h2>
        <p className="small text-muted mb-3">
          Allow students at your school to message each other directly. Subcategory admins can
          review 1:1 chats in read-only mode but cannot change this setting.
        </p>
        {message ? (
          <div
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 mb-3`}
            style={{ borderRadius: 0 }}
            role="alert"
          >
            {message.text}
          </div>
        ) : null}
        {isLoading ? (
          <p className="small text-muted mb-0">Loading settings…</p>
        ) : (
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="school-direct-messaging-enabled"
              checked={settings?.isEnabled ?? true}
              disabled={updateMutation.isPending}
              onChange={(e) => updateMutation.mutate(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="school-direct-messaging-enabled">
              {settings?.isEnabled ?? true
                ? 'Students can send 1:1 messages'
                : '1:1 messaging is off'}
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
