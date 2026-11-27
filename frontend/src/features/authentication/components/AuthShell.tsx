import type { ReactNode } from 'react';
import { Eye, Lock, ShieldCheck } from 'lucide-react';

export interface AuthShellProps {
  children?: ReactNode;
}

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'Verified and locked records', body: 'Every donation and decision can be checked, and later edits are detectable.' },
  { icon: Lock, title: 'Student data stays private', body: 'Public pages never show names, balances or personal records.' },
  { icon: Eye, title: 'Two-of-three approvals', body: 'No single person can approve or release funds alone.' }
];

/** Split-screen frame for sign in / sign up: form on one side, trust panel on the other. */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="cc-auth">
      <section className="cc-auth__form">{children}</section>
      <aside className="cc-auth__panel" aria-label="Why CharityChain">
        <div className="cc-auth__panel-content">
          <p className="cc-auth__kicker">University support, made accountable</p>
          <h2 className="cc-auth__statement">Every shilling traceable. Every decision reviewed.</h2>
          <ul className="cc-auth__points">
            {TRUST_POINTS.map((point) => {
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
        <p className="cc-auth__footnote">Built for accountable support at MUST.</p>
      </aside>
    </main>
  );
}
