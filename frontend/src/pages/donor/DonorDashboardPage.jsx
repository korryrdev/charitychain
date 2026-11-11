import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { donorIdentityApi } from '../../features/donorIdentity/services/donorIdentity.api.js';
import { studentSupportApi } from '../../features/studentSupport/services/studentSupport.api.js';
import { TierBadge } from '../../features/recognitionTiers/components/TierBadge.jsx';
import { useAppContext } from '../../app/providers.jsx';

function StudentSupport({ record, loading, error, onLinked }) {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [pending, setPending] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const linkRecord = async (event) => {
    event.preventDefault();
    setPending(true);
    setLinkError(null);
    try {
      await onLinked(registrationNumber);
    } catch (cause) {
      setLinkError(cause.message);
    } finally {
      setPending(false);
    }
  };

  if (loading) return <p className="loading-state">Loading your student-support access…</p>;

  if (!record) return <section className="student-support-card"><p className="section-kicker">Student support access</p><h2>Link your university record</h2><p>Verify this same CharityChain account against the simulated university record using your registration number. Your donor history stays here; no second account is created.</p><form onSubmit={linkRecord}><label htmlFor="registration-number">Registration number<input id="registration-number" value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} placeholder="MUST/SIM/2026/001" autoCapitalize="characters" required /></label>{linkError && <p className="form-error" role="alert">{linkError}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button" type="submit" disabled={pending}>{pending ? 'Verifying record…' : 'Verify and link record'}</button></form></section>;

  return <section className="student-support-card student-support-card--linked"><p className="section-kicker">Student support access</p><h2>Your record is linked</h2><dl className="detail-list"><dt>Registration number</dt><dd>{record.registrationNumber}</dd><dt>Programme</dt><dd>{record.programme}</dd><dt>School</dt><dd>{record.school}</dd><dt>Year of study</dt><dd>{record.yearOfStudy}</dd><dt>Academic status</dt><dd>{record.academicStatus.replaceAll('_', ' ')}</dd></dl><p>Your future student-support checks, applications, and goods collection use this verified record while donor activity remains available in the same account.</p></section>;
}

export function DonorDashboardPage() {
  const navigate = useNavigate();
  const { session, setSession } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [student, setStudent] = useState(null);
  const [studentState, setStudentState] = useState({ loading: true, error: null });
  const [view, setView] = useState('donor');

  useEffect(() => {
    donorIdentityApi.mine().then((response) => setProfile(response.donor)).catch(() => setProfile(null));
    studentSupportApi.mine().then((response) => {
      setStudent(response.student);
      setStudentState({ loading: false, error: null });
    }).catch((cause) => setStudentState({ loading: false, error: cause.status === 404 ? null : cause.message }));
  }, []);

  const linkStudent = async (registrationNumber) => {
    const response = await studentSupportApi.link(registrationNumber);
    setStudent(response.student);
    setStudentState({ loading: false, error: null });
    setSession({ ...session, roles: [...new Set([...(session?.roles ?? []), 'STUDENT'])] });
    navigate('/student');
  };

  return <main className="portal-page donor-page"><p className="section-kicker">My CharityChain</p><h1>{view === 'student' ? 'Student support' : 'Make support count.'}</h1><div className="account-view-toggle" role="tablist" aria-label="Personal account views"><button type="button" role="tab" aria-selected={view === 'donor'} className={view === 'donor' ? 'is-active' : ''} onClick={() => setView('donor')}>Donor</button><button type="button" role="tab" aria-selected={view === 'student'} className={view === 'student' ? 'is-active' : ''} onClick={() => setView('student')}>Student support{student ? ' · linked' : ''}</button></div>{view === 'donor' ? <><div className="donor-dashboard-grid"><section><span>Confirmed contribution value</span><strong>KES {Number(profile?.totalContribution ?? 0).toLocaleString()}</strong><TierBadge tier={profile?.recognitionTier} /></section><section><span>Public identity</span><strong>{profile?.publicAlias ?? 'Loading…'}</strong><Link to="/donor/identity">Manage visibility</Link></section></div><div className="portal-action-grid"><Link to="/donor/donate">Donate money <span>→</span></Link><Link to="/donor/donations">Donation history <span>→</span></Link><Link to="/donor/receipts">Receipts <span>→</span></Link><button type="button" onClick={() => setView('student')}>{student ? 'View student support' : 'Link student support'} <span>→</span></button></div></> : <StudentSupport record={student} loading={studentState.loading} error={studentState.error} onLinked={linkStudent} />}</main>;
}
