import React, { ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'mdi:folder-open-outline',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon icon={icon} className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
