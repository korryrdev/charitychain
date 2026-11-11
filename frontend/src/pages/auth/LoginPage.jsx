import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../features/authentication/components/LoginForm.jsx';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
function destinationFor(response, fallback) { if (response?.requiresMfa) return '/auth/mfa'; if (fallback) return fallback; return response?.roles?.includes('DONOR') ? '/donor' : '/'; }
export function LoginPage() { const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [pending, setPending] = useState(false); const [error, setError] = useState(null); const submit = async (values) => { setPending(true); setError(null); try { const response = await login(values); navigate(destinationFor(response, location.state?.from), { replace: true }); } catch (cause) { setError(cause.message); } finally { setPending(false); } }; return <main className="auth-page"><LoginForm onSubmit={submit} pending={pending} error={error} /></main>; }
