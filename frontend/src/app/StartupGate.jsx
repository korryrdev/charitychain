import { useEffect, useState } from 'react';
import { useAppContext } from './providers.jsx';
export function StartupGate({ children }) {
  const { sessionLoader, setSession } = useAppContext(); const [state, setState] = useState('loading');
  useEffect(() => { let active = true; sessionLoader().then((session) => { if (active) { setSession(session); setState('ready'); } }).catch(() => { if (active) setState('ready'); }); return () => { active = false; }; }, [sessionLoader, setSession]);
  if (state === 'loading') return <main className="foundation-shell"><p role="status">Loading CharityChain securely…</p></main>;
  return children;
}
