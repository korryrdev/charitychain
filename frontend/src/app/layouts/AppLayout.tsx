import React, { useState } from 'react';
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
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/app/auth/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export const AppLayout: React.FC = () => {
  const { user, role, setRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Cases & Approvals',
      path: '/app/cases',
      icon: FileCheck2,
      roles: ['COMMITTEE', 'TREASURER', 'SIGNATORY', 'ADMIN', 'SUBGROUP_REP'] as UserRole[],
    },
    {
      label: 'Submit New Case',
      path: '/app/cases/new',
      icon: PlusCircle,
      roles: ['SUBGROUP_REP', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: '2-of-3 Release Queue',
      path: '/app/signing',
      icon: KeyRound,
      badge: '2-of-3',
      roles: ['SIGNATORY', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: 'Bank Deposits & Verification',
      path: '/app/donations',
      icon: Coins,
      roles: ['TREASURER', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: 'Pharmacy Quick Item Log',
      path: '/app/pharmacy',
      icon: PackageCheck,
      roles: ['CUSTODIAN', 'COMMITTEE', 'ADMIN'] as UserRole[],
    },
    {
      label: 'Forensic Alert Inbox',
      path: '/app/alerts',
      icon: AlertTriangle,
      roles: ['COMMITTEE', 'TREASURER', 'SIGNATORY', 'AUDITOR', 'ADMIN'] as UserRole[],
    },
    {
      label: 'Quarterly Report Builder',
      path: '/app/reports',
      icon: FileSpreadsheet,
      roles: ['COMMITTEE', 'TREASURER', 'ADMIN'] as UserRole[],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'COMMITTEE', label: 'Committee Member' },
    { value: 'SIGNATORY', label: 'Signatory (Wallet Approver)' },
    { value: 'SUBGROUP_REP', label: 'Sub-group Representative' },
    { value: 'TREASURER', label: 'Treasurer (Bank & Inflows)' },
    { value: 'CUSTODIAN', label: 'Pharmacy Custodian' },
    { value: 'AUDITOR', label: 'Auditor (Read-Only)' },
    { value: 'ADMIN', label: 'System Admin' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/trace');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <span className="font-bold text-base">Malkia Admin</span>
        </Link>
        <div className="flex items-center gap-2">
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
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight">CharityChain</span>
                <span className="text-[11px] text-zinc-500 font-medium">Malkia Governance</span>
              </div>
            </Link>
          </div>

          {/* Persona Switcher (For Evaluation & Demo) */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Active Persona / Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 py-1.5 px-2.5 pr-8 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            <span className="text-xs font-semibold text-zinc-500">Theme</span>
            <ThemeToggle showLabel />
          </div>
          <Link
            to="/trace"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Switch to Public Portal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

