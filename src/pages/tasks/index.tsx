import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchMyTasks,
  setTaskFilters,
  setTaskPagination,
  claimTask,
  completeTask,
} from '@/store/tasks';
import {
  TaskList,
  TaskClaimModal,
  TaskCompleteModal,
} from '@/components';
import {
  MyTaskItem,
  TaskClaimRequest,
  TaskCompleteRequest,
} from '@/types/tasks';

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { items, total, limit, offset, loading, filters } = useAppSelector(
    (state) => state.tasks
  );

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MyTaskItem | null>(null);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const handleClaimClick = (task: MyTaskItem) => {
    setSelectedTask(task);
    setClaimModalOpen(true);
  };

  const handleCompleteClick = (task: MyTaskItem) => {
    setSelectedTask(task);
    setCompleteModalOpen(true);
  };

  const handleConfirmClaim = async (taskId: string, request: TaskClaimRequest) => {
    await dispatch(claimTask({ id: taskId, request })).unwrap();
  };

  const handleConfirmComplete = async (taskId: string, request: TaskCompleteRequest) => {
    await dispatch(completeTask({ id: taskId, request })).unwrap();
  };

  return (
    <>
      <Head>
        <title>Moje zadania | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moje zadania</h1>
          <p className="text-xs text-slate-500 mt-1">
            Skrzynka zadań użytkownika: zadania podjęte oraz otwarte zadania w toku procesów BPMN
          </p>
        </div>

        <TaskList
          tasks={items}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          onlyClaimed={filters.only_claimed}
          overdue={filters.overdue}
          onToggleOnlyClaimed={(only_claimed) => {
            dispatch(setTaskFilters({ only_claimed }));
            dispatch(fetchMyTasks({ only_claimed, offset: 0 }));
          }}
          onToggleOverdue={(overdue) => {
            dispatch(setTaskFilters({ overdue }));
            dispatch(fetchMyTasks({ overdue, offset: 0 }));
          }}
          onPageChange={(newOffset) => {
            dispatch(setTaskPagination({ offset: newOffset }));
            dispatch(fetchMyTasks({ offset: newOffset }));
          }}
          onLimitChange={(newLimit) => {
            dispatch(setTaskPagination({ limit: newLimit, offset: 0 }));
            dispatch(fetchMyTasks({ limit: newLimit, offset: 0 }));
          }}
          onClaimTask={handleClaimClick}
          onCompleteTask={handleCompleteClick}
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
            onConfirm={handleConfirmClaim}
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
            onConfirm={handleConfirmComplete}
          />
        )}
      </div>
    </>
  );
}
