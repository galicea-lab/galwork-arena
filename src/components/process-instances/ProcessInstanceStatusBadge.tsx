import React from 'react';
import { Badge, BadgeVariant } from '@/components/common/Badge';
import { Icon } from '@iconify/react';
import { ProcessInstanceStatus } from '@/types/processInstances';

interface ProcessInstanceStatusBadgeProps {
  status: ProcessInstanceStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  ProcessInstanceStatus,
  { label: string; variant: BadgeVariant; icon: string }
> = {
  running: { label: 'W trakcie (Running)', variant: 'primary', icon: 'mdi:play-circle-outline' },
  waiting: { label: 'Oczekuje (Waiting)', variant: 'warning', icon: 'mdi:clock-outline' },
  suspended: { label: 'Wstrzymany (Suspended)', variant: 'purple', icon: 'mdi:pause-circle-outline' },
  completed: { label: 'Zakończony', variant: 'success', icon: 'mdi:check-circle-outline' },
  cancelled: { label: 'Anulowany', variant: 'default', icon: 'mdi:close-circle-outline' },
  error: { label: 'Błąd (Error)', variant: 'danger', icon: 'mdi:alert-circle-outline' },
};

export const ProcessInstanceStatusBadge: React.FC<ProcessInstanceStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
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

export default ProcessInstanceStatusBadge;
