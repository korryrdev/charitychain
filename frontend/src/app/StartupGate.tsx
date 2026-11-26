import { useEffect, useState, type ReactNode } from 'react';
import { useAppContext } from './Providers';

export function StartupGate({ children }: { children: ReactNode }) {
  const { sessionLoader, setSession } = useAppContext();
  const [state, setState] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let active = true;
    sessionLoader()
      .then((session) => {
        if (active) {
          setSession(session);
          setState('ready');
        }
      })
      .catch(() => {
        if (active) setState('ready');
      });
    return () => {
      active = false;
    };
  }, [sessionLoader, setSession]);

  if (state === 'loading') {
    return (
      <main className="foundation-shell">
        <p role="status">Loading CharityChain securely…</p>
      </main>
    );
  }
  return <>{children}</>;
}
