import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  UserCheck,
  PackageCheck,
  Coins,
  FileCheck2,
} from 'lucide-react';
import type { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('chair@malkia.charity');
  const [password, setPassword] = useState('••••••••••••');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState<'CREDENTIALS' | 'TOTP'>('CREDENTIALS');
  const [selectedRole, setSelectedRole] = useState<UserRole>('COMMITTEE');

  const demoAccounts = [
    {
      role: 'CUSTODIAN' as UserRole,
      title: 'Pharmacy Custodian',
      name: 'Jane Atieno',
      email: 'pharmacy@malkia.charity',
      desc: 'Hospital pharmacy desk. Keys in physical items & issues stock.',
      icon: PackageCheck,
      color: 'bg-amber-500',
    },
    {
      role: 'COMMITTEE' as UserRole,
      title: 'Committee Member',
      name: 'David Kimani',
      email: 'committee@malkia.charity',
      desc: 'Reviews student need cases & determines approved amounts.',
      icon: FileCheck2,
      color: 'bg-emerald-600',
    },
    {
      role: 'SIGNATORY' as UserRole,
      title: 'Executive Signatory',
      name: 'Wanjiku Mwangi',
      email: 'signatory1@malkia.charity',
      desc: 'Signs 2-of-3 EIP-712 wallet releases for fund disbursements.',
      icon: KeyRound,
      color: 'bg-purple-600',
    },
    {
      role: 'TREASURER' as UserRole,
      title: 'Treasurer',
      name: 'Kevin Otieno',
      email: 'treasurer@malkia.charity',
      desc: 'Enters bank wire statements & reconciles accounts.',
      icon: Coins,
      color: 'bg-blue-600',
    },
  ];

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep('TOTP');
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
    navigate('/app');
  };

  const handleQuickDemoLogin = (account: (typeof demoAccounts)[0]) => {
    login(account.email, account.role);
    navigate(account.role === 'CUSTODIAN' ? '/app/pharmacy' : '/app');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-sm">
            M
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Malkia Governance Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Authorized access for Committee, Executive Signatories, and Pharmacy Custodians.
          </p>
        </div>

        {/* Credentials / 2FA Form Card */}
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800">
          {step === 'CREDENTIALS' ? (
            <form onSubmit={handleCredentialsSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Step 1: Account Authentication
                </CardTitle>
                <CardDescription>
                  Enter your registered university email and credentials.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button type="submit" variant="emerald" className="w-full gap-2">
                  <span>Continue to 2FA Step</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Step 2: Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>
                  Enter the 6-digit TOTP code from your authenticator app (PRD FR-AUTH-01).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Input
                  label="TOTP 6-Digit Code"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 592810"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 text-center">
                  Demo tip: Any 6 digits or clicking Verify will authenticate into your session.
                </p>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pt-2">
                <Button type="submit" variant="emerald" className="w-full">
                  Verify & Enter Portal
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('CREDENTIALS')}
                  className="w-full text-xs"
                >
                  Back to email
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>

        {/* 1-Click Fast Demo Personas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            1-Click Persona Sign-in (Demo Fast Pass)
          </div>

          <div className="grid grid-cols-1 gap-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleQuickDemoLogin(account)}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:shadow-xs transition-all text-left flex items-start gap-3 group"
                >
                  <div className={`p-2 rounded-lg ${account.color} text-white shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                        {account.title} ({account.name})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{account.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

