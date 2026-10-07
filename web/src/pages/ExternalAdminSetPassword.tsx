import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminSetPasswordShell,
  AdminSetPasswordShellLoading,
} from '../components/AdminSetPasswordShell';
import { useExternalAdminAuth } from '../contexts/ExternalAdminAuthContext';

export const ExternalAdminSetPassword = () => {
  const { user, isAuthenticated, loading, changePassword } = useExternalAdminAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/external-admin/login', { replace: true });
      return;
    }
    if (!loading && isAuthenticated && user && !user.isFirstLogin) {
      navigate('/external-admin/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    setLoadingSubmit(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword, { skipLogout: true });
      navigate('/external-admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Failed to set password. Please try again.');
      setLoadingSubmit(false);
    }
  };

  if (loading || (isAuthenticated && user && !user.isFirstLogin)) {
    return <AdminSetPasswordShellLoading variant="external" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminSetPasswordShell
      variant="external"
      subtitle="Create a secure password to access your external admin dashboard."
      error={error}
      loading={loadingSubmit}
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      showCurrentPassword={showPasswords.current}
      showNewPassword={showPasswords.new}
      showConfirmPassword={showPasswords.confirm}
      onToggleCurrentPassword={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
      onToggleNewPassword={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
      onToggleConfirmPassword={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
      onSubmit={handleSubmit}
    />
  );
};
