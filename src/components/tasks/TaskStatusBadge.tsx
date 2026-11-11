import React from 'react';
import { Badge, BadgeVariant } from '@/components/common/Badge';
import { Icon } from '@iconify/react';
import { HumanTaskStatus } from '@/types/tasks';

interface TaskStatusBadgeProps {
  status: HumanTaskStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  HumanTaskStatus,
  { label: string; variant: BadgeVariant; icon: string }
> = {
  open: { label: 'Do podjęcia (Otwarte)', variant: 'primary', icon: 'mdi:tray-arrow-down' },
  claimed: { label: 'W realizacji (Podjęte)', variant: 'warning', icon: 'mdi:account-clock' },
  completed: { label: 'Zakończone', variant: 'success', icon: 'mdi:check-circle' },
  cancelled: { label: 'Anulowane', variant: 'default', icon: 'mdi:cancel' },
};

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    variant: 'default',
    icon: 'mdi:information-outline',
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={<Icon icon={config.icon} className="w-3.5 h-3.5" />}
    >
      {config.label}
    </Badge>
  );
};

export default TaskStatusBadge;
