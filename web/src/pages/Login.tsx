import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLoginShell } from '../components/AdminLoginShell';

export const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/super-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      setTimeout(() => {
        navigate('/super-admin/dashboard', { replace: true });
      }, 300);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="super"
      subtitle="Sign in with your super admin credentials to continue."
      error={error}
      loading={loading}
      identifierLabel="Email or user ID"
      identifierType="email"
      identifierId="super-admin-email"
      identifierValue={email}
      onIdentifierChange={setEmail}
      identifierPlaceholder="you@company.com"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
      footer={
        <a href="/events">← Back to public site</a>
      }
    />
  );
};
