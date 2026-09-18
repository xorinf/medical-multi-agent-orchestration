import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="mb-5 text-charcoal-300 dark:text-charcoal-600">
        {icon || <Inbox className="w-14 h-14 stroke-[1.2]" />}
      </div>
      <h3 className="text-lg font-semibold text-charcoal-800 dark:text-ivory-200 mb-1.5">{title}</h3>
      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, onRetry, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-5">
        <span className="text-2xl">⚠</span>
      </div>
      <h3 className="text-lg font-semibold text-charcoal-800 dark:text-ivory-200 mb-1.5">{title}</h3>
      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 max-w-sm mb-6">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
    </div>
  );
};
