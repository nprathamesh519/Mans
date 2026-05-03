import React from 'react';
import { motion } from 'framer-motion';
import { SpinnerIcon } from '../icons/Icons';

interface ButtonProps extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  leftIcon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', leftIcon, loading, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center border border-transparent font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all";

  const variantClasses = {
    primary: "text-white bg-brand-primary hover:bg-indigo-700 focus:ring-brand-primary",
    secondary: "text-brand-primary bg-indigo-100 hover:bg-indigo-200 focus:ring-brand-primary",
    danger: "text-white bg-brand-danger hover:bg-red-700 focus:ring-brand-danger",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.05, y: loading ? 0 : -2 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <SpinnerIcon />
      ) : (
        <>
          {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;