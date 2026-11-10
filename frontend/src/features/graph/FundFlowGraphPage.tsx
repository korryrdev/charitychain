import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import type { Channel, NeedCategory } from '@/types';

export type NodeType = 'INFLOW' | 'POOL' | 'CASE' | 'SIGNATORY' | 'DISBURSEMENT';

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: NodeType;
  channel?: Channel;
  amountMinor: number;
  currency: 'KES' | 'ITM';
  colIndex: number;
  yRatio: number; // 0.0 to 1.0 vertical placement in column
  txHash?: string;
  blockNumber?: number;
  alertId?: string;
  alertRule?: string;
  alertText?: string;
  alertSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-case-142');
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'MPESA' | 'BANK' | 'IN_KIND'>('ALL');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Seed graph nodes matching PRD & current data
  const rawNodes: GraphNode[] = useMemo(
    () => [
      // Column 0: Inflow Lots
      {
        id: 'node-lot-92qd',
        label: 'MLK-7F3K-92QD',
        sublabel: 'M-Pesa Inflow (Wanjiku M.)',
        type: 'INFLOW',
        channel: 'MPESA',
        amountMinor: 50000,
        currency: 'KES',
        colIndex: 0,
        yRatio: 0.18,
        txHash: '0x3a4b9c1d2e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef',
        blockNumber: 4218902,
      },
      {
        id: 'node-lot-88lk',
        label: 'MLK-4B2N-88LK',
        sublabel: 'Bank Wire Transfer',
        type: 'INFLOW',
        channel: 'BANK',
        amountMinor: 250000,
        currency: 'KES',
        colIndex: 0,
        yRatio: 0.52,
        txHash: '0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
        blockNumber: 4220150,
        alertId: 'alert-02',
        alertRule: 'R05',
        alertSeverity: 'LOW',
        alertText: 'Pool Dwell Time Warning: Lot unallocated balance has dwelled >45 days in pool.',
      },
      {
        id: 'node-lot-9201',
        label: 'MLK-ITEM-9201',
        sublabel: 'Pharmacy Textbooks Lot',
        type: 'INFLOW',
        channel: 'IN_KIND',
        amountMinor: 15,
        currency: 'ITM',
        colIndex: 0,
        yRatio: 0.84,
        txHash: '0x99aa88bb77cc66dd55ee44ff33aa22bb11cc00dd99887766554433221100ffaa',
        blockNumber: 4221500,
      },

      // Column 1: Pools / Earmarks
      {
        id: 'node-pool-gen',
        label: 'General Fund Pool',
        sublabel: 'Unrestricted Inflows',
        type: 'POOL',
        channel: 'MPESA',
        amountMinor: 50000,
        currency: 'KES',
        colIndex: 1,
        yRatio: 0.22,
      },
      {
        id: 'node-pool-med',
        label: 'Medical Earmark Pool',
        sublabel: 'Restricted Health Relief',
        type: 'POOL',
        channel: 'BANK',
        amountMinor: 250000,
        currency: 'KES',
        colIndex: 1,
        yRatio: 0.52,
        alertId: 'alert-02',
        alertRule: 'R05',
        alertSeverity: 'LOW',
        alertText: 'Pool Dwell Time Warning: 130,000 KES minor unallocated >45 days.',
      },
      {
        id: 'node-pool-itm',
        label: 'Pharmacy Dispensary Lot',
        sublabel: 'Physical Supply Inventory',
        type: 'POOL',
        channel: 'IN_KIND',
        amountMinor: 15,
        currency: 'ITM',
        colIndex: 1,
        yRatio: 0.84,
      },

      // Column 2: Student Cases
      {
        id: 'node-case-142',
        label: 'CASE-2026-0142',
        sublabel: 'Tuition Top-up (Engineering)',
        type: 'CASE',
        amountMinor: 450000,
        currency: 'KES',
        colIndex: 2,
        yRatio: 0.16,
      },
      {
        id: 'node-case-143',
        label: 'CASE-2026-0143',
        sublabel: 'Textbook Grant (Science)',
        type: 'CASE',
        amountMinor: 15000,
        currency: 'KES',
        colIndex: 2,
        yRatio: 0.44,
      },
      {
        id: 'node-case-145',
        label: 'CASE-2026-0145',
        sublabel: 'Emergency Medical (Health)',
        type: 'CASE',
        amountMinor: 250000,
        currency: 'KES',
        colIndex: 2,
        yRatio: 0.74,
      },

      // Column 3: Signatories (EIP-712 Multi-Sig)
      {
        id: 'node-sig-wanjiku',
        label: 'Wanjiku Mwangi (0x90F7)',
        sublabel: 'Executive Chair (Signer 1)',
        type: 'SIGNATORY',
        amountMinor: 450000,
        currency: 'KES',
        colIndex: 3,
        yRatio: 0.22,
        alertId: 'alert-01',
        alertRule: 'R10',
        alertSeverity: 'MEDIUM',
        alertText: 'Signatory Concentration Risk (R10): 0x90F7 signed 92% of all releases in past 30 days.',
      },
      {
        id: 'node-sig-kevin',
        label: 'Kevin Otieno (0x15d3)',
        sublabel: 'Treasurer (Signer 2)',
        type: 'SIGNATORY',
        amountMinor: 450000,
        currency: 'KES',
        colIndex: 3,
        yRatio: 0.54,
        alertId: 'alert-01',
        alertRule: 'R10',
        alertSeverity: 'MEDIUM',
        alertText: 'Signatory Concentration Risk (R10): Pair 0x90F7 + 0x15d3 dominates approval flow.',
      },
      {
        id: 'node-sig-amina',
        label: 'Dr. Amina Hassan (0x2546)',
        sublabel: 'Staff Rep (Signer 3)',
        type: 'SIGNATORY',
        amountMinor: 0,
        currency: 'KES',
        colIndex: 3,
        yRatio: 0.84,
      },

      // Column 4: Disbursements & Real Payouts
      {
        id: 'node-disb-mpesa',
        label: 'M-Pesa B2C SGH98214K',
        sublabel: 'Bank-to-Phone Payment',
        type: 'DISBURSEMENT',
        channel: 'MPESA',
        amountMinor: 450000,
        currency: 'KES',
        colIndex: 4,
        yRatio: 0.25,
      },
      {
        id: 'node-disb-pharm',
        label: 'Physical Handover #089',
        sublabel: 'Pharmacy Desk Dispensed',
        type: 'DISBURSEMENT',
        channel: 'IN_KIND',
        amountMinor: 3,
        currency: 'ITM',
        colIndex: 4,
        yRatio: 0.65,
      },
    ],
    []
  );

  const rawEdges: GraphEdge[] = useMemo(
    () => [
      // Inflow Lots -> Pools
      { id: 'e1', source: 'node-lot-92qd', target: 'node-pool-gen', amountMinor: 50000, currency: 'KES', channel: 'MPESA' },
      { id: 'e2', source: 'node-lot-88lk', target: 'node-pool-med', amountMinor: 250000, currency: 'KES', channel: 'BANK', flagged: true },
      { id: 'e3', source: 'node-lot-9201', target: 'node-pool-itm', amountMinor: 15, currency: 'ITM', channel: 'IN_KIND' },

      // Pools -> Cases
      { id: 'e4', source: 'node-pool-gen', target: 'node-case-142', amountMinor: 35000, currency: 'KES', channel: 'MPESA' },
      { id: 'e5', source: 'node-pool-gen', target: 'node-case-143', amountMinor: 15000, currency: 'KES', channel: 'MPESA' },
      { id: 'e6', source: 'node-pool-med', target: 'node-case-145', amountMinor: 120000, currency: 'KES', channel: 'BANK' },
      { id: 'e7', source: 'node-pool-itm', target: 'node-case-143', amountMinor: 3, currency: 'ITM', channel: 'IN_KIND' },

      // Cases -> Signatories
      { id: 'e8', source: 'node-case-142', target: 'node-sig-wanjiku', amountMinor: 450000, currency: 'KES', flagged: true },
      { id: 'e9', source: 'node-case-142', target: 'node-sig-kevin', amountMinor: 450000, currency: 'KES', flagged: true },
      { id: 'e10', source: 'node-case-145', target: 'node-sig-wanjiku', amountMinor: 250000, currency: 'KES' },

      // Signatories -> Disbursements
      { id: 'e11', source: 'node-sig-wanjiku', target: 'node-disb-mpesa', amountMinor: 450000, currency: 'KES' },
      { id: 'e12', source: 'node-sig-kevin', target: 'node-disb-mpesa', amountMinor: 450000, currency: 'KES' },
      { id: 'e13', source: 'node-case-143', target: 'node-disb-pharm', amountMinor: 3, currency: 'ITM', channel: 'IN_KIND' },
    ],
    []
  );

  // Apply filters
  const filteredNodes = useMemo(() => {
    return rawNodes.filter((node) => {
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
        if (!matchLabel && !matchSub) return false;
      }
      return true;
    });
  }, [rawNodes, filterChannel, showFlaggedOnly, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return rawEdges.filter((edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target));
  }, [rawEdges, activeNodeIds]);

  const selectedNode = useMemo(() => {
    return rawNodes.find((n) => n.id === selectedNodeId) || null;
  }, [rawNodes, selectedNodeId]);

  // Layout parameters for SVG
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
    '4. 2-of-3 Signatories',
    '5. Real Payouts',
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Network className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Interactive Fund Flow Network
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visual audit graph tracking every contribution through pooling, student need approvals, 2-of-3 multi-sig, and final payouts.
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
            }}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </Button>
          <Link to="/app/alerts">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 text-amber-600 border-amber-300 dark:border-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>View Forensic Inbox (2)</span>
            </Button>
          </Link>
        </div>
      </div>

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
                placeholder="Search node or case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 min-h-[36px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Graph Canvas & Inspector Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive SVG Graph Canvas */}
        <Card className="lg:col-span-8 overflow-hidden border-zinc-200 dark:border-zinc-800 relative">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Live Network Explorer</span>
              <span className="hidden sm:inline">| Click any node to inspect audit proof</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Showing {filteredNodes.length} nodes, {filteredEdges.length} flows</span>
            </div>
          </div>

          <div className="overflow-x-auto p-4 bg-zinc-950/[0.02] dark:bg-zinc-950/40">
            <div className="min-w-[900px] select-none">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs>
                  {/* Marker for directed arrowheads */}
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
                  const sourceNode = rawNodes.find((n) => n.id === edge.source);
                  const targetNode = rawNodes.find((n) => n.id === edge.target);
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
                  const isSelected = selectedNodeId === node.id;
                  const isFlagged = Boolean(node.alertId);

                  // Colors by type
                  const typeColors = {
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
                      {/* Alert Pulse Ring if flagged */}
                      {isFlagged && (
                        <circle
                          r="28"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeOpacity="0.4"
                          className="animate-ping"
                        />
                      )}

                      {/* Selection Glow */}
                      {isSelected && (
                        <circle
                          r="26"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeOpacity="0.6"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r="20"
                        className={`transition-all duration-200 ${
                          isFlagged
                            ? 'fill-amber-500 stroke-amber-600'
                            : isSelected
                            ? 'fill-emerald-600 stroke-emerald-700 ring-2'
                            : typeColors[node.type]
                        }`}
                        strokeWidth="3"
                      />

                      {/* Node Icon / Letter */}
                      <text
                        textAnchor="middle"
                        dy="4.5"
                        className="fill-white font-bold text-xs pointer-events-none select-none font-sans"
                      >
                        {node.type === 'INFLOW'
                          ? 'IN'
                          : node.type === 'POOL'
                          ? 'PL'
                          : node.type === 'CASE'
                          ? 'CS'
                          : node.type === 'SIGNATORY'
                          ? 'SG'
                          : 'DS'}
                      </text>

                      {/* Node Primary Label */}
                      <text
                        x="0"
                        y="34"
                        textAnchor="middle"
                        className={`font-mono text-[11px] font-bold select-none ${
                          isSelected
                            ? 'fill-emerald-600 dark:fill-emerald-400 font-extrabold'
                            : 'fill-zinc-800 dark:fill-zinc-200'
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
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> 2-of-3 Signer
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block ring-2 ring-amber-300 dark:ring-amber-800" /> Flagged Risk
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Strict Rule: Real money on MPESA/Bank, Polygon Amoy as notary.</span>
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
                    <Link to="/app/alerts" className="inline-block mt-1">
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

                  {selectedNode.blockNumber && (
                    <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                      <span className="text-zinc-500">Polygon Amoy Block</span>
                      <span className="font-mono font-medium">#{selectedNode.blockNumber}</span>
                    </div>
                  )}

                  {selectedNode.txHash && (
                    <div className="py-1 border-b border-zinc-100 dark:border-zinc-800/60 space-y-1">
                      <span className="text-zinc-500 block">Transaction Hash</span>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${selectedNode.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 break-all"
                      >
                        {selectedNode.txHash}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Direct Action Link */}
                <div className="pt-2">
                  {selectedNode.type === 'INFLOW' && (
                    <Link to={`/trace?code=${selectedNode.label}`}>
                      <Button variant="emerald" className="w-full text-xs gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span>Trace Receipt on Public Ledger</span>
                      </Button>
                    </Link>
                  )}

                  {selectedNode.type === 'CASE' && (
                    <Link to="/app/cases">
                      <Button variant="emerald" className="w-full text-xs gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Inspect in Cases Queue</span>
                      </Button>
                    </Link>
                  )}

                  {selectedNode.type === 'SIGNATORY' && (
                    <Link to="/app/signing">
                      <Button variant="outline" className="w-full text-xs gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>View 2-of-3 Release Queue</span>
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
              <p className="text-xs mt-1">Click any circle in the graph to inspect cryptographic hashes and flow splits.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

