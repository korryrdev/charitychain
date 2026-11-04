import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import {
  TrendingUp,
  Users,
  Wallet,
  Receipt,
  CheckCircle,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['transparency-stats'],
    queryFn: () => api.getTransparencyStats(),
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Active Pool Balance',
      amountMinor: stats.activePoolBalanceMinor,
      description: 'Available for current student cases',
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Total Inflow Captured',
      amountMinor: stats.totalInflowMinor,
      description: `${stats.totalDonationsCount.toLocaleString()} total donations`,
      icon: ArrowDownRight,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Total Disbursed',
      amountMinor: stats.totalOutflowMinor,
      description: `${stats.totalCasesDisbursed} cases fulfilled`,
      icon: ArrowUpRight,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    },
    {
      title: 'Students Supported',
      rawCount: stats.totalBeneficiariesHelped,
      description: 'Needy campus beneficiaries helped',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Public Transparency Dashboard
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
          Real-time audited overview of all contributions, pool balance, and verified campus disbursements.
        </p>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                {card.amountMinor !== undefined ? (
                  <Money amountMinor={card.amountMinor} className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100" />
                ) : (
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {card.rawCount?.toLocaleString()}
                  </span>
                )}
                <p className="text-xs text-zinc-500 mt-1">{card.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disbursements by Need Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Disbursements by Need Category
            </CardTitle>
            <CardDescription>
              Allocation breakdown of funds delivered to verified student needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryBreakdown.map((item) => {
                const percent = Math.round((item.amountMinor / stats.totalOutflowMinor) * 100);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <Money amountMinor={item.amountMinor} className="text-zinc-900 dark:text-zinc-100 font-bold" />
                        <span className="text-zinc-400">({percent}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inflows by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Collection Channels
            </CardTitle>
            <CardDescription>
              Tamper-evident inflow intake across M-Pesa, bank wire, and hospital pharmacy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.channelBreakdown.map((item) => (
                <div
                  key={item.channel}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <StatusChip status={item.channel} />
                    <span className="text-xs text-zinc-500 font-medium">
                      {item.count.toLocaleString()} transactions
                    </span>
                  </div>
                  <Money amountMinor={item.amountMinor} currency={item.channel === 'IN_KIND' ? 'ITM' : 'KES'} className="text-sm font-bold" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

