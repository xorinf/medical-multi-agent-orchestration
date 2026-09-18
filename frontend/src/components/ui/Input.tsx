import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-charcoal-400 dark:text-charcoal-500 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-white dark:bg-charcoal-900 border rounded-xl py-2.5 px-3.5 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-600
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 dark:focus:border-sage-500
            disabled:bg-charcoal-100 dark:disabled:bg-charcoal-800 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 dark:border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-charcoal-200 dark:border-charcoal-700'}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-charcoal-400 dark:text-charcoal-500 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-charcoal-500 dark:text-charcoal-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
