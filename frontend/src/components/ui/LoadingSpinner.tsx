import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'success' | 'danger' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    success: 'text-emerald-600',
    danger: 'text-red-600',
    white: 'text-white'
  };

  return (
    <div className={clsx(
      'inline-block border-2 border-current border-t-transparent rounded-full animate-spin',
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  );
};

export default LoadingSpinner; 