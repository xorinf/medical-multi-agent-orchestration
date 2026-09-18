import React from 'react';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex gap-1 border-b border-charcoal-200/70 dark:border-charcoal-800 ${className}`} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px
            ${activeTab === tab.id
              ? 'border-charcoal-900 dark:border-ivory-100 text-charcoal-900 dark:text-ivory-100'
              : 'border-transparent text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:border-charcoal-300 dark:hover:border-charcoal-600'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id
                ? 'bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-900'
                : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
