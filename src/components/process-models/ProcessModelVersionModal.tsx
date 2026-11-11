import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Icon } from '@iconify/react';
import {
  ProcessModelVersionCreate,
  ProcessModelFileCreate,
  ProcessFileType,
} from '@/types/processModels';

interface ProcessModelVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessModelVersionCreate) => Promise<unknown>;
  processModelKey?: string;
  loading?: boolean;
}

const fileTypeOptions: { label: string; value: ProcessFileType }[] = [
  { label: 'BPMN Diagram (.bpmn)', value: 'bpmn' },
  { label: 'DMN Decision Table (.dmn)', value: 'dmn' },
  { label: 'JSON Schema (.json)', value: 'json_schema' },
  { label: 'UI Schema (.json)', value: 'ui_schema' },
  { label: 'Inny (.xml, .txt)', value: 'other' },
];

const sampleBpmn = (processId: string) => `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" name="${processId}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
</bpmn:definitions>`;

export const ProcessModelVersionModal: React.FC<ProcessModelVersionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  processModelKey = '',
  loading = false,
}) => {
  const [bpmnProcessId, setBpmnProcessId] = useState(processModelKey || 'process_main');
  const [files, setFiles] = useState<ProcessModelFileCreate[]>([
    {
      file_name: `${processModelKey || 'process'}.bpmn`,
      file_type: 'bpmn',
      content: sampleBpmn(processModelKey || 'process_main'),
    },
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddFile = () => {
    const newFile: ProcessModelFileCreate = {
      file_name: `file_${files.length + 1}.json`,
      file_type: 'json_schema',
      content: '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object"\n}',
    };
    setFiles([...files, newFile]);
    setActiveFileIndex(files.length);
  };

  const handleRemoveFile = (index: number) => {
    if (files.length <= 1) {
      setFormError('Wersja modelu musi zawierać co najmniej jeden plik.');
      return;
    }
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setActiveFileIndex(Math.max(0, index - 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    Array.from(uploadedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        let file_type: ProcessFileType = 'other';
        const name = file.name.toLowerCase();
        if (name.endsWith('.bpmn') || name.endsWith('.xml')) {
          file_type = 'bpmn';
        } else if (name.endsWith('.dmn')) {
          file_type = 'dmn';
        } else if (name.includes('ui') && name.endsWith('.json')) {
          file_type = 'ui_schema';
        } else if (name.endsWith('.json')) {
          file_type = 'json_schema';
        }

        setFiles((prev) => [
          ...prev,
          {
            file_name: file.name,
            file_type,
            content: content || '',
          },
        ]);
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  const updateCurrentFile = (patch: Partial<ProcessModelFileCreate>) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIndex ? { ...f, ...patch } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bpmnProcessId.trim()) {
      setFormError('BPMN Process ID jest wymagany.');
      return;
    }

    if (files.length === 0) {
      setFormError('Musisz dodać co najmniej jeden plik do wersji.');
      return;
    }

    for (const f of files) {
      if (!f.file_name.trim()) {
        setFormError('Każdy plik musi posiadać nazwę.');
        return;
      }
      if (!f.content.trim()) {
        setFormError(`Treść pliku "${f.file_name}" nie może być pusta.`);
        return;
      }
    }

    try {
      await onSubmit({
        bpmn_process_id: bpmnProcessId.trim(),
        files,
      });
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Wystąpił błąd podczas dodawania wersji'
      );
    }
  };

  const activeFile = files[activeFileIndex] || files[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nowa wersja robocza modelu (Draft)"
      subtitle="Definicja BPMN/DMN oraz schematów danych dla silnika procesowego"
      maxWidth="3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            Utwórz wersję roboczą
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            BPMN Process ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={bpmnProcessId}
            onChange={(e) => setBpmnProcessId(e.target.value)}
            disabled={loading}
            placeholder="np. invoice_approval_process"
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Identyfikator procesu zadeklarowany w elemencie &lt;bpmn:process id=&quot;...&quot;&gt;
          </p>
        </div>

        {/* Files section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {files.map((file, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeFileIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    icon={
                      file.file_type === 'bpmn'
                        ? 'mdi:file-tree'
                        : file.file_type === 'dmn'
                        ? 'mdi:table'
                        : 'mdi:code-json'
                    }
                    className="w-3.5 h-3.5"
                  />
                  <span>{file.file_name || `Plik ${idx + 1}`}</span>
                  {files.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="ml-1 p-0.5 hover:bg-black/10 rounded"
                    >
                      <Icon icon="mdi:close" className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                <Icon icon="mdi:upload" className="w-3.5 h-3.5 text-blue-600" />
                <span>Wczytaj plik</span>
                <input
                  type="file"
                  multiple
                  accept=".bpmn,.xml,.dmn,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleAddFile}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Icon icon="mdi:plus" className="w-3.5 h-3.5" />
                <span>Dodaj plik</span>
              </button>
            </div>
          </div>

          {activeFile && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nazwa pliku
                  </label>
                  <input
                    type="text"
                    value={activeFile.file_name}
                    onChange={(e) => updateCurrentFile({ file_name: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="np. diagram.bpmn"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Typ pliku
                  </label>
                  <select
                    value={activeFile.file_type}
                    onChange={(e) =>
                      updateCurrentFile({ file_type: e.target.value as ProcessFileType })
                    }
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {fileTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Zawartość pliku (XML / JSON / Tekst)
                </label>
                <textarea
                  value={activeFile.content}
                  onChange={(e) => updateCurrentFile({ content: e.target.value })}
                  rows={10}
                  className="w-full text-xs p-3 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-900 text-slate-100 resize-y"
                  placeholder="Wklej XML BPMN lub schemat JSON..."
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default ProcessModelVersionModal;
