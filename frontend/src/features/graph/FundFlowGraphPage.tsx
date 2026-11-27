import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import {
  Network,
  Search,
  Filter,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  X,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Coins,
  PackageCheck,
  CheckCircle2,
  FileCheck2,
  Loader2,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import type { Channel, NeedCategory } from '@/types';

export type NodeType = 'INFLOW' | 'POOL' | 'CASE' | 'SIGNATORY' | 'DISBURSEMENT';

export interface GraphNode {
  id: string;
  rawId?: string;
  label: string;
  sublabel: string;
  type: NodeType;
  channel?: Channel;
  amountMinor: number;
  remainingMinor?: number;
  lotCount?: number;
  currency: 'KES' | 'ITM';
  colIndex: number;
  yRatio: number;
  txHash?: string;
  blockNumber?: number;
  alertId?: string;
  alertRule?: string;
  alertText?: string;
  alertSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amountMinor: number;
  currency: 'KES' | 'ITM';
  label?: string;
  channel?: Channel;
  flagged?: boolean;
}

export const FundFlowGraphPage: React.FC = () => {
  const location = useLocation();
  const inAppWorkspace = location.pathname.startsWith('/app');
  const alertsPath = inAppWorkspace ? '/app/alerts' : '/auditor/forensic-rules';
  const casesPath = inAppWorkspace ? '/app/cases' : '/committee/cases';
  const signingPath = inAppWorkspace ? '/app/signing' : '/committee/signing';
  const disbursementsPath = inAppWorkspace ? '/finance/disbursements' : '/auditor/money';
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'MPESA' | 'BANK' | 'IN_KIND'>('ALL');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: liveGraph, isLoading, error, refetch } = useQuery({
    queryKey: ['fund-flow-graph'],
    queryFn: () => api.getFundFlowGraph(),
    refetchInterval: 30000,
  });

  const graphNodes: GraphNode[] = useMemo(() => {
    if (!liveGraph?.nodes || !Array.isArray(liveGraph.nodes)) return [];
    return liveGraph.nodes.map((n: any) => ({
      ...n,
      amountMinor: Number(n.amountMinor || 0),
      remainingMinor: n.remainingMinor !== undefined ? Number(n.remainingMinor) : undefined,
    }));
  }, [liveGraph]);

  const graphEdges: GraphEdge[] = useMemo(() => {
    if (!liveGraph?.edges || !Array.isArray(liveGraph.edges)) return [];
    return liveGraph.edges.map((e: any) => ({
      ...e,
      amountMinor: Number(e.amountMinor || 0),
    }));
  }, [liveGraph]);

  const filteredNodes = useMemo(() => {
    return graphNodes.filter((node) => {
      if (filterChannel !== 'ALL') {
        if (node.channel && node.channel !== filterChannel) return false;
      }
      if (showFlaggedOnly && !node.alertId) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchLabel = node.label.toLowerCase().includes(query);
        const matchSub = node.sublabel.toLowerCase().includes(query);
        const matchRule = node.alertRule?.toLowerCase().includes(query);
        if (!matchLabel && !matchSub && !matchRule) return false;
      }
      return true;
    });
  }, [graphNodes, filterChannel, showFlaggedOnly, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graphEdges.filter((edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target));
  }, [graphEdges, activeNodeIds]);

  const selectedNode = useMemo(() => {
    if (selectedNodeId) {
      return graphNodes.find((n) => n.id === selectedNodeId) || null;
    }
    return graphNodes.find((n) => Boolean(n.alertId)) || graphNodes[0] || null;
  }, [graphNodes, selectedNodeId]);

  const width = 1100;
  const height = 620;
  const colX = [100, 320, 560, 800, 1020];

  const getNodePos = (node: GraphNode) => {
    const x = colX[node.colIndex];
    const y = 80 + node.yRatio * (height - 160);
    return { x, y };
  };

  const columnHeaders = [
    '1. Inflow Lots',
    '2. Common Pools',
    '3. Need Cases',
    '4. Multi-Sig Approvers',
    '5. Real Payouts',
  ];

  const summary = liveGraph?.summary;

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Network className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Fund Flow & Allocation Graph
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time FIFO lot allocation DAG tracing donation intake, earmarked pools, approved cases, and disbursements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterChannel('ALL');
              setShowFlaggedOnly(false);
              setSearchQuery('');
              refetch();
            }}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Live Data</span>
          </Button>
          <Link to={alertsPath}>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 text-amber-600 border-amber-300 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Forensic Inbox ({summary?.openAlertsCount ?? 0})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Metrics Summary Bar */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Total Intake Volume</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <Money
                amountMinor={summary.totalInflowMinor}
                currency="KES"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              />
              <span className="text-[11px] text-zinc-400 mt-0.5 block">{summary.totalLotsCount} lots recorded</span>
            </div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Allocated to Cases</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 font-bold text-xl text-zinc-900 dark:text-zinc-50">
              {summary.totalAllocationsCount} Allocations
              <span className="text-[11px] text-zinc-400 font-normal mt-0.5 block">FIFO Lot consumption</span>
            </div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Disbursed Payouts</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <Money
                amountMinor={summary.totalDisbursedMinor}
                currency="KES"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              />
              <span className="text-[11px] text-zinc-400 mt-0.5 block">M-Pesa, Bank & Pharmacy</span>
            </div>
          </Card>

          <Card className="p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Active Forensic Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {summary.openAlertsCount}
              </span>
              <span className="text-[11px] text-zinc-400">Overlaid on graph</span>
            </div>
          </Card>
        </div>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-4 border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Channel Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Rail:
            </span>
            {(['ALL', 'MPESA', 'BANK', 'IN_KIND'] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setFilterChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterChannel === ch
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {ch === 'ALL' ? 'All Rails' : ch === 'MPESA' ? 'M-Pesa' : ch === 'BANK' ? 'Bank Wires' : 'In-Kind Items'}
              </button>
            ))}
          </div>

          {/* Forensic Anomaly Toggle & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                showFlaggedOnly
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Flagged Risks Only</span>
              {showFlaggedOnly && <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </button>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search node, case, or alert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 min-h-[36px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Loading & Error States */}
      {isLoading && (
        <Card className="p-12 text-center border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Constructing live cryptographic fund flow DAG...
          </p>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-600" />
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Failed to Load Live Fund Flow
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto">
            {(error as any)?.message || 'An error occurred while fetching the live allocation graph from PostgreSQL.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Try Again
          </Button>
        </Card>
      )}

      {/* Main Graph Canvas & Inspector Drawer Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Graph Canvas */}
          <Card className="lg:col-span-8 overflow-hidden border-zinc-200 dark:border-zinc-800 relative">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Live Network Explorer</span>
                <span className="hidden sm:inline">| Click any node to inspect cryptographic audit proof</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">
                  Showing {filteredNodes.length} nodes, {filteredEdges.length} flows
                </span>
              </div>
            </div>

            <div className="overflow-x-auto p-4 bg-zinc-950/[0.02] dark:bg-zinc-950/40">
              <div className="min-w-[900px] select-none">
                {filteredNodes.length === 0 ? (
                  <div className="py-24 text-center space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      No matching nodes found for current filters.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFilterChannel('ALL');
                        setShowFlaggedOnly(false);
                        setSearchQuery('');
                      }}
                      className="text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                      <marker
                        id="arrowhead"
                        viewBox="0 0 10 10"
                        refX="22"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                      </marker>
                      <marker
                        id="arrowhead-flagged"
                        viewBox="0 0 10 10"
                        refX="22"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                      </marker>
                    </defs>

                    {/* Column Headers & Grid Guidelines */}
                    {columnHeaders.map((header, idx) => (
                      <g key={header}>
                        <line
                          x1={colX[idx]}
                          y1={45}
                          x2={colX[idx]}
                          y2={height - 20}
                          stroke="currentColor"
                          strokeOpacity="0.06"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={colX[idx]}
                          y={30}
                          textAnchor="middle"
                          className="fill-zinc-400 dark:fill-zinc-500 text-[11px] font-bold uppercase tracking-wider font-sans"
                        >
                          {header}
                        </text>
                      </g>
                    ))}

                    {/* Directed Edges (Bezier Flow Paths) */}
                    {filteredEdges.map((edge) => {
                      const sourceNode = graphNodes.find((n) => n.id === edge.source);
                      const targetNode = graphNodes.find((n) => n.id === edge.target);
                      if (!sourceNode || !targetNode) return null;

                      const sPos = getNodePos(sourceNode);
                      const tPos = getNodePos(targetNode);
                      const isSelected =
                        selectedNodeId === edge.source || selectedNodeId === edge.target;
                      const dx = (tPos.x - sPos.x) / 2;
                      const pathD = `M ${sPos.x} ${sPos.y} C ${sPos.x + dx} ${sPos.y}, ${tPos.x - dx} ${tPos.y}, ${tPos.x} ${tPos.y}`;

                      return (
                        <g key={edge.id} className="transition-all duration-300">
                          <path
                            d={pathD}
                            fill="none"
                            stroke={
                              edge.flagged
                                ? '#f59e0b'
                                : isSelected
                                ? '#10b981'
                                : '#71717a'
                            }
                            strokeWidth={isSelected ? 3.5 : edge.flagged ? 2.5 : 1.8}
                            strokeOpacity={isSelected ? 0.95 : edge.flagged ? 0.8 : 0.25}
                            strokeDasharray={isSelected ? '6 3' : 'none'}
                            markerEnd={edge.flagged ? 'url(#arrowhead-flagged)' : 'url(#arrowhead)'}
                          />
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {filteredNodes.map((node) => {
                      const { x, y } = getNodePos(node);
                      const isSelected = selectedNode?.id === node.id;
                      const isFlagged = Boolean(node.alertId);

                      const typeColors: Record<NodeType, string> = {
                        INFLOW: 'fill-emerald-500 stroke-emerald-600',
                        POOL: 'fill-blue-500 stroke-blue-600',
                        CASE: 'fill-indigo-500 stroke-indigo-600',
                        SIGNATORY: 'fill-purple-500 stroke-purple-600',
                        DISBURSEMENT: 'fill-teal-500 stroke-teal-600',
                      };

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${x}, ${y})`}
                          onClick={() => setSelectedNodeId(node.id)}
                          className="cursor-pointer group"
                        >
                          {/* Selection Ripple */}
                          {isSelected && (
                            <circle
                              r="26"
                              className="fill-none stroke-emerald-500 stroke-2 animate-ping opacity-40"
                            />
                          )}

                          {/* Outer Flagged Warning Ring */}
                          {isFlagged && (
                            <circle
                              r="23"
                              className="fill-none stroke-amber-500 stroke-2 animate-pulse"
                              strokeDasharray="3 2"
                            />
                          )}

                          {/* Base Node Circle */}
                          <circle
                            r="18"
                            className={`transition-all duration-200 stroke-2 ${
                              isSelected
                                ? 'stroke-zinc-900 dark:stroke-zinc-50 scale-110'
                                : isFlagged
                                ? 'stroke-amber-500'
                                : 'stroke-white dark:stroke-zinc-900'
                            } ${typeColors[node.type]}`}
                          />

                          {/* Node Icon / Type Glyph */}
                          {node.type === 'INFLOW' && (
                            <Coins className="w-4 h-4 -translate-x-2 -translate-y-2 text-white pointer-events-none" />
                          )}
                          {node.type === 'POOL' && (
                            <Layers className="w-4 h-4 -translate-x-2 -translate-y-2 text-white pointer-events-none" />
                          )}
                          {node.type === 'CASE' && (
                            <FileCheck2 className="w-4 h-4 -translate-x-2 -translate-y-2 text-white pointer-events-none" />
                          )}
                          {node.type === 'SIGNATORY' && (
                            <ShieldCheck className="w-4 h-4 -translate-x-2 -translate-y-2 text-white pointer-events-none" />
                          )}
                          {node.type === 'DISBURSEMENT' && (
                            <CheckCircle2 className="w-4 h-4 -translate-x-2 -translate-y-2 text-white pointer-events-none" />
                          )}

                          {/* Alert Badge Indicator */}
                          {isFlagged && (
                            <g transform="translate(11, -15)">
                              <circle r="7" className="fill-amber-500 stroke-white stroke-1" />
                              <text
                                x="0"
                                y="2.5"
                                textAnchor="middle"
                                className="fill-white text-[8px] font-bold font-mono"
                              >
                                !
                              </text>
                            </g>
                          )}

                          {/* Node Label */}
                          <text
                            x="0"
                            y="33"
                            textAnchor="middle"
                            className={`font-mono text-[10px] font-bold select-none transition-colors ${
                              isSelected
                                ? 'fill-emerald-600 dark:fill-emerald-400 font-extrabold'
                                : isFlagged
                                ? 'fill-amber-600 dark:fill-amber-400 font-bold'
                                : 'fill-zinc-800 dark:fill-zinc-200 group-hover:fill-zinc-950 dark:group-hover:fill-white'
                            }`}
                          >
                            {node.label}
                          </text>

                          {/* Node Sublabel */}
                          <text
                            x="0"
                            y="47"
                            textAnchor="middle"
                            className="font-sans text-[9px] fill-zinc-500 dark:fill-zinc-400 select-none max-w-[120px]"
                          >
                            {node.sublabel.length > 20 ? `${node.sublabel.slice(0, 19)}…` : node.sublabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Graph Legend */}
            <div className="p-3 bg-zinc-50/70 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Inflow Lot
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Pool / Earmark
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Need Case
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> Multi-Sig Approver
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> Payout Release
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block ring-2 ring-amber-300 dark:ring-amber-800" /> Flagged Risk
                </span>
              </div>
            </div>
          </Card>

          {/* Selected Node Audit Inspector Drawer */}
          <div className="lg:col-span-4">
            {selectedNode ? (
              <Card className="border-2 border-emerald-500/30 shadow-md">
                <CardHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-400">
                      Node Audit Inspector
                    </span>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CardTitle className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mt-1">
                    {selectedNode.label}
                  </CardTitle>
                  <CardDescription className="text-xs">{selectedNode.sublabel}</CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Forensic Alert Callout if present */}
                  {selectedNode.alertId && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Forensic Alert Triggered (Rule {selectedNode.alertRule})</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{selectedNode.alertText}</p>
                      <Link to={alertsPath} className="inline-block mt-1">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] bg-white dark:bg-zinc-900 border-amber-300">
                          Resolve in Alert Triage
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Amount and Currency */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Node Flow Volume</span>
                    <Money
                      amountMinor={selectedNode.amountMinor}
                      currency={selectedNode.currency}
                      className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                    />
                  </div>

                  {/* Pool Details */}
                  {selectedNode.type === 'POOL' && selectedNode.remainingMinor !== undefined && (
                    <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Unallocated Pool Balance</span>
                      <Money
                        amountMinor={selectedNode.remainingMinor}
                        currency={selectedNode.currency}
                        className="text-sm font-bold text-blue-900 dark:text-blue-100"
                      />
                    </div>
                  )}

                  {/* Details List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                      <span className="text-zinc-500">Node Stage</span>
                      <span className="font-semibold">{selectedNode.type}</span>
                    </div>

                    {selectedNode.channel && (
                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                        <span className="text-zinc-500">Rail Channel</span>
                        <StatusChip status={selectedNode.channel} />
                      </div>
                    )}

                    {selectedNode.metadata?.needCategory && (
                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                        <span className="text-zinc-500">Need Category</span>
                        <span className="font-semibold">{selectedNode.metadata.needCategory}</span>
                      </div>
                    )}

                    {selectedNode.metadata?.state && (
                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                        <span className="text-zinc-500">Case State</span>
                        <StatusChip status={selectedNode.metadata.state} />
                      </div>
                    )}

                    {selectedNode.metadata?.earmark && (
                      <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                        <span className="text-zinc-500">Earmark / Purpose</span>
                        <span className="font-semibold text-[11px] truncate max-w-[180px]">
                          {selectedNode.metadata.earmark}
                        </span>
                      </div>
                    )}

                    {selectedNode.metadata?.justification && (
                      <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                        <span className="text-zinc-500 block">Case Justification</span>
                        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded">
                          {selectedNode.metadata.justification}
                        </p>
                      </div>
                    )}

                    {selectedNode.metadata?.studentIdentifierHash && (
                      <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                        <span className="text-zinc-500 block">Student Identity Hash (Zero-Knowledge)</span>
                        <code className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300 block truncate">
                          {selectedNode.metadata.studentIdentifierHash}
                        </code>
                      </div>
                    )}

                    {selectedNode.metadata?.donorRef && (
                      <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                        <span className="text-zinc-500 block">Donor Reference HMAC</span>
                        <code className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300 block truncate">
                          {selectedNode.metadata.donorRef}
                        </code>
                      </div>
                    )}

                    {selectedNode.metadata?.evidenceCid && (
                      <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                        <span className="text-zinc-500 block">IPFS Proof CID</span>
                        <a
                          href={`https://ipfs.io/ipfs/${selectedNode.metadata.evidenceCid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 break-all"
                        >
                          {selectedNode.metadata.evidenceCid}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {selectedNode.txHash && (
                      <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                        <span className="text-zinc-500 block">Anchor / Ledger Hash</span>
                        <code className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300 block truncate">
                          {selectedNode.txHash}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Direct Action Links */}
                  <div className="pt-2 space-y-2">
                    {selectedNode.type === 'INFLOW' && (
                      <Link to={`/trace?code=${selectedNode.label}`}>
                        <Button variant="emerald" className="w-full text-xs gap-1.5">
                          <Search className="w-3.5 h-3.5" />
                          <span>Trace Receipt on Public Ledger</span>
                        </Button>
                      </Link>
                    )}

                    {selectedNode.type === 'CASE' && (
                      <Link to={casesPath}>
                        <Button variant="emerald" className="w-full text-xs gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Inspect in Cases Queue</span>
                        </Button>
                      </Link>
                    )}

                    {selectedNode.type === 'SIGNATORY' && (
                      <Link to={signingPath}>
                        <Button variant="outline" className="w-full text-xs gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>View 2-of-3 Release Queue</span>
                        </Button>
                      </Link>
                    )}

                    {selectedNode.type === 'DISBURSEMENT' && (
                      <Link to={disbursementsPath}>
                        <Button variant="outline" className="w-full text-xs gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Disbursement Logs</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center text-zinc-500 border-dashed border-2">
                <Network className="w-8 h-8 mx-auto text-zinc-400 mb-2 opacity-50" />
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Node Selected</h3>
                <p className="text-xs mt-1">
                  Click any circle in the graph to inspect cryptographic hashes, allocations, and audit proofs.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
