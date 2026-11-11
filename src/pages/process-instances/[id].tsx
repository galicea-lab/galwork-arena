import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProcessInstance,
  cancelProcessInstance,
  suspendProcessInstance,
  resumeProcessInstance,
} from '@/store/processInstances';
import { fetchComments, createComment } from '@/store/comments';
import {
  ProcessInstanceDetail,
  ProcessInstanceActionModal,
  InstanceActionType,
  LoadingSpinner,
} from '@/components';
import {
  ProcessInstanceAction,
} from '@/types/processInstances';
import { CommentCreate } from '@/types/comments';

export default function ProcessInstanceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();

  const { selectedInstance, loading } = useAppSelector(
    (state) => state.processInstances
  );
  const { byInstanceId, loading: commentsLoading } = useAppSelector(
    (state) => state.comments
  );

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<InstanceActionType>('cancel');

  useEffect(() => {
    if (typeof id === 'string') {
      dispatch(fetchProcessInstance(id));
      dispatch(fetchComments(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedInstance) {
    return <LoadingSpinner message="Wczytywanie szczegółów instancji..." />;
  }

  if (!selectedInstance) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Nie znaleziono instancji procesu o podanym ID.</p>
        <Link
          href="/process-instances"
          className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Powrót do listy instancji
        </Link>
      </div>
    );
  }

  const comments = (typeof id === 'string' && byInstanceId[id]) || [];

  const handleActionClick = (type: InstanceActionType) => {
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (instanceId: string, action: ProcessInstanceAction) => {
    if (actionType === 'cancel') {
      await dispatch(cancelProcessInstance({ id: instanceId, action })).unwrap();
    } else if (actionType === 'suspend') {
      await dispatch(suspendProcessInstance({ id: instanceId, action })).unwrap();
    } else if (actionType === 'resume') {
      await dispatch(resumeProcessInstance({ id: instanceId, action })).unwrap();
    }
  };

  const handleAddComment = async (data: CommentCreate) => {
    if (typeof id === 'string') {
      await dispatch(createComment({ instanceId: id, data })).unwrap();
    }
  };

  return (
    <>
      <Head>
        <title>{selectedInstance.title} | Instancja procesu | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <Link
            href="/process-instances"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
            Wróć do listy instancji
          </Link>
        </div>

        <ProcessInstanceDetail
          instance={selectedInstance}
          comments={comments}
          commentsLoading={commentsLoading}
          onAddComment={handleAddComment}
          onActionClick={handleActionClick}
        />

        {/* Action Modal (Cancel / Suspend / Resume) */}
        <ProcessInstanceActionModal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          instance={selectedInstance}
          actionType={actionType}
          onConfirm={handleConfirmAction}
        />
      </div>
    </>
  );
}
