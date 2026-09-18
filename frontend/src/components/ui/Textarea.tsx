import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`
          w-full bg-white dark:bg-charcoal-900 border rounded-xl p-3 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-600
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 dark:focus:border-sage-500
          disabled:bg-charcoal-100 dark:disabled:bg-charcoal-800 disabled:cursor-not-allowed resize-y
          ${error ? 'border-red-500 dark:border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-charcoal-200 dark:border-charcoal-700'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
