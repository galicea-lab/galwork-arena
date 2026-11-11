import React from 'react';
import { Badge, BadgeVariant } from '@/components/common/Badge';

interface TaskPriorityBadgeProps {
  priority: number;
  size?: 'sm' | 'md';
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  size = 'sm',
}) => {
  let label = 'Niski';
  let variant: BadgeVariant = 'default';

  if (priority >= 80) {
    label = `Bardzo pilne (${priority})`;
    variant = 'danger';
  } else if (priority >= 50) {
    label = `Wysoki (${priority})`;
    variant = 'warning';
  } else if (priority >= 20) {
    label = `Normalny (${priority})`;
    variant = 'primary';
  } else {
    label = `Niski (${priority})`;
    variant = 'default';
  }

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};

export default TaskPriorityBadge;
