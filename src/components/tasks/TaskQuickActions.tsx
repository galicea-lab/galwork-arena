/**
 * 2026-11-13: szybkie akcje zadania - przyciski "Uruchom ..." dla
 * `quickAction` w BPMN zadania. Każdy uruchamia osobną instancję innego
 * modelu (np. teczka sprawy) powiązaną z instancją zadania; zadanie
 * zostaje otwarte. Akcje przychodzą z `GET /tasks/{id}/form`
 * (`quick_actions`) - bez uprawnień do zadania formularz się nie wczyta
 * i blok się nie pokazuje.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { formsApi } from '@/api/forms';
import { tasksApi } from '@/api/tasks';
import { HumanTaskRead } from '@/types/tasks';
import { QuickAction } from '@/types/forms';
import { ProcessInstanceRead } from '@/types/processInstances';

interface TaskQuickActionsProps {
  task: HumanTaskRead;
}

const errorMessage = (error: unknown): string => {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === 'string' ? detail : 'Nie udało się uruchomić procesu.';
};

export const TaskQuickActions: React.FC<TaskQuickActionsProps> = ({ task }) => {
  // akcje zapamiętane razem z id zadania - przy zmianie zadania stare znikają
  const [loaded, setLoaded] = useState<{ taskId: string; actions: QuickAction[] } | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [started, setStarted] = useState<ProcessInstanceRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const active = task.status === 'open' || task.status === 'claimed';

  useEffect(() => {
    let cancelled = false;
    if (!active) return undefined;
    formsApi
      .getTaskForm(task.id)
      .then((form) => {
        if (!cancelled) setLoaded({ taskId: task.id, actions: form.quick_actions ?? [] });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ taskId: task.id, actions: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [task.id, active]);

  const actions = loaded?.taskId === task.id ? loaded.actions : [];
  if (!active || actions.length === 0) return null;

  const run = async (action: QuickAction) => {
    setRunning(action.process_model_key);
    setError(null);
    try {
      const instance = await tasksApi.runQuickAction(task.id, action.process_model_key);
      setStarted((prev) => [instance, ...prev]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 mb-1">Szybkie akcje</h3>
      <p className="text-xs text-slate-500 mb-4">
        Uruchamiają osobny proces powiązany z tą sprawą. Zadanie pozostaje otwarte.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.process_model_key}
            type="button"
            disabled={running !== null}
            onClick={() => run(action)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon
              icon={running === action.process_model_key ? 'mdi:loading' : 'mdi:rocket-launch-outline'}
              className={`w-4 h-4 ${running === action.process_model_key ? 'animate-spin' : ''}`}
            />
            Uruchom: {action.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-rose-700">{error}</p>}
      {started.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs">
          {started.map((instance) => (
            <li key={instance.id} className="flex items-center gap-1.5 text-emerald-700">
              <Icon icon="mdi:check-circle-outline" className="w-4 h-4" />
              Uruchomiono:
              <Link href={`/process-instances/${instance.id}`} className="font-semibold hover:underline">
                {instance.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskQuickActions;
