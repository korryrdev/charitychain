import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { StatusChip } from '@/components/StatusChip';
import { useAuth } from '@/app/auth/AuthContext';
import { Coins, CheckCircle, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface BankDeposit {
  id: string;
  bankRef: string;
  amountMinor: number;
  enteredBy: string;
  verifiedBy?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED';
  depositedAt: string;
}

export const DonationsPage: React.FC = () => {
  const { user } = useAuth();
  const [bankRef, setBankRef] = useState('');
  const [amountMajor, setAmountMajor] = useState('');

  const [deposits, setDeposits] = useState<BankDeposit[]>([
    {
      id: 'dep-1',
      bankRef: 'WIRE-992140',
      amountMinor: 10000000, // KES 100,000.00
      enteredBy: 'treasurer-1',
      status: 'PENDING_VERIFICATION',
      depositedAt: '2026-10-25T09:30:00Z',
    },
    {
      id: 'dep-2',
      bankRef: 'WIRE-881204',
      amountMinor: 5000000, // KES 50,000.00
      enteredBy: 'treasurer-2',
      verifiedBy: 'chair@malkia.charity',
      status: 'VERIFIED',
      depositedAt: '2026-10-20T14:15:00Z',
    },
  ]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountMajor || !bankRef) return;
    const amountMinor = Math.round(parseFloat(amountMajor) * 100);

    const newDep: BankDeposit = {
      id: `dep-${Date.now()}`,
      bankRef: bankRef.toUpperCase(),
      amountMinor,
      enteredBy: user?.email || 'current-user',
      status: 'PENDING_VERIFICATION',
      depositedAt: new Date().toISOString(),
    };

    setDeposits([newDep, ...deposits]);
    setBankRef('');
    setAmountMajor('');
  };

  const handleVerify = (id: string) => {
    setDeposits((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          // Check maker-checker rule
          if (d.enteredBy === (user?.email || 'current-user')) {
            alert('Segregation of Duties Enforced: Maker cannot verify own deposit entry (Rule R04).');
            return d;
          }
          return {
            ...d,
            status: 'VERIFIED',
            verifiedBy: user?.email || 'current-user',
          };
        }
        return d;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
          <Coins className="w-6 h-6 text-emerald-600" />
          Bank Wire Deposits & Maker-Checker Verification
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Direct bank deposits require dual verification (two distinct treasurers or committee members) before lot creation and blockchain anchoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">Log Bank Deposit</CardTitle>
            <CardDescription>Enter bank statement wire details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Bank Statement Wire Reference"
                placeholder="e.g. WIRE-892100"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                required
              />
              <Input
                label="Amount (KES)"
                type="number"
                min="100"
                step="50"
                placeholder="e.g. 50000"
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                required
              />
              <Button type="submit" variant="emerald" className="w-full">
                Submit for Second Verification
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Maker-Checker Verification Queue</CardTitle>
            <CardDescription>
              A deposit cannot be verified by the person who entered it (Rule R04).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {deposits.map((d) => {
                const isMaker = d.enteredBy === (user?.email || 'current-user');
                return (
                  <div
                    key={d.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {d.bankRef}
                        </span>
                        <StatusChip status={d.status === 'VERIFIED' ? 'POOLED' : 'UNDER_REVIEW'} />
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 space-x-2">
                        <span>Entered by: <strong className="text-zinc-700 dark:text-zinc-300">{d.enteredBy}</strong></span>
                        {d.verifiedBy && (
                          <span>• Verified by: <strong className="text-emerald-600">{d.verifiedBy}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Money amountMinor={d.amountMinor} className="text-lg font-bold" />
                      {d.status === 'PENDING_VERIFICATION' && (
                        <Button
                          size="sm"
                          variant={isMaker ? 'outline' : 'emerald'}
                          onClick={() => handleVerify(d.id)}
                          className="text-xs shrink-0"
                        >
                          {isMaker ? 'Self-Verify Blocked' : 'Verify & Anchor Lot'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

