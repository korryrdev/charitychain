import { useAuth } from './useAuth.js';
export function useSession() { const { session, user, authenticated, ready } = useAuth(); return { session, user, authenticated, ready }; }
