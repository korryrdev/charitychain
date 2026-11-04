import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ShieldCheck, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';
import type { ForensicAlert } from '@/types';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<ForensicAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['forensic-alerts'],
    queryFn: () => api.getForensicAlerts(),
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

  const severityStyles: Record<string, string> = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          Forensic Fund Flow Alert Inbox
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Automated rule engine monitoring suspicious patterns, pool balance drift, self-approvals, and concentration risks.
        </p>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-400">Scanning forensic engine...</div>
      ) : alerts.length === 0 ? (
        <Card className="p-12 text-center text-zinc-500">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          All rules evaluated clean. No open forensic anomalies detected.
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
                      Rule {alert.ruleId}
                    </span>
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {alert.ruleTitle}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        severityStyles[alert.severity]
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
                    <span>•</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      Investigate & Resolve
                    </Button>
                  )}
                </div>
              </div>

              {alert.status === 'RESOLVED' && alert.resolutionNote && (
                <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Resolution Note:</span>{' '}
                  {alert.resolutionNote}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white dark:bg-zinc-900 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Resolve Alert {selectedAlert.ruleId}: {selectedAlert.ruleTitle}
              </CardTitle>
              <CardDescription>
                Auditable action: Document the findings of your investigation before resolving.
              </CardDescription>
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
                  placeholder="e.g., Verified with Signatory 3 that they were on leave; no evidence of collusion."
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

