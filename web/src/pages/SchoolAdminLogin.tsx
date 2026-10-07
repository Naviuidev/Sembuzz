import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolAdminAuth } from '../contexts/SchoolAdminAuthContext';
import { AdminLoginShell } from '../components/AdminLoginShell';
import { getApiErrorMessage } from '../utils/apiError';

export const SchoolAdminLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useSchoolAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/school-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/school-admin/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="school"
      subtitle="Manage your school portal, categories, and student experience."
      error={error}
      loading={loading}
      identifierLabel="Email or user ID"
      identifierId="school-admin-identifier"
      identifierValue={identifier}
      onIdentifierChange={setIdentifier}
      identifierPlaceholder="Email id or user id"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
      forgotPasswordHref="/school-admin/forgot-password"
    />
  );
};
