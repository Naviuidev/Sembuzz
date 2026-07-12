/** Normalize Nest/axios error payloads for UI display. */
export function getApiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
    code?: string;
  };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK') {
    return 'Cannot reach the API. Start the backend (port 3000) and check VITE_API_URL in web/.env.local.';
  }
  if (typeof e?.message === 'string' && e.message.trim()) return e.message;
  return fallback;
}
