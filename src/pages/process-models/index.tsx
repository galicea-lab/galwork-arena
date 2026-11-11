import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAppDispatch, useAppSelector } from '@/store';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  fetchProcessModels,
  createProcessModel,
  updateProcessModel,
  setFilterActiveOnly,
} from '@/store/processModels';
import { startProcessInstance } from '@/store/processInstances';
import {
  ProcessModelList,
  ProcessModelFormModal,
  ProcessModelVersionModal,
  StartProcessInstanceModal,
} from '@/components';
import {
  ProcessModelRead,
  ProcessModelCreate,
  ProcessModelUpdate,
  ProcessModelVersionCreate,
} from '@/types/processModels';
import { createProcessModelVersion } from '@/store/processModels';

export default function ProcessModelsPage() {
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const { items, loading, filterActiveOnly } = useAppSelector(
    (state) => state.processModels
  );

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<ProcessModelRead | null>(null);

  const [isVersionModalOpen, setVersionModalOpen] = useState(false);
  const [targetModelForVersion, setTargetModelForVersion] = useState<ProcessModelRead | null>(null);

  const [isStartInstanceModalOpen, setStartInstanceModalOpen] = useState(false);
  const [targetModelForInstance, setTargetModelForInstance] = useState<ProcessModelRead | null>(null);

  useEffect(() => {
    dispatch(fetchProcessModels({ active_only: filterActiveOnly }));
  }, [dispatch, filterActiveOnly]);

  const handleToggleActiveOnly = (val: boolean) => {
    dispatch(setFilterActiveOnly(val));
  };

  const handleCreate = async (data: ProcessModelCreate) => {
    await dispatch(createProcessModel(data)).unwrap();
  };

  const handleUpdate = async (id: string, data: ProcessModelUpdate) => {
    await dispatch(updateProcessModel({ id, data })).unwrap();
  };

  const handleCreateVersion = async (data: ProcessModelVersionCreate) => {
    if (!targetModelForVersion) return;
    await dispatch(
      createProcessModelVersion({
        processModelId: targetModelForVersion.id,
        data,
      })
    ).unwrap();
  };

  return (
    <>
      <Head>
        <title>Modele procesów | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modele procesów</h1>
          <p className="text-xs text-slate-500 mt-1">
            Zarządzaj definicjami procesów biznesowych, wersjami BPMN/DMN i schematami danych
          </p>
        </div>

        <ProcessModelList
          models={items}
          loading={loading}
          activeOnly={filterActiveOnly}
          onToggleActiveOnly={handleToggleActiveOnly}
          onCreateModel={
            isAdmin
              ? () => {
                  setModelToEdit(null);
                  setFormModalOpen(true);
                }
              : undefined
          }
          onEditModel={
            isAdmin
              ? (m) => {
                  setModelToEdit(m);
                  setFormModalOpen(true);
                }
              : undefined
          }
          onNewVersion={
            isAdmin
              ? (m) => {
                  setTargetModelForVersion(m);
                  setVersionModalOpen(true);
                }
              : undefined
          }
          onStartInstance={(m) => {
            setTargetModelForInstance(m);
            setStartInstanceModalOpen(true);
          }}
        />

        {/* Create/Edit Model Modal */}
        <ProcessModelFormModal
          isOpen={isFormModalOpen}
          onClose={() => setFormModalOpen(false)}
          modelToEdit={modelToEdit}
          onSubmitCreate={handleCreate}
          onSubmitUpdate={handleUpdate}
        />

        {/* Add Version Modal */}
        <ProcessModelVersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          processModelKey={targetModelForVersion?.key}
          onSubmit={handleCreateVersion}
        />

        {/* Start Instance Modal */}
        <StartProcessInstanceModal
          isOpen={isStartInstanceModalOpen}
          onClose={() => setStartInstanceModalOpen(false)}
          availableModels={items}
          initialModelKey={targetModelForInstance?.key}
          onSubmit={async (data) => {
            await dispatch(startProcessInstance(data)).unwrap();
          }}
        />
      </div>
    </>
  );
}
