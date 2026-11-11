import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldAlert, CheckCircle2, AlertTriangle, Lock, FileText } from 'lucide-react';

export const FraudReportPage: React.FC = () => {
  const [reportType, setReportType] = useState('RECEIPT_ANOMALY');
  const [reference, setReference] = useState('');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-rose-600" />
          Report suspected fraud & anomalies
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          CharityChain maintains a zero-tolerance policy for diversion, false receipts, and unauthorized collections. Reports are routed to the independent forensic audit queue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <Lock className="w-4 h-4 text-emerald-600" />
            Confidential
          </div>
          <p className="text-zinc-500">Your report is encrypted and accessible only by authorized forensic auditors.</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <FileText className="w-4 h-4 text-blue-600" />
            Preserve Evidence
          </div>
          <p className="text-zinc-500">Retain dates, M-Pesa transaction IDs, bank wire numbers, or printed receipts.</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Forensic Cross-Check
          </div>
          <p className="text-zinc-500">Every submission triggers automated rule checks against on-chain lot records.</p>
        </div>
      </div>

      {submitted ? (
        <Card className="border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Report received</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Your incident report has been anchored and assigned for audit investigation. Thank you for protecting the integrity of student emergency relief.
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Incident details</CardTitle>
            <CardDescription>
              Provide specific reference numbers (receipt codes, case IDs, or transaction hashes) if available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Anomaly Category
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <option value="RECEIPT_ANOMALY">Receipt Code Mismatch or Duplicate</option>
                  <option value="UNAUTHORIZED_COLLECTION">Unauthorized Relief Item Collection</option>
                  <option value="PAYOUT_DISCREPANCY">Disbursement / Fee Payment Discrepancy</option>
                  <option value="IMPERSONATION">Suspected Student or Signatory Impersonation</option>
                  <option value="OTHER">Other Compliance Anomaly</option>
                </select>
              </div>

              <Input
                label="Reference Code (Receipt, Case Number, or Bank Ref)"
                placeholder="e.g. MLK-7F3K-92QD or CASE-2026-0142"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the sequence of events, personnel involved, and any observable irregularities..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <Input
                label="Contact Email or Phone (Optional for follow-up)"
                placeholder="e.g. whistleblower@malkia.charity (leave blank to stay anonymous)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />

              <Button type="submit" variant="emerald" className="w-full text-xs font-bold">
                Submit Report to Forensic Auditor
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

