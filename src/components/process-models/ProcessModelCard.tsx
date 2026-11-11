import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/common/Badge';
import { ProcessModelRead } from '@/types/processModels';

interface ProcessModelCardProps {
  model: ProcessModelRead;
  onEdit?: (model: ProcessModelRead) => void;
  onNewVersion?: (model: ProcessModelRead) => void;
  onStartInstance?: (model: ProcessModelRead) => void;
}

export const ProcessModelCard: React.FC<ProcessModelCardProps> = ({
  model,
  onEdit,
  onNewVersion,
  onStartInstance,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon icon="mdi:sitemap" className="w-5 h-5" />
            </div>
            <div>
              <Link
                href={`/process-models/${model.id}`}
                className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                title={model.name}
              >
                {model.name}
              </Link>
              <span className="text-[11px] font-mono text-slate-400 block">{model.key}</span>
            </div>
          </div>

          <Badge variant={model.is_active ? 'success' : 'default'} size="sm">
            {model.is_active ? 'Aktywny' : 'Nieaktywny'}
          </Badge>
        </div>

        {model.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mt-2 mb-3 leading-relaxed">
            {model.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          {model.category && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              <Icon icon="mdi:tag-outline" className="w-3 h-3 text-slate-400" />
              {model.category}
            </span>
          )}
          <span className="inline-flex items-center gap-1 ml-auto">
            <Icon icon="mdi:calendar-outline" className="w-3 h-3 text-slate-400" />
            {new Date(model.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
        <Link
          href={`/process-models/${model.id}`}
          className="text-xs font-medium text-slate-700 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
        >
          Szczegóły
          <Icon icon="mdi:arrow-right" className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-1">
          {onStartInstance && model.is_active && (
            <button
              type="button"
              onClick={() => onStartInstance(model)}
              title="Uruchom proces"
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Icon icon="mdi:play" className="w-4 h-4" />
            </button>
          )}

          {onNewVersion && (
            <button
              type="button"
              onClick={() => onNewVersion(model)}
              title="Nowa wersja"
              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Icon icon="mdi:source-branch" className="w-4 h-4" />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(model)}
              title="Edytuj model"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Icon icon="mdi:pencil" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessModelCard;
