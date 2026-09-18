import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'completed'
  | 'cancelled'
  | 'in_progress'
  | 'awaiting_doctor'
  | 'patient'
  | 'doctor'
  | 'admin'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  const variantStyles: Record<BadgeVariant, string> = {
    active: 'bg-sage-100 dark:bg-sage-900/60 text-sage-800 dark:text-sage-300 border border-sage-300 dark:border-sage-700',
    pending: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    suspended: 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800',
    completed: 'bg-sage-100 dark:bg-sage-900/60 text-sage-800 dark:text-sage-300 border border-sage-300 dark:border-sage-700',
    cancelled: 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-charcoal-300 dark:border-charcoal-700',
    in_progress: 'bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-300 border border-sage-400 dark:border-sage-600',
    awaiting_doctor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
    patient: 'bg-cream-100 dark:bg-cream-950/40 text-charcoal-800 dark:text-cream-200 border border-cream-300 dark:border-cream-800',
    doctor: 'bg-sage-100 dark:bg-sage-900/50 text-sage-900 dark:text-sage-200 border border-sage-400 dark:border-sage-700',
    admin: 'bg-charcoal-800 text-white border border-charcoal-900 dark:bg-charcoal-700',
    neutral: 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 border border-charcoal-200 dark:border-charcoal-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
      {children}
    </span>
  );
};
