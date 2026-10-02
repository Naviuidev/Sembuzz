import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdsAdminAuth } from '../contexts/AdsAdminAuthContext';
import { AdminLoginShell } from '../components/AdminLoginShell';

export const AdsAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAdsAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ads-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.isFirstLogin) {
        navigate('/ads-admin/set-password', { replace: true });
      } else {
        navigate('/ads-admin/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="ads"
      subtitle="Manage banner and sponsored ads for your school’s feed."
      error={error}
      loading={loading}
      identifierLabel="Email"
      identifierType="email"
      identifierId="ads-admin-email"
      identifierValue={email}
      onIdentifierChange={setEmail}
      identifierPlaceholder="Enter your email"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
    />
  );
};
