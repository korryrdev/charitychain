import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { adminApi } from '../../features/administration/services/admin.api.js';

const sections = [
  ['users', 'Users and access', 'Create accounts, assign exact permissions, suspend access, and retain responsibility.'],
  ['policies', 'Policies and governance', 'Set versioned rules for vetting, approvals, goods collection, and accountability.'],
  ['university', 'University records', 'Maintain the simulated student, financial, and aid records used for objective vetting.'],
  ['inventory', 'Goods and inventory', 'Configure accepted goods, collection limits, locations, and available stock.'],
  ['integrations', 'Payments and integrations', 'Monitor channels, callbacks, reconciliation, and operational provider health.'],
  ['security', 'Audit and security', 'Review retained activity, incidents, access changes, and forensic safeguards.']
];
const number = (value) => Number(value ?? 0).toLocaleString();

export function AdminDashboardPage() {
  const [state, setState] = useState({ loading: true, overview: null, error: null });
  useEffect(() => {
    adminApi.overview()
      .then(({ overview }) => setState({ loading: false, overview, error: null }))
      .catch((error) => setState({ loading: false, overview: null, error: error.message }));
  }, []);
  const data = state.overview;
  return <main className="portal-page admin-page super-admin-page">
    <header className="admin-overview-header">
      <div><p className="section-kicker">Super administration</p><h1>System overview.</h1><p>Monitor CharityChain’s financial, student-support, inventory, and governance activity from one accountable control point.</p></div>
      <Link className="primary-button" to="/admin/users">Manage access</Link>
    </header>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.loading ? <p className="loading-state">Loading the operational overview…</p> : <>
      <section className="super-admin-metrics" aria-label="System impact summary">
        <article><span>Confirmed contributions</span><strong>KES {number(data.confirmedMoneyValue)}</strong><small>{number(data.confirmedMoneyDonations)} confirmed money donations</small></article>
        <article><span>Students supported</span><strong>{number(data.disbursements)}</strong><small>{number(data.applications)} applications in the system</small></article>
        <article><span>Available goods</span><strong>{number(data.availableInventoryUnits)}</strong><small>{number(data.goodsCollections)} completed goods collections</small></article>
        <article className={data.openAnomalies ? 'is-attention' : ''}><span>Requires attention</span><strong>{number(data.openAnomalies)}</strong><small>{number(data.auditEvents)} retained audit events</small></article>
      </section>
      <section className="super-admin-snapshot" aria-label="Current operational snapshot">
        <article><span>Active students</span><strong>{number(data.activeStudents)}</strong><p>Verified records available for consistent support assessment.</p></article>
        <article><span>Verified physical donations</span><strong>{number(data.verifiedPhysicalDonations)}</strong><p>Confirmed handovers eligible for inventory reconciliation.</p></article>
        <article><span>Registered accounts</span><strong>{number(data.users)}</strong><p>Accounts controlled through permissions, status, and audit history.</p></article>
      </section>
    </>}
    <section className="super-admin-workspaces"><div className="admin-section-intro"><p className="section-kicker">Administration</p><h2>Manage each operational area.</h2><p>Open the focused workspace for the records and controls you need to manage.</p></div><div className="super-admin-sections">{sections.map(([path, title, description]) => <Link to={`/admin/${path}`} key={path}><h2>{title}</h2><p>{description}</p><span>Open workspace</span></Link>)}</div></section>
    <aside className="super-admin-boundary"><strong>Governance boundary</strong><p>Administration controls access and configuration; it cannot replace committee approval, confirm unsupported money, release unconfirmed goods, alter provider evidence, or erase audit history.</p></aside>
  </main>;
}
