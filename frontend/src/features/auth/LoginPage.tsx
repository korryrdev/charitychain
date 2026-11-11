import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  HeartHandshake,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import type { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname;
  const { login, loginWithPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'DONOR' | 'STAFF'>('DONOR');

  // Donor form
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPassword, setDonorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'CUSTODIAN' as UserRole,
      title: 'Pharmacy Custodian',
      name: 'Jane Atieno',
      email: 'pharmacy@malkia.charity',
      desc: 'Logs in-kind intake and issues medicines',
      icon: PackageCheck,
      color: 'bg-amber-500',
    },
    {
      role: 'COMMITTEE' as UserRole,
      title: 'Committee Member',
      name: 'David Kimani',
      email: 'committee@malkia.charity',
      desc: 'Reviews vetting and approves student cases',
      icon: FileCheck2,
      color: 'bg-emerald-600',
    },
    {
      role: 'SIGNATORY' as UserRole,
      title: 'Executive Signatory',
      name: 'Wanjiku Mwangi',
      email: 'signatory1@malkia.charity',
      desc: 'EIP-712 wallet multi-sig fund authorization',
      icon: KeyRound,
      color: 'bg-purple-600',
    },
    {
      role: 'TREASURER' as UserRole,
      title: 'Treasurer',
      name: 'Kevin Otieno',
      email: 'treasurer@malkia.charity',
      desc: 'Verifies bank deposits & reconciles statements',
      icon: Coins,
      color: 'bg-blue-600',
    },
  ];

  const handleDonorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!donorEmail || !donorPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithPassword(donorEmail.trim(), donorPassword);
      const dest = from || '/donor';
      navigate(dest, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (account: (typeof demoAccounts)[0]) => {
    login(account.email, account.role);
    const dest = from || (account.role === 'CUSTODIAN' ? '/app/pharmacy' : '/app');
    navigate(dest, { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
            M
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to CharityChain
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Choose your account type to access the system
          </p>
        </div>

        {/* Tab Switcher: Donor vs Staff Demo */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DONOR');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DONOR'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Donor Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('STAFF');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'STAFF'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Staff Demo Access</span>
          </button>
        </div>

        {/* Tab 1: Donor Sign In */}
        {activeTab === 'DONOR' && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
            <form onSubmit={handleDonorLogin}>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-base font-semibold">Donor Sign In</CardTitle>
                <CardDescription className="text-xs">
                  Access your contributions, badge status, and privacy preferences.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="email"
                      required
                      placeholder="your.email@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="pl-9 text-xs h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Your password"
                      value={donorPassword}
                      onChange={(e) => setDonorPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="emerald"
                  disabled={isLoading}
                  className="w-full text-xs h-10 gap-2 font-semibold shadow-xs"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In to Donor Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>New to CharityChain?</span>
                <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Create a Donor Account
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Tab 2: Staff Demo Access */}
        {activeTab === 'STAFF' && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-semibold">Governance & Staff Demo</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select a role to test case approvals, multi-sig signing, bank verification, and inventory intake.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(account)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${account.color} text-white shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {account.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {account.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </CardContent>

            <CardFooter className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 text-center block">
              Staff roles run with pre-authorized persistent sessions for paired demonstration.
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
export default LoginPage;
