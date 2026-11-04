import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/StatusChip';
import { Money } from '@/components/Money';
import { useAuth } from '@/app/auth/AuthContext';
import { FileCheck2, PlusCircle, Filter, ArrowRight, UserCheck } from 'lucide-react';
import type { CaseState } from '@/types';

export const CasesPage: React.FC = () => {
  const { role } = useAuth();
  const [filterState, setFilterState] = useState<string>('ALL');

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.getCases(),
  });

  const filteredCases = cases.filter((c) => {
    if (filterState === 'ALL') return true;
    return c.state === filterState;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cases & Approvals Queue
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Review student cases raised by official campus sub-groups and manage approvals.
          </p>
        </div>

        {['SUBGROUP_REP', 'COMMITTEE', 'ADMIN'].includes(role) && (
          <Link to="/app/cases/new">
            <Button variant="emerald" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Submit New Case
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-400 flex items-center gap-1 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['ALL', 'SUBMITTED', 'APPROVED', 'AUTHORIZED', 'DISBURSED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterState(st)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              filterState === st
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Cases Table Card */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No cases match the selected filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Case Ref</th>
                    <th className="py-3.5 px-4">Sub-group</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Requested</th>
                    <th className="py-3.5 px-4">Signatures (2-of-3)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredCases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {c.caseNumber}
                      </td>
                      <td className="py-4 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {c.subGroupName}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {c.needCategory}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Money amountMinor={c.requestedAmountMinor} className="font-bold" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              c.signatorySignatures.length >= 2
                                ? 'bg-emerald-500'
                                : c.signatorySignatures.length === 1
                                ? 'bg-amber-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          />
                          <span>{c.signatorySignatures.length} of 3 signed</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusChip status={c.state} />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        {c.state === 'APPROVED' ? (
                          <Link to="/app/signing">
                            <Button size="sm" variant="emerald" className="gap-1 text-xs">
                              Sign Release
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs">
                            View Details
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

