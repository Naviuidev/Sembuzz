import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLoginShell } from '../components/AdminLoginShell';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';
import { getApiErrorMessage } from '../utils/apiError';

export const ExternalAdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useExternalAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/external-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.isFirstLogin) {
        navigate('/external-admin/set-password', { replace: true });
      } else {
        navigate('/external-admin/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="external"
      subtitle="Sign in with your reference number or email to manage your external categories."
      error={error}
      loading={loading}
      identifierLabel="Email or user ID"
      identifierId="external-admin-identifier"
      identifierValue={identifier}
      onIdentifierChange={setIdentifier}
      identifierPlaceholder="Email or reference number (EX-...)"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
    />
  );
};
