import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  fetchProcessModel,
  fetchProcessModelVersions,
  updateProcessModel,
  createProcessModelVersion,
  publishProcessModelVersion,
} from '@/store/processModels';
import { startProcessInstance } from '@/store/processInstances';
import {
  ProcessModelDetail,
  ProcessModelFormModal,
  ProcessModelVersionModal,
  StartProcessInstanceModal,
  LoadingSpinner,
} from '@/components';
import {
  ProcessModelUpdate,
  ProcessModelVersionCreate,
} from '@/types/processModels';

export default function ProcessModelDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();

  const { selectedModel, versions, loading } = useAppSelector(
    (state) => state.processModels
  );

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isVersionModalOpen, setVersionModalOpen] = useState(false);
  const [isStartInstanceModalOpen, setStartInstanceModalOpen] = useState(false);

  useEffect(() => {
    if (typeof id === 'string') {
      dispatch(fetchProcessModel(id));
      dispatch(fetchProcessModelVersions(id));
    }
  }, [dispatch, id]);

  if (loading && !selectedModel) {
    return <LoadingSpinner message="Wczytywanie szczegółów modelu..." />;
  }

  if (!selectedModel) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Nie znaleziono modelu procesu o podanym ID.</p>
        <Link
          href="/process-models"
          className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          Powrót do listy modeli
        </Link>
      </div>
    );
  }

  const modelVersions = (typeof id === 'string' && versions[id]) || [];

  const handleUpdate = async (modelId: string, data: ProcessModelUpdate) => {
    await dispatch(updateProcessModel({ id: modelId, data })).unwrap();
  };

  const handleCreateVersion = async (data: ProcessModelVersionCreate) => {
    if (typeof id === 'string') {
      await dispatch(createProcessModelVersion({ processModelId: id, data })).unwrap();
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    if (typeof id === 'string') {
      await dispatch(
        publishProcessModelVersion({
          processModelId: id,
          versionId,
        })
      ).unwrap();
    }
  };

  return (
    <>
      <Head>
        <title>{selectedModel.name} | Model procesu | Galwork Workflow</title>
      </Head>

      <div className="space-y-6">
        <div>
          <Link
            href="/process-models"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
            Wróć do listy modeli
          </Link>
        </div>

        <ProcessModelDetail
          model={selectedModel}
          versions={modelVersions}
          onEditModel={isAdmin ? () => setEditModalOpen(true) : undefined}
          onNewVersion={isAdmin ? () => setVersionModalOpen(true) : undefined}
          onPublishVersion={isAdmin ? handlePublishVersion : undefined}
          onStartInstance={() => setStartInstanceModalOpen(true)}
        />

        {/* Edit Model Modal */}
        <ProcessModelFormModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          modelToEdit={selectedModel}
          onSubmitCreate={async () => {}}
          onSubmitUpdate={handleUpdate}
        />

        {/* New Version Modal */}
        <ProcessModelVersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          processModelKey={selectedModel.key}
          onSubmit={handleCreateVersion}
        />

        {/* Start Instance Modal */}
        <StartProcessInstanceModal
          isOpen={isStartInstanceModalOpen}
          onClose={() => setStartInstanceModalOpen(false)}
          availableModels={[selectedModel]}
          initialModelKey={selectedModel.key}
          onSubmit={async (data) => {
            await dispatch(startProcessInstance(data)).unwrap();
          }}
        />
      </div>
    </>
  );
}
