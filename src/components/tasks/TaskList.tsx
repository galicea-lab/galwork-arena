import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { MyTaskItem } from '@/types/tasks';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface TaskListProps {
  tasks: MyTaskItem[];
  total: number;
  limit: number;
  offset: number;
  loading?: boolean;
  onlyClaimed: boolean;
  overdue: boolean;
  onToggleOnlyClaimed: (val: boolean) => void;
  onToggleOverdue: (val: boolean) => void;
  onPageChange: (offset: number) => void;
  onLimitChange?: (limit: number) => void;
  onClaimTask: (task: MyTaskItem) => void;
  onCompleteTask: (task: MyTaskItem) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  total,
  limit,
  offset,
  loading = false,
  onlyClaimed,
  overdue,
  onToggleOnlyClaimed,
  onToggleOverdue,
  onPageChange,
  onLimitChange,
  onClaimTask,
  onCompleteTask,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={onlyClaimed}
              onChange={(e) => onToggleOnlyClaimed(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <Icon icon="mdi:account-check" className="w-4 h-4 text-blue-600" />
            <span>Tylko podjęte przeze mnie</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={overdue}
              onChange={(e) => onToggleOverdue(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <Icon icon="mdi:clock-alert-outline" className="w-4 h-4 text-rose-600" />
            <span>Tylko przeterminowane</span>
          </label>
        </div>

        <div className="text-xs text-slate-500">
          Zadań w skrzynce: <span className="font-semibold text-slate-800">{total}</span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner message="Wczytywanie skrzynki zadań..." />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="mdi:tray-full"
            title="Skrzynka zadań jest pusta"
            description="Brak oczekujących zadań wymagających Twojej uwagi lub spełniających wybrane filtry."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Zadanie / Kontekst procesu</th>
                  <th className="px-4 py-3">Priorytet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Termin (Due Date)</th>
                  <th className="px-4 py-3">Stan podjęcia</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const isDueOver =
                    task.due_at && new Date(task.due_at).getTime() < Date.now();
                  const isOpen = task.status === 'open';
                  const isClaimed = task.status === 'claimed';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 block text-sm"
                        >
                          {task.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700 truncate max-w-xs">
                            {task.process_title}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">{task.process_model_name}</span>
                          {task.business_key && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-slate-600 font-medium">
                                #{task.business_key}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} size="sm" />
                      </td>

                      <td className="px-4 py-3">
                        {task.due_at ? (
                          <div
                            className={`flex items-center gap-1 font-medium ${
                              isDueOver ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            <Icon
                              icon={isDueOver ? 'mdi:alert-circle' : 'mdi:calendar-clock'}
                              className="w-4 h-4 shrink-0"
                            />
                            <span>{new Date(task.due_at).toLocaleDateString()}</span>
                            {isDueOver && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold ml-1">
                                PO TERMINIE
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Brak terminu</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {task.claimed_by_me ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            <Icon icon="mdi:account-check" className="w-3.5 h-3.5" />
                            Moje
                          </span>
                        ) : task.on_behalf_of ? (
                          <span className="text-amber-700 text-[11px] block">
                            Zastępstwo za: {task.on_behalf_of.name || task.on_behalf_of.email}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Dostępne w grupie</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => onClaimTask(task)}
                              title="Podejmij zadanie"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                            >
                              <Icon icon="mdi:hand-back-right" className="w-3.5 h-3.5" />
                              Podejmij
                            </button>
                          )}

                          {isClaimed && (
                            <button
                              type="button"
                              onClick={() => onCompleteTask(task)}
                              title="Zakończ zadanie"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                            >
                              <Icon icon="mdi:check-bold" className="w-3.5 h-3.5" />
                              Wykonaj
                            </button>
                          )}

                          <Link
                            href={`/tasks/${task.id}`}
                            title="Szczegóły"
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
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

export default TaskList;
