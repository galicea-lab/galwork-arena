import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchTask,
  claimTask,
  completeTask,
} from '@/store/tasks';
import {
  TaskDetail,
  TaskClaimModal,
  TaskCompleteModal,
  LoadingSpinner,
} from '@/components';
import {
  TaskClaimRequest,
  TaskCompleteRequest,
} from '@/types/tasks';

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();

  const { selectedTask, loading } = useAppSelector((state) => state.tasks);

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  useEffect(() => {
    if (typeof id === 'string') {
      dispatch(fetchTask(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedTask) {
    return <LoadingSpinner message="Wczytywanie szczegółów zadania..." />;
  }

  if (!selectedTask) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Nie znaleziono zadania o podanym ID.</p>
        <Link
          href="/tasks"
          className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Powrót do skrzynki zadań
        </Link>
      </div>
    );
  }

  const handleConfirmClaim = async (taskId: string, request: TaskClaimRequest) => {
    await dispatch(claimTask({ id: taskId, request })).unwrap();
    dispatch(fetchTask(taskId));
  };

  const handleConfirmComplete = async (taskId: string, request: TaskCompleteRequest) => {
    await dispatch(completeTask({ id: taskId, request })).unwrap();
    dispatch(fetchTask(taskId));
  };

  return (
    <>
      <Head>
        <title>{selectedTask.name} | Zadanie | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
            Wróć do skrzynki zadań
          </Link>
        </div>

        <TaskDetail
          task={selectedTask}
          onClaimClick={() => setClaimModalOpen(true)}
          onCompleteClick={() => setCompleteModalOpen(true)}
        />

        {/* Claim Modal */}
        <TaskClaimModal
          isOpen={claimModalOpen}
          onClose={() => setClaimModalOpen(false)}
          taskId={selectedTask.id}
          taskName={selectedTask.name}
          onConfirm={handleConfirmClaim}
        />

        {/* Complete Modal */}
        <TaskCompleteModal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          taskId={selectedTask.id}
          taskName={selectedTask.name}
          onConfirm={handleConfirmComplete}
        />
      </div>
    </>
  );
}
