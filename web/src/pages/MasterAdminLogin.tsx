import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLoginShell } from '../components/AdminLoginShell';
import { useMasterAdminAuth } from '../contexts/MasterAdminAuthContext';
import { defaultPortalPathForUser } from '../utils/masterAdminPortalAccess';
import { getApiErrorMessage } from '../utils/apiError';

export const MasterAdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, user } = useMasterAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(
        user.isFirstLogin && user.role === 'school_master_admin'
          ? '/master-admin/set-password'
          : defaultPortalPathForUser(user),
        { replace: true },
      );
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(identifier, password);
      navigate(
        loggedIn.isFirstLogin && loggedIn.role === 'school_master_admin'
          ? '/master-admin/set-password'
          : defaultPortalPathForUser(loggedIn),
        { replace: true },
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="master"
      subtitle="Platform master: use your Sembuzz ID. School master admin: use the email from your invite."
      error={error}
      loading={loading}
      identifierLabel="User ID"
      identifierId="master-admin-identifier"
      identifierValue={identifier}
      onIdentifierChange={setIdentifier}
      identifierPlaceholder="Sembuzz or school admin email"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
      footer={<a href="/">← Back to public site</a>}
    />
  );
};
