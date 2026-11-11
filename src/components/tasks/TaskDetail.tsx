import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { HumanTaskRead } from '@/types/tasks';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';

interface TaskDetailProps {
  task: HumanTaskRead;
  onClaimClick: () => void;
  onCompleteClick: () => void;
  loading?: boolean;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onClaimClick,
  onCompleteClick,
}) => {
  const isOpen = task.status === 'open';
  const isClaimed = task.status === 'claimed';
  const isOverdue = task.due_at && new Date(task.due_at).getTime() < Date.now();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon icon="mdi:checkbox-marked-circle-outline" className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{task.name}</h1>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {task.lane && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                    Tor (Lane): {task.lane}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                <span>Task ID: {task.id}</span>
                <span>•</span>
                <span>BPMN Task ID: {task.bpmn_task_id}</span>
              </div>
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-2">
            {isOpen && (
              <button
                type="button"
                onClick={onClaimClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <Icon icon="mdi:hand-back-right" className="w-4 h-4" />
                Podejmij zadanie
              </button>
            )}

            {isClaimed && (
              <button
                type="button"
                onClick={onCompleteClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                <Icon icon="mdi:check-bold" className="w-4 h-4" />
                Wykonaj i zakończ
              </button>
            )}

            <Link
              href={`/process-instances/${task.process_instance_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <Icon icon="mdi:open-in-new" className="w-4 h-4 text-slate-400" />
              Zobacz instancję procesu
            </Link>
          </div>
        </div>

        {/* Timelines and Users */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Termin (Due Date)</span>
            <span
              className={`font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
              }`}
            >
              {task.due_at ? new Date(task.due_at).toLocaleString() : 'Brak terminu'}
              {isOverdue && ' (Przeterminowane)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Podjęte przez</span>
            <span className="text-slate-700 font-medium">
              {task.claimed_by ? (
                task.claimed_by.name || task.claimed_by.email || `User #${task.claimed_by.id}`
              ) : (
                <span className="text-slate-400">Nikt (Zadanie otwarte)</span>
              )}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Data utworzenia</span>
            <span className="text-slate-700">
              {new Date(task.created_at).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Ukończenie</span>
            <span className="text-slate-700">
              {task.completed_at
                ? `${new Date(task.completed_at).toLocaleString()} (${
                    task.completed_by?.name || 'User'
                  })`
                : 'W trakcie realizacji'}
            </span>
          </div>
        </div>
      </div>

      {/* Candidates Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Uprawnieni kandydaci do wykonania zadania
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Reguły uprawnień zdefiniowane na torze lub kroku procesu BPMN (użytkownicy, grupy, role)
        </p>

        {task.candidates && task.candidates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {task.candidates.map((cand, idx) => {
              const iconMap = {
                user: 'mdi:account',
                group: 'mdi:account-group',
                role: 'mdi:shield-account',
              };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <Icon
                    icon={iconMap[cand.principal_type] || 'mdi:account'}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">
                    {cand.principal_type}:
                  </span>
                  <span className="font-medium text-slate-800">{cand.principal_value}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Brak jawnych ograniczeń kandydatów (zadanie ogólne).
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
