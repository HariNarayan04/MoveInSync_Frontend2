import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/api/AuthService';
import { syncService } from '@/services/SyncService';
import { ButtonFactory } from '@/factory/ButtonFactory';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';
import type { LoginCredentials } from '@/types';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.login(formData);
      login(response.user);
      toast.success('Login successful!');

      // Trigger sync if user is Admin
      if (response.user.role === 'Admin') {
        syncService.triggerSyncIfAdmin().catch((error) => {
          console.error('Failed to trigger sync after login:', error);
        });
      }

      // Role-based routing
      if (response.user.role === 'Admin' || response.user.role === 'Client') {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Enter your password"
          />
        </div>

        <ButtonFactory
          type="submit"
          loading={isLoading}
          fullWidth
          size="lg"
        >
          Sign In
        </ButtonFactory>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
