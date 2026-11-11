import React from 'react';
import { Icon } from '@iconify/react';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
  onLimitChange?: (newLimit: number) => void;
  limitOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  total,
  limit,
  offset,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-slate-200 sm:px-6">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>
          Pokazano <span className="font-semibold text-slate-800">{startItem}</span> -{' '}
          <span className="font-semibold text-slate-800">{endItem}</span> z{' '}
          <span className="font-semibold text-slate-800">{total}</span>
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <span>Na stronę:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">
          Strona {currentPage} z {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={!canPrev}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="mdi:chevron-left" className="w-4 h-4 mr-0.5" />
          Poprzednia
        </button>
        <button
          type="button"
          onClick={() => onPageChange(offset + limit)}
          disabled={!canNext}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Następna
          <Icon icon="mdi:chevron-right" className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
