import type { ReactNode } from 'react';
import { Eye, GraduationCap, KeyRound, Lock, MailCheck, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { LoginPortalCode } from '../services/auth.api';

export interface AuthShellProps {
  children?: ReactNode;
  portal?: LoginPortalCode;
}

interface TrustPoint {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface PortalPanelCopy {
  kicker: string;
  statement: string;
  points: readonly TrustPoint[];
  footnote: string;
}

const PANEL_COPY: Record<LoginPortalCode, PortalPanelCopy> = {
  donor: {
    kicker: 'University support, made accountable',
    statement: 'Every shilling traceable. Every decision reviewed.',
    points: [
      {
        icon: ShieldCheck,
        title: 'Verified and locked records',
        body: 'Every donation and decision can be checked, and later edits are detectable.',
      },
      {
        icon: Lock,
        title: 'Control your recognition',
        body: 'Give publicly, under a pseudonym, or anonymously while keeping your receipts.',
      },
      {
        icon: Eye,
        title: 'Two-of-three approvals',
        body: 'No single person can approve or release funds alone.',
      },
    ],
    footnote: 'Built for accountable support at MUST.',
  },
  student: {
    kicker: 'Meru University · Student Portal',
    statement: 'Support decisions grounded in your verified record.',
    points: [
      {
        icon: MailCheck,
        title: 'Confirm your MUST email',
        body: 'Only students with a confirmed @students.must.ac.ke address can sign in.',
      },
      {
        icon: Lock,
        title: 'Private student records',
        body: 'Public pages never show student names, fee balances, or personal details.',
      },
      {
        icon: GraduationCap,
        title: 'Explainable Need Index',
        body: 'Every vetting decision shows the exact factors behind the committee review.',
      },
    ],
    footnote: 'Meru University of Science and Technology · Student Aid.',
  },
  staff: {
    kicker: 'Governance & Operations',
    statement: 'Accountable stewardship at every step.',
    points: [
      {
        icon: ShieldCheck,
        title: 'Role-scoped workspace',
        body: 'Access is limited to the permissions assigned to your operational role.',
      },
      {
        icon: KeyRound,
        title: 'Mandatory password & MFA setup',
        body: 'Invited staff replace temporary passwords and enroll an authenticator on first sign-in.',
      },
      {
        icon: Eye,
        title: 'Tamper-evident audit log',
        body: 'Every approval, release, and administrative action is recorded in a verifiable trail.',
      },
    ],
    footnote: 'CharityChain operational access.',
  },
};

/** Split-screen frame for sign in / sign up: form card on one side, sticky trust panel on the other. */
export function AuthShell({ children, portal = 'donor' }: AuthShellProps) {
  const panel = PANEL_COPY[portal];
  return (
    <main className="cc-auth">
      <section className="cc-auth__form">{children}</section>
      <aside className="cc-auth__panel" aria-label="Why CharityChain">
        <div className="cc-auth__panel-content">
          <p className="cc-auth__kicker">{panel.kicker}</p>
          <h2 className="cc-auth__statement">{panel.statement}</h2>
          <ul className="cc-auth__points">
            {panel.points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.title}>
                  <span className="cc-auth__point-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <span>
                    <strong>{point.title}</strong>
                    <span>{point.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="cc-auth__footnote">{panel.footnote}</p>
      </aside>
    </main>
  );
}
