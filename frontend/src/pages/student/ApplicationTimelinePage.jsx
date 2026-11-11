import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { applicationsApi } from '../../features/assistanceApplications/services/applications.api.js';

const date = (value) => value ? new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function Timeline({ application }) { return <ol className="application-timeline">{application.history.map((entry, index) => <li key={`${entry.version}-${entry.createdAt}`}><span>{index + 1}</span><div><strong>{entry.toStatus.replaceAll('_', ' ')}</strong><p>{entry.reason.replaceAll('_', ' ')}</p><small>{date(entry.createdAt)}</small></div></li>)}</ol>; }

export function ApplicationTimelinePage() {
  const { applicationId } = useParams(); const [application, setApplication] = useState(null); const [items, setItems] = useState([]); const [error, setError] = useState(null);
  useEffect(() => { const request = applicationId ? applicationsApi.get(applicationId).then(({ application: value }) => setApplication(value)) : applicationsApi.mine({ pageSize: 50 }).then(({ items: value }) => setItems(value)); request.catch((cause) => setError(cause.message)); }, [applicationId]);
  if (error) return <main className="portal-page"><p className="form-error" role="alert">{error}</p></main>;
  if (!applicationId) return <main className="portal-page"><p className="section-kicker">My assistance requests</p><h1>Application timeline</h1>{items.length ? <div className="student-application-list">{items.map((item) => <Link key={item.id} to={`/student/applications/${item.id}`}><span>{item.reference}</span><strong>{item.type} · KES {Number(item.requestedAmount).toLocaleString()}</strong><small>{item.status.replaceAll('_', ' ')}</small></Link>)}</div> : <p className="muted">No assistance requests are available.</p>}</main>;
  if (!application) return <main className="portal-page"><p className="loading-state">Loading application…</p></main>;
  const runHistory = application.history.find((entry) => entry.reason.startsWith('VETTING_RUN:'));
  const runId = runHistory?.reason.split(':')[1];
  return <main className="portal-page application-timeline-page"><p className="section-kicker">{application.reference}</p><h1>{application.type === 'TUITION' ? 'Tuition fee assistance' : 'Upkeep assistance'}</h1><section className="application-summary"><div><span>Requested</span><strong>KES {Number(application.requestedAmount).toLocaleString()}</strong></div><div><span>Current status</span><strong>{application.status.replaceAll('_', ' ')}</strong></div><div><span>Semester</span><strong>{application.semester.name}</strong></div></section><p className="application-reason">{application.reason}</p><Timeline application={application} /><div className="application-timeline-page__actions">{runId ? <Link className="primary-button" to={`/student/applications/${application.id}/vetting?run=${runId}`}>View Need Index explanation</Link> : <Link className="secondary-button" to={`/student/applications/${application.id}/vetting`}>View vetting status</Link>}{['DRAFT', 'SUBMITTED'].includes(application.status) && <button className="secondary-button" type="button" onClick={async () => { await applicationsApi.cancel(application.id); window.location.reload(); }}>Cancel request</button>}</div></main>;
}
