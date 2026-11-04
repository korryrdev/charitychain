import React from 'react';
import { Money } from '@/components/Money';
import type { Allocation, Channel } from '@/types';
import { ArrowRight, Layers, PieChart } from 'lucide-react';

interface SankeyFlowProps {
  totalAmountMinor: number;
  currency: string;
  channel: Channel;
  receiptCode: string;
  allocations: Allocation[];
}

export const SankeyFlow: React.FC<SankeyFlowProps> = ({
  totalAmountMinor,
  currency,
  channel,
  receiptCode,
  allocations,
}) => {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amountMinor, 0);
  const remainingInPool = Math.max(0, totalAmountMinor - totalAllocated);

  const colors = [
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          Fund Flow Allocation Graph (FIFO Lot Tracking)
        </h4>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          {allocations.length > 0 ? `${Math.round((totalAllocated / totalAmountMinor) * 100)}% Allocated` : '100% in Pool'}
        </span>
      </div>

      {/* Visual Sankey Diagram / Flow Representation */}
      <div className="relative pt-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Source Node (Donation Lot) */}
          <div className="md:col-span-4 p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xs space-y-1 text-center md:text-left">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Inflow Lot • {channel}
            </span>
            <div className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {receiptCode}
            </div>
            <Money
              amountMinor={totalAmountMinor}
              currency={currency}
              className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 block pt-1"
            />
            <span className="text-[10px] text-zinc-400 block">Notarized on Polygon Amoy</span>
          </div>

          {/* Flow Connector Arrow */}
          <div className="hidden md:flex md:col-span-1 items-center justify-center text-zinc-400">
            <ArrowRight className="w-6 h-6 animate-pulse text-emerald-600" />
          </div>

          {/* Destination Nodes (Cases + Remainder) */}
          <div className="md:col-span-7 space-y-3">
            {allocations.map((alloc, idx) => {
              const share = Math.round((alloc.amountMinor / totalAmountMinor) * 100);
              const colorGradient = colors[idx % colors.length];

              return (
                <div
                  key={alloc.id}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {alloc.caseNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {alloc.caseCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Money
                        amountMinor={alloc.amountMinor}
                        currency={currency}
                        className="font-bold text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="text-zinc-400 font-mono text-[11px]">({share}%)</span>
                    </div>
                  </div>

                  {/* Flow Bar */}
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colorGradient} transition-all duration-500`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Remaining in Pool */}
            {remainingInPool > 0 && (
              <div className="p-3.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-900/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                      Unallocated Active Pool Balance
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      In Queue
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money
                      amountMinor={remainingInPool}
                      currency={currency}
                      className="font-bold text-zinc-600 dark:text-zinc-300"
                    />
                    <span className="text-zinc-400 font-mono text-[11px]">
                      ({Math.round((remainingInPool / totalAmountMinor) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-400 dark:bg-zinc-600"
                    style={{ width: `${Math.round((remainingInPool / totalAmountMinor) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

