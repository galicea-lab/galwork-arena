import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProcessInstances,
  setFilters,
  setPagination,
  startProcessInstance,
  cancelProcessInstance,
  suspendProcessInstance,
  resumeProcessInstance,
} from '@/store/processInstances';
import { fetchProcessModels } from '@/store/processModels';
import {
  ProcessInstanceList,
  StartProcessInstanceModal,
  ProcessInstanceActionModal,
  InstanceActionType,
} from '@/components';
import {
  ProcessInstanceRead,
  ProcessInstanceAction,
} from '@/types/processInstances';

export default function ProcessInstancesPage() {
  const dispatch = useAppDispatch();
  const { items, total, limit, offset, loading, filters } = useAppSelector(
    (state) => state.processInstances
  );
  const { items: models } = useAppSelector((state) => state.processModels);

  const [isStartModalOpen, setStartModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedInstanceForAction, setSelectedInstanceForAction] =
    useState<ProcessInstanceRead | null>(null);
  const [actionType, setActionType] = useState<InstanceActionType>('cancel');

  useEffect(() => {
    dispatch(fetchProcessInstances());
    dispatch(fetchProcessModels());
  }, [dispatch]);

  const handleActionClick = (
    instance: ProcessInstanceRead,
    type: 'cancel' | 'suspend' | 'resume'
  ) => {
    setSelectedInstanceForAction(instance);
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (id: string, action: ProcessInstanceAction) => {
    if (actionType === 'cancel') {
      await dispatch(cancelProcessInstance({ id, action })).unwrap();
    } else if (actionType === 'suspend') {
      await dispatch(suspendProcessInstance({ id, action })).unwrap();
    } else if (actionType === 'resume') {
      await dispatch(resumeProcessInstance({ id, action })).unwrap();
    }
  };

  return (
    <>
      <Head>
        <title>Instancje procesów | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Instancje procesów</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoruj stan wykonania instancji procesów, steruj ich cyklem życia i przeglądaj historię
          </p>
        </div>

        <ProcessInstanceList
          instances={items}
          total={total}
          limit={limit}
          offset={offset}
          loading={loading}
          statusFilter={filters.status}
          modelKeyFilter={filters.process_model_key}
          onStatusFilterChange={(status) => {
            dispatch(setFilters({ status }));
            dispatch(fetchProcessInstances({ status, offset: 0 }));
          }}
          onModelKeyFilterChange={(process_model_key) => {
            dispatch(setFilters({ process_model_key }));
            dispatch(fetchProcessInstances({ process_model_key, offset: 0 }));
          }}
          onPageChange={(newOffset) => {
            dispatch(setPagination({ offset: newOffset }));
            dispatch(fetchProcessInstances({ offset: newOffset }));
          }}
          onLimitChange={(newLimit) => {
            dispatch(setPagination({ limit: newLimit, offset: 0 }));
            dispatch(fetchProcessInstances({ limit: newLimit, offset: 0 }));
          }}
          onStartInstance={() => setStartModalOpen(true)}
          onActionClick={handleActionClick}
        />

        {/* Start Instance Modal */}
        <StartProcessInstanceModal
          isOpen={isStartModalOpen}
          onClose={() => setStartModalOpen(false)}
          availableModels={models}
          onSubmit={async (data) => {
            await dispatch(startProcessInstance(data)).unwrap();
          }}
        />

        {/* Action Modal (Cancel / Suspend / Resume) */}
        <ProcessInstanceActionModal
          isOpen={actionModalOpen}
          onClose={() => {
            setActionModalOpen(false);
            setSelectedInstanceForAction(null);
          }}
          instance={selectedInstanceForAction}
          actionType={actionType}
          onConfirm={handleConfirmAction}
        />
      </div>
    </>
  );
}
