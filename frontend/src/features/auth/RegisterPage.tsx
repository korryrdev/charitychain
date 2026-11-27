import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  HeartHandshake,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Award,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerDonor } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 12) {
      setErrorMsg('Password must be at least 12 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await registerDonor(name.trim(), email.trim(), password);
      navigate('/donor', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create donor account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Join CharityChain as a Donor
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Track your donations with cryptographic proof, earn impact badges, and control your recognition settings.
          </p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-semibold">Create Supporter Account</CardTitle>
              <CardDescription className="text-xs">
                Your account allows you to trace your gifts and claim M-Pesa or bank receipts.
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
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Wanjiku Mwangi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="email"
                    required
                    placeholder="e.g. donor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    placeholder="At least 12 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs h-10"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Privacy Guarantee</span>
                </div>
                <p>
                  You can set your public recognition profile to <strong>Anonymous</strong>, a <strong>Pseudonym Alias</strong>, or your real name at any time in your settings.
                </p>
              </div>

              <Button
                type="submit"
                variant="emerald"
                disabled={isLoading}
                className="w-full text-xs h-10 gap-2 font-semibold shadow-xs"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Already registered?</span>
              <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign in to your account
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default RegisterPage;

