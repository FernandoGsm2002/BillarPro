import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  variant?: 'modern' | 'glass' | 'gradient';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'modern',
  hover = true,
  className,
  onClick,
  animate = true
}) => {
  const baseClasses = 'transition-all duration-300';
  
  const variantClasses = {
    modern: 'card-modern',
    glass: 'card-glass',
    gradient: 'card-gradient'
  };

  const CardComponent = animate ? motion.div : 'div';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <CardComponent
      {...motionProps}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        hover && 'hover-lift cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </CardComponent>
  );
};

export default Card; 