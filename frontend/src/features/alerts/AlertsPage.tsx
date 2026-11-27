import React, { useState, useSyncExternalStore } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { authStore } from '@/store/auth.store';
import { hasPermission } from '@/features/authorization/permissions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  BarChart3,
  Play,
  AlertCircle,
} from 'lucide-react';
import type {
  BenfordAnalysisResponse,
  ForensicAlert,
  ForensicRuleConfig,
  PortalSession,
} from '@/types';

const EXPECTED_BENFORD = [
  { digit: 1, pct: 30.1 },
  { digit: 2, pct: 17.6 },
  { digit: 3, pct: 12.5 },
  { digit: 4, pct: 9.7 },
  { digit: 5, pct: 7.9 },
  { digit: 6, pct: 6.7 },
  { digit: 7, pct: 5.8 },
  { digit: 8, pct: 5.1 },
  { digit: 9, pct: 4.6 },
];

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSyncExternalStore(authStore.subscribe, authStore.get) as {
    session: PortalSession | null;
  };
  const canResolve = Boolean(session && hasPermission(session, 'alert:resolve'));
  const canManageRules = Boolean(session && hasPermission(session, 'rules:manage'));

  const [selectedAlert, setSelectedAlert] = useState<ForensicAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [thresholdJsonDraft, setThresholdJsonDraft] = useState('{}');
  const [ruleError, setRuleError] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery<ForensicAlert[]>({
    queryKey: ['forensic-alerts'],
    queryFn: () => api.getForensicAlerts(),
  });

  const { data: rules = [] } = useQuery<ForensicRuleConfig[]>({
    queryKey: ['forensic-rules'],
    queryFn: () => api.getAlertRules(),
  });

  const { data: benford } = useQuery<BenfordAnalysisResponse>({
    queryKey: ['forensic-benford'],
    queryFn: () => api.getBenfordAnalysis(),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return api.resolveAlert(id, note);
    },
    onSuccess: () => {
      setSelectedAlert(null);
      setResolutionNote('');
      queryClient.invalidateQueries({ queryKey: ['forensic-alerts'] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: () => api.runForensicScan(),
    onSuccess: (res) => {
      setScanMessage(
        `Scanned ${res.rulesRun} rules; generated ${res.alertsGeneratedCount} new alert(s).`
      );
      queryClient.invalidateQueries({ queryKey: ['forensic-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['forensic-benford'] });
    },
    onError: (err: unknown) => {
      setScanMessage(err instanceof Error ? err.message : 'Forensic scan failed.');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({
      ruleId,
      isEnabled,
      thresholdParams,
    }: {
      ruleId: string;
      isEnabled?: boolean;
      thresholdParams?: Record<string, any>;
    }) => api.updateAlertRule(ruleId, { isEnabled, thresholdParams }),
    onSuccess: () => {
      setRuleError(null);
      setEditingRuleId(null);
      queryClient.invalidateQueries({ queryKey: ['forensic-rules'] });
    },
    onError: (err: unknown) => {
      setRuleError(err instanceof Error ? err.message : 'Unable to update rule threshold.');
    },
  });

  const severityStyles: Record<string, string> = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    MEDIUM:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    CRITICAL:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  const activeBenford = benford?.combined;
  const dist = activeBenford?.distribution;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Forensic Alerts, Benford&apos;s Law &amp; Rule Tuning
        </h1>

        {canResolve && (
          <Button
            variant="emerald"
            size="sm"
            onClick={() => scanMutation.mutate()}
            isLoading={scanMutation.isPending}
            className="gap-1.5 shrink-0"
          >
            <Play className="w-4 h-4" />
            Run Forensic Scan
          </Button>
        )}
      </div>

      {scanMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          {scanMessage}
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-400">Scanning forensic engine...</div>
      ) : alerts.length === 0 ? (
        <Card className="p-8 text-center text-zinc-500">
          <ShieldCheck className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
          All rules evaluated clean. No open forensic anomalies detected.
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                      Rule {alert.ruleId}
                    </span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {alert.ruleTitle}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        severityStyles[alert.severity] || severityStyles.MEDIUM
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      Risk Score: {alert.riskScore}/100
                    </span>
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{alert.why}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                    <span>Target: {alert.subjectKind}</span>
                    <span>&bull;</span>
                    <span>Detected {new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {alert.status === 'RESOLVED' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolved
                    </span>
                  ) : (
                    canResolve && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Investigate &amp; Resolve
                      </Button>
                    )
                  )}
                </div>
              </div>

              {alert.status === 'RESOLVED' && alert.resolutionNote && (
                <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Resolution Note:
                  </span>{' '}
                  {alert.resolutionNote}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Benford's Law First-Digit Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Benford&apos;s Law First-Digit Distribution (Rule R14)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              Combined Samples: <strong>{activeBenford?.sampleSize ?? 0}</strong> (min 20 for chi-square)
            </span>
            <span>&bull;</span>
            <span>
              Chi-Square: <strong>{activeBenford?.chiSquare ?? 0}</strong> / Critical{' '}
              <strong>{benford?.criticalValue ?? 15.51}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Status:{' '}
              <strong
                className={
                  activeBenford?.isAnomalous ? 'text-rose-600' : 'text-emerald-600'
                }
              >
                {activeBenford && activeBenford.sampleSize >= 20
                  ? activeBenford.isAnomalous
                    ? 'Anomalous Drift'
                    : 'Within Expected Curve'
                  : 'Insufficient Sample (< 20)'}
              </strong>
            </span>
          </div>

          <div className="space-y-2">
            {EXPECTED_BENFORD.map(({ digit, pct }) => {
              const observedRow = dist?.[String(digit)];
              const observedPct = observedRow?.observedPct ?? 0;
              return (
                <div key={digit} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-1 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    #{digit}
                  </span>
                  <div className="col-span-8 h-4 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                    <div
                      className="h-full bg-zinc-400/35 absolute top-0 left-0"
                      style={{ width: `${Math.min(100, pct * 2.5)}%` }}
                      title={`Expected ${pct}%`}
                    />
                    <div
                      className="h-2.5 mt-0.75 rounded bg-emerald-600 relative z-10"
                      style={{ width: `${Math.min(100, observedPct * 2.5)}%` }}
                      title={`Observed ${observedPct}%`}
                    />
                  </div>
                  <span className="col-span-3 text-right font-mono text-[11px] text-zinc-500">
                    Obs {observedPct.toFixed(1)}% / Exp {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Rule Threshold Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
            Forensic Rule Configuration &amp; Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ruleError && (
            <div
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ruleError}</span>
            </div>
          )}

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {rule.id}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {rule.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        severityStyles[rule.severity] || severityStyles.MEDIUM
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-zinc-500">{rule.description}</p>
                  {editingRuleId === rule.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={thresholdJsonDraft}
                        onChange={(e) => setThresholdJsonDraft(e.target.value)}
                        className="font-mono text-xs px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 min-w-[260px]"
                      />
                      <Button
                        size="sm"
                        variant="emerald"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(thresholdJsonDraft || '{}');
                            updateRuleMutation.mutate({ ruleId: rule.id, thresholdParams: parsed });
                          } catch {
                            setRuleError('Threshold parameters must be valid JSON.');
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRuleId(null);
                          setRuleError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="font-mono text-[11px] text-zinc-500">
                      Params: {JSON.stringify(rule.thresholdParams ?? {})}
                    </div>
                  )}
                </div>

                {canManageRules && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={rule.isEnabled ? 'emerald' : 'outline'}
                      onClick={() =>
                        updateRuleMutation.mutate({
                          ruleId: rule.id,
                          isEnabled: !rule.isEnabled,
                        })
                      }
                    >
                      {rule.isEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRuleId(rule.id);
                        setThresholdJsonDraft(JSON.stringify(rule.thresholdParams ?? {}));
                        setRuleError(null);
                      }}
                    >
                      Tune Threshold
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white dark:bg-zinc-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Resolve Alert {selectedAlert.ruleId}: {selectedAlert.ruleTitle}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {selectedAlert.why}
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Resolution Explanation (Mandatory)
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  required
                  placeholder="Provide verification evidence and resolution findings..."
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>
            </CardContent>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlert(null)}
              >
                Cancel
              </Button>
              <Button
                variant="emerald"
                size="sm"
                disabled={!resolutionNote.trim() || resolveMutation.isPending}
                isLoading={resolveMutation.isPending}
                onClick={() =>
                  resolveMutation.mutate({ id: selectedAlert.id, note: resolutionNote.trim() })
                }
              >
                Record Resolution in Audit Log
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
