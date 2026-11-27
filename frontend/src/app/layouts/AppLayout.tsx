import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  PlusCircle,
  KeyRound,
  Coins,
  PackageCheck,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Menu,
  X,
  LogOut,
  UserCheck,
  Network,
} from 'lucide-react';
import { useAuth } from '@/app/auth/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SkipLink } from '@/components/SkipLink';
import { useTranslation } from '@/app/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export const AppLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: t('navCases'),
      path: '/app/cases',
      icon: FileCheck2,
      roles: ['COMMITTEE', 'TREASURER', 'SIGNATORY', 'ADMIN', 'SUBGROUP_REP'] as UserRole[],
    },
    {
      label: t('navNewCase'),
      path: '/app/cases/new',
      icon: PlusCircle,
      roles: ['SUBGROUP_REP', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navSigning'),
      path: '/app/signing',
      icon: KeyRound,
      badge: '2-of-3',
      roles: ['SIGNATORY', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navDonations'),
      path: '/app/donations',
      icon: Coins,
      roles: ['TREASURER', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navPharmacy'),
      path: '/app/pharmacy',
      icon: PackageCheck,
      roles: ['CUSTODIAN', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navAlerts'),
      path: '/app/alerts',
      icon: AlertTriangle,
      roles: ['COMMITTEE', 'TREASURER', 'SIGNATORY', 'AUDITOR', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navGraph'),
      path: '/app/graph',
      icon: Network,
      roles: ['COMMITTEE', 'TREASURER', 'SIGNATORY', 'AUDITOR', 'ADMIN'] as UserRole[],
    },
    {
      label: t('navReportBuilder'),
      path: '/app/reports',
      icon: FileSpreadsheet,
      roles: ['COMMITTEE', 'TREASURER', 'ADMIN'] as UserRole[],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    navigate('/trace');
  };

  useEffect(() => {
    if (role === 'DONOR') {
      navigate('/donor', { replace: true });
    } else if (role === 'STUDENT') {
      navigate('/student', { replace: true });
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <Link to="/app" className="flex items-center gap-2">
          <img src="/logo.svg" alt="CharityChain Logo" className="w-8 h-8 rounded-lg shadow-xs" />
          <span className="font-bold text-base">CharityChain</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Logo & Header */}
          <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="CharityChain Logo" className="w-8 h-8 rounded-lg shadow-xs" />
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight">CharityChain</span>
              </div>
            </Link>
          </div>

          {/* Authenticated User Summary */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Signed in</span>
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.name || user?.email}
            </div>
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
              {role}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label="Sidebar Navigation">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 text-current opacity-80" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500">Language / Lugha</span>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <span className="text-xs font-semibold text-zinc-500">Theme</span>
            <ThemeToggle showLabel />
          </div>
          <Link
            to="/trace"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Public site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <SkipLink targetId="main-content" />
        <main id="main-content" tabIndex={-1} className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

