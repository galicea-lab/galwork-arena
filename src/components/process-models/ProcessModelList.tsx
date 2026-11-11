import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { ProcessModelRead } from '@/types/processModels';
import { ProcessModelCard } from './ProcessModelCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';

interface ProcessModelListProps {
  models: ProcessModelRead[];
  loading?: boolean;
  activeOnly: boolean;
  onToggleActiveOnly: (val: boolean) => void;
  /** Brak (`undefined`) = użytkownik bez roli `galwork-admin` - przycisk
   * jest ukryty (zob. src/hooks/useIsAdmin.ts; pages/process-models/index.tsx). */
  onCreateModel?: () => void;
  onEditModel?: (model: ProcessModelRead) => void;
  onNewVersion?: (model: ProcessModelRead) => void;
  onStartInstance?: (model: ProcessModelRead) => void;
}

export const ProcessModelList: React.FC<ProcessModelListProps> = ({
  models,
  loading = false,
  activeOnly,
  onToggleActiveOnly,
  onCreateModel,
  onEditModel,
  onNewVersion,
  onStartInstance,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredModels = models.filter((m) => {
    const query = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.key.toLowerCase().includes(query) ||
      (m.category && m.category.toLowerCase().includes(query)) ||
      (m.description && m.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Icon
              icon="mdi:magnify"
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po nazwie, kluczu, kategorii..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Only Filter */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => onToggleActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Tylko aktywne</span>
          </label>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Widok kafelków"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon icon="mdi:view-grid" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Widok tabeli"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon icon="mdi:view-list" className="w-4 h-4" />
            </button>
          </div>

          {/* New Model Button - tylko galwork-admin (zob. useIsAdmin) */}
          {onCreateModel && (
            <button
              type="button"
              onClick={onCreateModel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Nowy model
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Wczytywanie modeli procesów..." />
      ) : filteredModels.length === 0 ? (
        <EmptyState
          icon="mdi:sitemap"
          title="Brak modeli procesów"
          description={
            search
              ? 'Nie znaleziono modeli pasujących do podanego zapytania.'
              : 'W systemie nie ma jeszcze żadnych zdefiniowanych modeli procesów.'
          }
          action={
            onCreateModel && (
              <button
                type="button"
                onClick={onCreateModel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Dodaj pierwszy model
              </button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <ProcessModelCard
              key={model.id}
              model={model}
              onEdit={onEditModel}
              onNewVersion={onNewVersion}
              onStartInstance={onStartInstance}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Nazwa / Klucz</th>
                  <th className="px-4 py-3">Kategoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data utworzenia</th>
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/process-models/${model.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 block text-sm"
                      >
                        {model.name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-400">{model.key}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {model.category ? (
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {model.category}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={model.is_active ? 'success' : 'default'} size="sm">
                        {model.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(model.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onStartInstance && model.is_active && (
                          <button
                            type="button"
                            onClick={() => onStartInstance(model)}
                            title="Startuj instancję"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                          >
                            <Icon icon="mdi:play" className="w-4 h-4" />
                          </button>
                        )}
                        {onNewVersion && (
                          <button
                            type="button"
                            onClick={() => onNewVersion(model)}
                            title="Nowa wersja"
                            className="p-1 rounded text-purple-600 hover:bg-purple-50"
                          >
                            <Icon icon="mdi:source-branch" className="w-4 h-4" />
                          </button>
                        )}
                        {onEditModel && (
                          <button
                            type="button"
                            onClick={() => onEditModel(model)}
                            title="Edytuj"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/process-models/${model.id}`}
                          title="Szczegóły"
                          className="p-1 rounded text-blue-600 hover:bg-blue-50"
                        >
                          <Icon icon="mdi:eye" className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessModelList;
