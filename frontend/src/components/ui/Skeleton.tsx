import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 rounded-2xl p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-3 w-3/5" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-5 gap-4 px-4">
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-charcoal-100 dark:border-charcoal-800">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    ))}
  </div>
);

export const SkeletonChat: React.FC = () => (
  <div className="space-y-4 p-4">
    <div className="flex justify-end"><Skeleton className="h-12 w-2/3 rounded-2xl" /></div>
    <div className="flex justify-start"><Skeleton className="h-20 w-3/4 rounded-2xl" /></div>
    <div className="flex justify-end"><Skeleton className="h-10 w-1/2 rounded-2xl" /></div>
    <div className="flex justify-start"><Skeleton className="h-16 w-2/3 rounded-2xl" /></div>
  </div>
);
