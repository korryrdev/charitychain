import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Search, BarChart3, FileText, ArrowRight, Lock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/app/i18n/I18nContext';
import { useAuth } from '@/app/auth/AuthContext';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const navLinks = [
    { label: t('navTrace'), path: '/trace', icon: Search },
    { label: t('navDashboard'), path: '/dashboard', icon: BarChart3 },
    { label: t('navWall'), path: '/wall', icon: Award },
    { label: t('navReports'), path: '/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

      {/* Main Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-emerald-700 transition-colors">
              M
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                CharityChain
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Controls: Language Toggle, Theme Toggle, Staff Portal */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <Link to="/app">
                <Button variant="emerald" size="sm" className="gap-2">
                  <span className="hidden sm:inline">Portal</span>
                  <span className="sm:hidden">Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span className="hidden sm:inline">Staff sign in</span>
                  <span className="sm:hidden">Login</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-900/60 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t('copyright')}</p>
          <div className="flex items-center gap-6">
            <Link to="/app" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              {t('staff')} Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

