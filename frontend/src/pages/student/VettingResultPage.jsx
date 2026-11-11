import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { applicationsApi } from '../../features/assistanceApplications/services/applications.api.js';
import { vettingApi } from '../../features/studentVetting/services/vetting.api.js';
import { VettingExplanation } from '../../features/studentVetting/components/VettingExplanation.jsx';
import { VettingFactors } from '../../features/studentVetting/components/VettingFactors.jsx';

export function VettingResultPage() {
  const { applicationId } = useParams(); const [search] = useSearchParams(); const [application, setApplication] = useState(null); const [run, setRun] = useState(null); const [error, setError] = useState(null);
  useEffect(() => { applicationsApi.get(applicationId).then(({ application: value }) => { setApplication(value); const id = search.get('run') ?? value.history.find((entry) => entry.reason.startsWith('VETTING_RUN:'))?.reason.split(':')[1]; if (id) return vettingApi.run(id).then(({ run: result }) => setRun(result)); return null; }).catch((cause) => setError(cause.message)); }, [applicationId, search]);
  if (error) return <main className="portal-page"><p className="form-error" role="alert">{error}</p></main>;
  if (!application) return <main className="portal-page"><p className="loading-state">Loading vetting information…</p></main>;
  return <main className="portal-page vetting-result-page"><p className="section-kicker">Need Index</p><h1>How your request was assessed.</h1>{run ? <><VettingExplanation run={run} /><section><h2>Evidence factors</h2><p className="muted">These factors are derived from the simulated university record; they are not a label of a student’s worth or character.</p><VettingFactors factors={run.factors} /></section>{run.status === 'INELIGIBLE' && <Link className="secondary-button" to="/student/appeals">Request a review or report a discrepancy</Link>}</> : <section className="vetting-pending"><h2>Vetting is pending</h2><p>Your request is currently <strong>{application.status.replaceAll('_', ' ')}</strong>. Once the automated vetting run is complete, this page will show the policy result and evidence factors. Committee review, where needed, is separate from this result.</p><Link className="secondary-button" to={`/student/applications/${application.id}`}>Back to application timeline</Link></section>}</main>;
}
