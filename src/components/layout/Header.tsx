import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/api/AuthService';
import { toast } from '@/factory/ToastFactory';
import { formatErrorForDisplay } from '@/errors/errorHandler';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { email, role, logout: logoutStore } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
      logoutStore();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-soft sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo/Home */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
            >
              Dashboard
            </button>
          </div>

          {/* Right - Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/my-bookings')}
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              My Bookings
            </button>

            {/* Admin-only: Floors Management */}
            {role === 'Admin' && (
              <button
                onClick={() => navigate('/floors')}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Floors
              </button>
            )}

            {/* User menu */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-sm text-gray-600">{email}</div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
