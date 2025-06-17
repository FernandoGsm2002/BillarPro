import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className,
  animate = false
}) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    primary: 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 ring-1 ring-indigo-600/20'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const BadgeComponent = animate ? motion.span : 'span';
  const motionProps = animate ? {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  } : {};

  return (
    <BadgeComponent
      {...motionProps}
      className={clsx(
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </BadgeComponent>
  );
};

export default Badge; 