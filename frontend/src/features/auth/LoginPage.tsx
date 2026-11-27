import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthContext';
import { authStore } from '../../store/auth.store';
import { defaultAuthorizedPath } from '../authorization/permissions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { PortalSession } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const { loginWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithPassword(email.trim(), password);
      if (result?.requiresMfa) {
        navigate('/auth/mfa', { replace: true });
        return;
      }
      const currentSession = (authStore.get() as { session: PortalSession | null }).session;
      const dest = from || defaultAuthorizedPath(currentSession);
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
            C
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in to CharityChain
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Sign in with your verified CharityChain email and password.
          </p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
          <form onSubmit={handleLogin}>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-semibold">Account Sign In</CardTitle>
              <CardDescription className="text-xs">
                Access your donor, operations, committee, treasury, audit, or administrator portal.
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
                <label htmlFor="login-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <Link
                    to="/auth/password-recovery"
                    className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs h-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 text-xs text-zinc-500">
              <div className="w-full flex items-center justify-between">
                <span>New donor?</span>
                <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Create a Donor Account
                </Link>
              </div>
              <div className="w-full flex items-center justify-between">
                <span>MUST Student?</span>
                <Link to="/student/auth/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Student Portal Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default LoginPage;
