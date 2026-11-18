import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function getPaginationSlice<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number = 20
): {
  totalPages: number;
  validCurrentPage: number;
  startIndex: number;
  paginatedItems: T[];
} {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);
  return { totalPages, validCurrentPage, startIndex, paginatedItems };
}

interface PaginationControlsProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  compact?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  totalItems,
  currentPage,
  itemsPerPage = 20,
  onPageChange,
  itemLabel = "records",
  compact = false,
  className = ""
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div
      className={`${
        compact ? "px-3 py-2.5 gap-2" : "px-4 py-3 gap-3"
      } bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs ${className}`}
    >
      <div className="text-slate-500 dark:text-slate-400 font-medium">
        {compact ? (
          <>
            <span className="font-bold text-slate-800 dark:text-white font-mono">
              {startIndex + 1}-{endIndex}
            </span>{" "}
            of <span className="font-bold text-slate-800 dark:text-white font-mono">{totalItems}</span> {itemLabel}
          </>
        ) : (
          <>
            Showing <span className="font-bold text-slate-800 dark:text-white font-mono">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-slate-800 dark:text-white font-mono">{endIndex}</span> of{" "}
            <span className="font-bold text-slate-800 dark:text-white font-mono">{totalItems}</span> {itemLabel} (
            {itemsPerPage} per page)
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
          disabled={validCurrentPage === 1}
          className={`flex items-center gap-1 ${
            compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5"
          } rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - validCurrentPage) <= 1) {
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`${
                    compact ? "w-6 h-6 text-[11px]" : "w-7 h-7 text-xs"
                  } rounded-lg font-bold font-mono transition-all cursor-pointer ${
                    validCurrentPage === pageNum
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            } else if (
              (pageNum === 2 && validCurrentPage > 3) ||
              (pageNum === totalPages - 1 && validCurrentPage < totalPages - 2)
            ) {
              return (
                <span key={pageNum} className="text-slate-400 font-mono px-0.5">
                  ..
                </span>
              );
            }
            return null;
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, validCurrentPage + 1))}
          disabled={validCurrentPage === totalPages}
          className={`flex items-center gap-1 ${
            compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5"
          } rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
        >
          <span>Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
