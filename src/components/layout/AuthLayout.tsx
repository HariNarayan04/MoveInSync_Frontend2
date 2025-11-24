import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Info Section with glassmorphism */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 p-12 items-center justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md">
          <div className="glass p-8 rounded-card-lg">
            <h1 className="text-4xl font-bold text-white mb-4">
              Floor
            </h1>
            <p className="text-lg text-white/90 mb-6">
              Simplify room booking and resource management for your organization.
            </p>
            <ul className="space-y-3">
              {[
                'Real-time availability tracking',
                'Easy booking management',
                'Smart scheduling with conflict detection',
                'Team collaboration features',
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white/90">
                  <svg
                    className="h-6 w-6 text-white flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-card-lg shadow-card p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
