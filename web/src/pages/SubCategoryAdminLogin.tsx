import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubCategoryAdminAuth } from '../contexts/SubCategoryAdminAuthContext';
import { AdminLoginShell } from '../components/AdminLoginShell';

export const SubCategoryAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useSubCategoryAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/subcategory-admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/subcategory-admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="subcategory"
      subtitle="Sign in to publish and review news for your subcategory."
      error={error}
      loading={loading}
      identifierLabel="Email"
      identifierType="email"
      identifierId="subcategory-admin-email"
      identifierValue={email}
      onIdentifierChange={setEmail}
      identifierPlaceholder="Enter your email"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
      forgotPasswordHref="/subcategory-admin/forgot-password"
    />
  );
};
