import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'sage' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-charcoal-900 dark:bg-ivory-100 text-ivory-50 dark:text-charcoal-950 hover:bg-charcoal-800 dark:hover:bg-white shadow-soft focus-visible:outline-charcoal-900',
    sage: 'bg-sage-700 dark:bg-sage-600 text-white hover:bg-sage-800 dark:hover:bg-sage-500 shadow-soft focus-visible:outline-sage-600',
    outline: 'border border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-ivory-100 hover:bg-charcoal-100/50 dark:hover:bg-charcoal-800/50 focus-visible:outline-charcoal-400',
    ghost: 'text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100/60 dark:hover:bg-charcoal-800/60 focus-visible:outline-charcoal-400',
    danger: 'bg-red-700 dark:bg-red-600 text-white hover:bg-red-800 dark:hover:bg-red-500 shadow-soft focus-visible:outline-red-600',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
