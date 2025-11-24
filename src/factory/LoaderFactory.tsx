import React from 'react';

type LoaderType = 'inline' | 'fullscreen';
type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  type?: LoaderType;
  size?: LoaderSize;
  message?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Spinner: React.FC<{ size: LoaderSize }> = ({ size }) => (
  <svg
    className={`animate-spin text-primary-600 ${sizeClasses[size]}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const LoaderFactory: React.FC<LoaderProps> = ({
  type = 'inline',
  size = 'md',
  message,
}) => {
  if (type === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={size} />
          {message && (
            <p className="text-gray-600 text-sm font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Spinner size={size} />
      {message && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
};
