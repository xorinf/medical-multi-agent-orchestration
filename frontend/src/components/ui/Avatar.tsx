import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

const colors = [
  'bg-sage-200 text-sage-800 dark:bg-sage-800 dark:text-sage-200',
  'bg-cream-200 text-cream-400 dark:bg-cream-800 dark:text-cream-300',
  'bg-charcoal-200 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-200',
  'bg-ivory-300 text-charcoal-700 dark:bg-charcoal-600 dark:text-ivory-100',
];

function getInitials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src, className = '' }) => {
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }[size];
  const colorClass = colors[hashName(name) % colors.length];

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-semibold shrink-0 select-none ${className}`} aria-label={name} title={name}>
      {getInitials(name)}
    </div>
  );
};
