import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhysicalDonationForm } from '../../features/physicalDonations/components/PhysicalDonationForm.jsx';
import { ConfirmationStatus } from '../../features/physicalDonations/components/ConfirmationStatus.jsx';

export function DeclareGoodsPage() {
  const [declaration, setDeclaration] = useState(null);

  return <main className="portal-page physical-donation-page">
    <header className="portal-page__header">
      <p className="eyebrow">Physical giving</p>
      <h1>Bring goods with a clear, confirmed handover.</h1>
      <p>Prepare the item summary below before you visit the donation desk. It is a check-in aid only: it does not add stock, create a cash record, or replace the clerk’s independent receipt.</p>
    </header>

    <section className="physical-process" aria-label="Physical donation process">
      <div><span>01</span><strong>Prepare</strong><p>List what you intend to bring.</p></div>
      <div><span>02</span><strong>Clerk records</strong><p>The desk records only what was actually received.</p></div>
      <div><span>03</span><strong>You confirm</strong><p>An SMS lets you approve or reject that receipt.</p></div>
      <div><span>04</span><strong>Recognised</strong><p>Only confirmed goods reach inventory.</p></div>
    </section>

    {!declaration ? <section className="portal-card physical-declaration-card"><h2>Prepare your check-in summary</h2><p className="muted">For a cash contribution, use the normal money-donation route where possible. If cash is handed over at the desk, it follows the same SMS confirmation and deposit reconciliation controls.</p><PhysicalDonationForm onDeclared={setDeclaration} /></section> : <section className="portal-card physical-summary"><ConfirmationStatus status="DRAFT" /><h2>Your check-in summary is ready</h2><p>Show this summary to the clerk. The clerk will count and record the actual received goods independently, then an SMS will be sent to <strong>{declaration.donorPhone}</strong>. If anything differs, choose <strong>No</strong>; the receipt will be rejected and must be entered afresh.</p><dl>{declaration.lines.map((line, index) => <div key={`${line.name}-${index}`}><dt>{line.type === 'CASH' ? 'Cash' : line.name}</dt><dd>{line.type === 'CASH' ? `KES ${line.declaredValue}` : `${line.quantity} ${line.unit}${Number(line.quantity) === 1 ? '' : 's'}${line.category ? ` · ${line.category}` : ''}`}</dd></div>)}</dl><div className="physical-summary__actions"><button className="secondary-button" type="button" onClick={() => setDeclaration(null)}>Edit summary</button><Link className="primary-button" to="/donor">Back to dashboard</Link></div></section>}

    <aside className="physical-safety-note"><h2>Why we confirm first</h2><p>The inventory and central records remain unchanged until the donor confirms the clerk’s actual entry. A rejected confirmation cannot be edited into approval; it requires a new, correct receipt.</p></aside>
  </main>;
}
