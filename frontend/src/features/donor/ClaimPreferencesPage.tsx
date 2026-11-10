import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/Money';
import { DonorBadge } from '@/components/ui/Badge';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Eye,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  User,
  HeartHandshake,
} from 'lucide-react';
import type { DisplayMode, DonorClaimProfile } from '@/types';

export const ClaimPreferencesPage: React.FC = () => {
  const navigate = useNavigate();

  // Receipt Claim Input State
  const [receiptInput, setReceiptInput] = useState('MLK-7F3K-92QD');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [claimProfile, setClaimProfile] = useState<DonorClaimProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preference Form State
  const [displayMode, setDisplayMode] = useState<DisplayMode>('ALIAS');
  const [customName, setCustomName] = useState('Wanjiku M.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLookupReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptInput.trim()) return;

    setErrorMsg(null);
    setIsLoadingProfile(true);

    try {
      const profile = await api.getDonorClaimProfile(receiptInput.trim());
      setClaimProfile(profile);
      setDisplayMode(profile.displayMode);
      setCustomName(profile.displayName || (profile.displayMode === 'ALIAS' ? 'Wanjiku M.' : ''));
    } catch (err: any) {
      setErrorMsg(err.message || 'Receipt code could not be verified.');
      setClaimProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimProfile) return;

    setErrorMsg(null);
    setIsSaving(true);

    try {
      await api.updateDonorPreferences(claimProfile.receiptCode, displayMode, customName);
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/wall');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Donor Privacy & Recognition
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Enter your receipt code to privately review your verified giving, compute your badge tier, and control your public visibility.
        </p>
      </div>

      {/* Step 1: Receipt Code Lookup */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            1. Enter Your Receipt Code
          </CardTitle>
          <CardDescription>
            Found on your M-Pesa SMS confirmation, bank wire slip, or physical pharmacy receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookupReceipt} className="flex gap-2">
            <Input
              type="text"
              value={receiptInput}
              onChange={(e) => setReceiptInput(e.target.value)}
              placeholder="e.g. MLK-7F3K-92QD"
              className="font-mono uppercase tracking-wider text-sm"
              required
            />
            <Button type="submit" variant="emerald" disabled={isLoadingProfile} className="shrink-0">
              {isLoadingProfile ? 'Verifying...' : 'Claim Receipt'}
            </Button>
          </form>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 & 3: Private View & Preferences (Once Claimed) */}
      {claimProfile && (
        <div className="space-y-6">
          {/* Private Giving Stats (FR-DON-11) */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-zinc-900 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400">
                  Private Giver Summary (Only you see this)
                </span>
                <span className="text-xs text-zinc-400 font-mono">Ref: {claimProfile.donorRef}</span>
              </div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-1">
                <DonorBadge tier={claimProfile.activeTier} />
                {claimProfile.isConsistentGiver && <DonorBadge tier="CONSISTENT" />}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Verified Yearly Giving</span>
                  <Money
                    amountMinor={claimProfile.cumulativeMinor}
                    className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block">Next Tier Progress</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {claimProfile.nextTierThresholdMinor
                      ? `KES ${(claimProfile.nextTierThresholdMinor / 100).toLocaleString()} to Silver`
                      : 'Max Tier Reached'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Bronze Tier (KES 500)</span>
                  <span>Silver Tier (KES 1,000)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Mode Selection & Name Preview (FR-DON-02, FR-DON-05) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                2. Choose Public Display Mode
              </CardTitle>
              <CardDescription>
                You control whether your name appears on the Public Recognition Wall. Anonymous is always our default.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSavePreferences}>
              <CardContent className="space-y-5">
                {/* Mode Choices */}
                <div className="space-y-2.5">
                  {[
                    {
                      mode: 'ANONYMOUS' as DisplayMode,
                      title: 'Anonymous (Default)',
                      desc: 'No name displayed anywhere. Your gift is counted only in the aggregate anonymous total.',
                    },
                    {
                      mode: 'ALIAS' as DisplayMode,
                      title: 'Pseudonymous Initials / Alias',
                      desc: 'Shows an abbreviation (e.g. Wanjiku M. or Kamau N.) to protect personal identity.',
                    },
                    {
                      mode: 'NAMED' as DisplayMode,
                      title: 'Full Public Name or Organization',
                      desc: 'Display your full name or alumni group (e.g. "Alumni Class of 2025").',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.mode}
                      className={`block p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        displayMode === opt.mode
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="displayMode"
                          value={opt.mode}
                          checked={displayMode === opt.mode}
                          onChange={() => setDisplayMode(opt.mode)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{opt.title}</span>
                          <p className="text-zinc-500 dark:text-zinc-400 leading-normal">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Name / Alias Input (if not anonymous) */}
                {displayMode !== 'ANONYMOUS' && (
                  <div className="space-y-1.5 pt-2">
                    <Input
                      label={displayMode === 'ALIAS' ? 'Preferred Alias / Initials' : 'Public Display Name'}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={displayMode === 'ALIAS' ? 'e.g. Wanjiku M.' : 'e.g. Alumni Class of 2025'}
                      required
                      className="text-xs"
                    />
                    <span className="text-[11px] text-zinc-400 block">
                      Screened automatically against impersonation and reserved keywords (Rule FR-DON-05).
                    </span>
                  </div>
                )}

                {/* Real-time Preview Card (FR-DON-05: preview before confirming) */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-500 block uppercase tracking-wide">
                    Live Preview on Public Recognition Wall:
                  </span>
                  <div className="p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {displayMode === 'ANONYMOUS' ? 'Anonymous Supporter' : customName || 'Your Name Here'}
                      </p>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {displayMode === 'ANONYMOUS'
                          ? 'Aggregated into anonymous count'
                          : `Awarded November 2026`}
                      </span>
                    </div>
                    {displayMode !== 'ANONYMOUS' && <DonorBadge tier={claimProfile.activeTier} />}
                  </div>
                  <span className="text-[10px] text-zinc-400 block italic">
                    Amounts and exact donation dates are strictly omitted per Rule FR-DON-12.
                  </span>
                </div>

                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Preferences successfully updated! Redirecting to Public Recognition Wall...</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setClaimProfile(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="emerald"
                  size="sm"
                  disabled={isSaving || saveSuccess}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Confirm & Save Recognition'}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

