import React from 'react';
import { Icon } from '@iconify/react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Ładowanie danych...',
  className = '',
  size = 'md',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-slate-500 ${className}`}>
      <Icon
        icon="mdi:loading"
        className={`${sizeMap[size]} animate-spin text-blue-600 mb-2`}
      />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
