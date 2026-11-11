import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import {
  ProcessInstanceRead,
  ProcessInstanceStatus,
} from '@/types/processInstances';
import { ProcessInstanceStatusBadge } from './ProcessInstanceStatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProcessInstanceListProps {
  instances: ProcessInstanceRead[];
  total: number;
  limit: number;
  offset: number;
  loading?: boolean;
  statusFilter: ProcessInstanceStatus | null;
  modelKeyFilter: string | null;
  onStatusFilterChange: (status: ProcessInstanceStatus | null) => void;
  onModelKeyFilterChange: (key: string | null) => void;
  onPageChange: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
  onStartInstance: () => void;
  onActionClick: (instance: ProcessInstanceRead, actionType: 'cancel' | 'suspend' | 'resume') => void;
}

const statusOptions: { label: string; value: ProcessInstanceStatus | '' }[] = [
  { label: 'Wszystkie statusy', value: '' },
  { label: 'W trakcie (running)', value: 'running' },
  { label: 'Oczekuje (waiting)', value: 'waiting' },
  { label: 'Wstrzymany (suspended)', value: 'suspended' },
  { label: 'Zakończony (completed)', value: 'completed' },
  { label: 'Anulowany (cancelled)', value: 'cancelled' },
  { label: 'Błąd (error)', value: 'error' },
];

export const ProcessInstanceList: React.FC<ProcessInstanceListProps> = ({
  instances,
  total,
  limit,
  offset,
  loading = false,
  statusFilter,
  modelKeyFilter,
  onStatusFilterChange,
  onModelKeyFilterChange,
  onPageChange,
  onLimitChange,
  onStartInstance,
  onActionClick,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Status Filter */}
          <div className="w-48">
            <select
              value={statusFilter || ''}
              onChange={(e) =>
                onStatusFilterChange(
                  e.target.value ? (e.target.value as ProcessInstanceStatus) : null
                )
              }
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Key Filter */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Icon
              icon="mdi:filter-outline"
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={modelKeyFilter || ''}
              onChange={(e) => onModelKeyFilterChange(e.target.value || null)}
              placeholder="Filtruj wg klucza modelu..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onStartInstance}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Icon icon="mdi:plus" className="w-4 h-4" />
          Uruchom proces
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Wczytywanie instancji procesów..." />
        ) : instances.length === 0 ? (
          <EmptyState
            icon="mdi:progress-clock"
            title="Brak instancji procesów"
            description="Nie znaleziono żadnych zarejestrowanych instancji dla wybranych kryteriów."
            action={
              <button
                type="button"
                onClick={onStartInstance}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Icon icon="mdi:play" className="w-4 h-4" />
                Uruchom pierwszą instancję
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tytuł / Biznesowy klucz</th>
                  <th className="px-4 py-3">Model procesu</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rozpoczęto przez</th>
                  <th className="px-4 py-3">Data startu</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instances.map((instance) => {
                  const canCancel = ['running', 'waiting', 'suspended'].includes(instance.status);
                  const canSuspend = ['running', 'waiting'].includes(instance.status);
                  const canResume = instance.status === 'suspended';

                  return (
                    <tr key={instance.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/process-instances/${instance.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 block text-sm"
                        >
                          {instance.title}
                        </Link>
                        {instance.business_key ? (
                          <span className="font-mono text-[11px] text-slate-500">
                            Key: {instance.business_key}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            ID: {instance.id.slice(0, 8)}...
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-medium block">
                          {instance.process_model_name || instance.process_model_key || '—'}
                        </span>
                        {instance.process_model_key && (
                          <span className="font-mono text-[11px] text-slate-400">
                            {instance.process_model_key}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <ProcessInstanceStatusBadge status={instance.status} size="sm" />
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {instance.started_by ? (
                          <span>{instance.started_by.name || instance.started_by.email || `User #${instance.started_by.id}`}</span>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(instance.started_at).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canResume && (
                            <button
                              type="button"
                              onClick={() => onActionClick(instance, 'resume')}
                              title="Wznów proces"
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            >
                              <Icon icon="mdi:play-circle-outline" className="w-4 h-4" />
                            </button>
                          )}

                          {canSuspend && (
                            <button
                              type="button"
                              onClick={() => onActionClick(instance, 'suspend')}
                              title="Wstrzymaj proces"
                              className="p-1 rounded text-amber-600 hover:bg-amber-50"
                            >
                              <Icon icon="mdi:pause-circle-outline" className="w-4 h-4" />
                            </button>
                          )}

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => onActionClick(instance, 'cancel')}
                              title="Anuluj proces"
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            >
                              <Icon icon="mdi:close-circle-outline" className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            href={`/process-instances/${instance.id}`}
                            title="Szczegóły"
                            className="p-1 rounded text-blue-600 hover:bg-blue-50"
                          >
                            <Icon icon="mdi:eye" className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </div>
    </div>
  );
};

export default ProcessInstanceList;
