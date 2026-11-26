import { useAuth } from './useAuth';
export function useSession() { const { session, user, authenticated, ready } = useAuth(); return { session, user, authenticated, ready }; }
