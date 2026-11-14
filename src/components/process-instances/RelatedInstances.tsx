/**
 * 2026-11-13: instancja nadrzędna i instancje uruchomione z tej instancji
 * (sendTask `startProcess` albo szybka akcja zadania) - powiązanie
 * `parent_instance_id` w hubie. Nic nie pokazuje, gdy powiązań nie ma.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { processInstancesApi } from '@/api/processInstances';
import { ProcessInstanceRead } from '@/types/processInstances';
import { ProcessInstanceStatusBadge } from './ProcessInstanceStatusBadge';

interface RelatedInstancesProps {
  instance: ProcessInstanceRead;
}

export const RelatedInstances: React.FC<RelatedInstancesProps> = ({ instance }) => {
  // wyniki zapamiętane razem z id instancji - przy zmianie instancji stare znikają
  const [loadedParent, setLoadedParent] = useState<{ id: string; parent: ProcessInstanceRead } | null>(null);
  const [loadedChildren, setLoadedChildren] = useState<{ id: string; items: ProcessInstanceRead[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (instance.parent_instance_id) {
      processInstancesApi
        .getProcessInstance(instance.parent_instance_id)
        .then((found) => !cancelled && setLoadedParent({ id: instance.id, parent: found }))
        .catch(() => undefined);
    }
    processInstancesApi
      .listProcessInstances({ parent_instance_id: instance.id, limit: 100 })
      .then((page) => !cancelled && setLoadedChildren({ id: instance.id, items: page.items }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [instance.id, instance.parent_instance_id]);

  const parent = loadedParent?.id === instance.id ? loadedParent.parent : null;
  const children = loadedChildren?.id === instance.id ? loadedChildren.items : [];

  if (!instance.parent_instance_id && children.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      {instance.parent_instance_id && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Uruchomiona z procesu</h3>
          <Link
            href={`/process-instances/${instance.parent_instance_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            <Icon icon="mdi:arrow-up-bold-circle-outline" className="w-4 h-4" />
            {parent?.title ?? instance.parent_instance_id}
          </Link>
        </div>
      )}
      {children.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Uruchomione z tej instancji</h3>
          <ul className="space-y-1.5">
            {children.map((child) => (
              <li key={child.id} className="flex items-center gap-2 text-xs">
                <Icon icon="mdi:subdirectory-arrow-right" className="w-4 h-4 text-slate-400" />
                <Link href={`/process-instances/${child.id}`} className="font-semibold text-blue-600 hover:underline">
                  {child.title}
                </Link>
                <ProcessInstanceStatusBadge status={child.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RelatedInstances;
