import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MfaForm } from '../../features/authentication/components/MfaForm.jsx';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
export function MfaChallengePage() { const { verifyMfa } = useAuth(); const navigate = useNavigate(); const [pending, setPending] = useState(false); const [error, setError] = useState(null); const submit = async (values) => { setPending(true); setError(null); try { await verifyMfa(values); navigate('/', { replace: true }); } catch (cause) { setError(cause.message); } finally { setPending(false); } }; return <main className="auth-page"><MfaForm onSubmit={submit} pending={pending} error={error} /></main>; }
