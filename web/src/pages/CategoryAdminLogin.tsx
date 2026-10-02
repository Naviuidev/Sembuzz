import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryAdminAuth } from '../contexts/CategoryAdminAuthContext';
import { AdminLoginShell } from '../components/AdminLoginShell';

export const CategoryAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useCategoryAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      await new Promise((r) => setTimeout(r, 0));
      navigate('/category-admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setError(ax.response?.data?.message || ax.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <AdminLoginShell
      variant="category"
      subtitle="Sign in to manage approvals and subcategories for your category."
      error={error}
      loading={loading}
      identifierLabel="Email"
      identifierType="email"
      identifierId="category-admin-email"
      identifierValue={email}
      onIdentifierChange={setEmail}
      identifierPlaceholder="Enter your email"
      password={password}
      onPasswordChange={setPassword}
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onSubmit={handleSubmit}
      forgotPasswordHref="/category-admin/forgot-password"
    />
  );
};
