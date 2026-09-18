import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full bg-white dark:bg-charcoal-900 border rounded-xl py-2.5 px-3.5 text-sm text-charcoal-900 dark:text-ivory-100
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 dark:focus:border-sage-500
          disabled:bg-charcoal-100 dark:disabled:bg-charcoal-800 disabled:cursor-not-allowed cursor-pointer
          ${error ? 'border-red-500 dark:border-red-500' : 'border-charcoal-200 dark:border-charcoal-700'}
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
