import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProcessModels } from '@/store/processModels';
import { fetchProcessInstances, startProcessInstance } from '@/store/processInstances';
import { fetchMyTasks, claimTask, completeTask } from '@/store/tasks';
import { fetchNotifications } from '@/store/notifications';
import {
  ProcessInstanceStatusBadge,
  TaskPriorityBadge,
  StartProcessInstanceModal,
  TaskClaimModal,
  TaskCompleteModal,
} from '@/components';
import { MyTaskItem, TaskClaimRequest, TaskCompleteRequest } from '@/types/tasks';

export default function Home() {
  const dispatch = useAppDispatch();

  const { items: models, loading: modelsLoading } = useAppSelector((state) => state.processModels);
  const { items: instances, total: instancesTotal, loading: instancesLoading } = useAppSelector(
    (state) => state.processInstances
  );
  const { items: tasks, total: tasksTotal, loading: tasksLoading } = useAppSelector(
    (state) => state.tasks
  );
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MyTaskItem | null>(null);

  useEffect(() => {
    dispatch(fetchProcessModels({ active_only: true }));
    dispatch(fetchProcessInstances({ limit: 5 }));
    dispatch(fetchMyTasks({ limit: 5 }));
    dispatch(fetchNotifications());
  }, [dispatch]);

  const activeModelsCount = models.filter((m) => m.is_active).length;
  const runningInstancesCount = instances.filter(
    (i) => i.status === 'running' || i.status === 'waiting'
  ).length;
  const overdueTasksCount = tasks.filter(
    (t) => t.due_at && new Date(t.due_at).getTime() < Date.now()
  ).length;

  const handleClaim = (task: MyTaskItem) => {
    setSelectedTask(task);
    setClaimModalOpen(true);
  };

  const handleComplete = (task: MyTaskItem) => {
    setSelectedTask(task);
    setCompleteModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>Pulpit główny | Galwork Workflow</title>
      </Head>

      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200 block mb-2">
              System Zarządzania Procesami Biznesowymi
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Witaj w Galwork Workflow
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-6">
              Projektowanie, wdrażanie i wykonywanie procesów opartych o standard BPMN 2.0 i silnik
              SpiffWorkflow z obsługą zadań ludzkich i integracji kalendarzowych.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStartModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs shadow-md hover:bg-blue-50 transition-all"
              >
                <Icon icon="mdi:play" className="w-4 h-4 text-emerald-600" />
                Uruchom proces
              </button>

              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/30 text-white font-semibold text-xs transition-all backdrop-blur-sm"
              >
                <Icon icon="mdi:checkbox-marked-circle-outline" className="w-4 h-4" />
                Przejdź do zadań ({tasksTotal})
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none hidden md:block">
            <Icon icon="mdi:sitemap" className="w-96 h-96 text-white" />
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tasks Card */}
          <Link
            href="/tasks"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Moje zadania</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:tray-full" className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{tasksTotal}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {overdueTasksCount > 0 ? (
                <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                  <Icon icon="mdi:alert-circle" className="w-3 h-3" />
                  {overdueTasksCount} po terminie
                </span>
              ) : (
                <span>Wszystkie w terminie</span>
              )}
            </div>
          </Link>

          {/* Running Instances Card */}
          <Link
            href="/process-instances"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Instancje procesów</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:progress-clock" className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{instancesTotal}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-600 font-semibold">{runningInstancesCount} aktywnych</span>{' '}
              w toku
            </div>
          </Link>

          {/* Process Models Card */}
          <Link
            href="/process-models"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Modele procesów</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:sitemap" className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{models.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="text-purple-600 font-semibold">{activeModelsCount} aktywnych</span>{' '}
              definicji
            </div>
          </Link>

          {/* Notifications Card */}
          <Link
            href="/notifications"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Powiadomienia</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="mdi:bell" className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{unreadCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {unreadCount > 0 ? (
                <span className="text-amber-600 font-semibold">Wymaga przeczytania</span>
              ) : (
                <span>Wszystkie odczytane</span>
              )}
            </div>
          </Link>
        </div>

        {/* Two-Column Grid: Recent Tasks & Recent Instances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:checkbox-marked-circle-outline" className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Ostatnie zadania do wykonania</h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Wszystkie zadania →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Brak zadań w skrzynce.
                </div>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-semibold text-xs text-slate-900 hover:text-blue-600 block truncate"
                      >
                        {task.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate max-w-[150px]">{task.process_title}</span>
                        <span>•</span>
                        <TaskPriorityBadge priority={task.priority} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleClaim(task)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                        >
                          Podejmij
                        </button>
                      )}
                      {task.status === 'claimed' && (
                        <button
                          type="button"
                          onClick={() => handleComplete(task)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                        >
                          Wykonaj
                        </button>
                      )}
                      <Link
                        href={`/tasks/${task.id}`}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Szczegóły"
                      >
                        <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Instances */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:progress-clock" className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Ostatnie instancje procesów</h3>
              </div>
              <Link
                href="/process-instances"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Wszystkie instancje →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {instances.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Brak uruchomionych instancji.
                </div>
              ) : (
                instances.slice(0, 5).map((inst) => (
                  <div
                    key={inst.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/process-instances/${inst.id}`}
                        className="font-semibold text-xs text-slate-900 hover:text-blue-600 block truncate"
                      >
                        {inst.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono truncate">
                        {inst.process_model_name || inst.process_model_key} • {new Date(inst.started_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <ProcessInstanceStatusBadge status={inst.status} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Start Instance Modal */}
        <StartProcessInstanceModal
          isOpen={startModalOpen}
          onClose={() => setStartModalOpen(false)}
          availableModels={models}
          onSubmit={async (data) => {
            await dispatch(startProcessInstance(data)).unwrap();
            dispatch(fetchProcessInstances({ limit: 5 }));
          }}
        />

        {/* Claim Modal */}
        {selectedTask && (
          <TaskClaimModal
            isOpen={claimModalOpen}
            onClose={() => {
              setClaimModalOpen(false);
              setSelectedTask(null);
            }}
            taskId={selectedTask.id}
            taskName={selectedTask.name}
            onConfirm={async (taskId, request: TaskClaimRequest) => {
              await dispatch(claimTask({ id: taskId, request })).unwrap();
              dispatch(fetchMyTasks({ limit: 5 }));
            }}
          />
        )}

        {/* Complete Modal */}
        {selectedTask && (
          <TaskCompleteModal
            isOpen={completeModalOpen}
            onClose={() => {
              setCompleteModalOpen(false);
              setSelectedTask(null);
            }}
            taskId={selectedTask.id}
            taskName={selectedTask.name}
            onConfirm={async (taskId, request: TaskCompleteRequest) => {
              await dispatch(completeTask({ id: taskId, request })).unwrap();
              dispatch(fetchMyTasks({ limit: 5 }));
            }}
          />
        )}
      </div>
    </>
  );
}
