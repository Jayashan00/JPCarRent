import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db, useDB } from '../../lib/db';
import { PageHero, WaButton } from '../../components/site';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Field, Badge, useConfirm, useToast } from '../../components/ui';
import { money, fmtDate, PAY_METHOD, placeOf } from '../../lib/utils';

/** Lets guests (no account) find and manage a booking with its number and email. */
export default function ManageBooking() {
  const { bookings, vehicles, locations, users, settings } = useDB();
  const confirm = useConfirm();
  const toast = useToast();
  const [f, setF] = useState({ ref: '', email: '' });
  const [id, setId] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const emailOf = (b) => (b.contact?.email || b.guest?.email || users.find((u) => u.id === b.userId)?.email || '').toLowerCase();

  const find = (e) => {
    e.preventDefault();
    const b = bookings.find((x) => x.ref.toUpperCase() === f.ref.trim().toUpperCase() && emailOf(x) === f.email.trim().toLowerCase());
    if (!b) { setErr('We couldn’t find a booking with that number and email. Check both and try again.'); setId(null); return; }
    setErr(''); setId(b.id);
  };
  const b = bookings.find((x) => x.id === id);
  const v = b && vehicles.find((x) => x.id === b.vehicleId);
  const loc = (lid) => locations.find((l) => l.id === lid)?.name;
  const name = b && (b.contact?.name || b.guest?.name || 'Guest');

  const cancel = async () => {
    const late = (new Date(b.pickupAt) - Date.now()) / 3600000 < 48;
    if (!(await confirm({ title: 'Cancel this booking?', text: late ? 'Pickup is less than 48 hours away, so one rental day will be charged.' : 'This is free because pickup is more than 48 hours away.', confirmText: 'Cancel booking' }))) return;
    db.update('bookings', b.id, (x) => ({ status: 'cancelled', history: [...(x.history || []), { at: new Date().toISOString(), text: 'Cancelled by guest online' }] }));
    db.notify('admin', 'Booking cancelled', `${name} cancelled ${b.ref}.`, '/admin/bookings');
    toast('Booking cancelled');
  };
  const send = () => {
    if (msg.trim().length < 5) return;
    db.create('messages', { name, email: emailOf(b), phone: b.contact?.phone || '', subject: `Change request for ${b.ref}`, message: msg, status: 'new', replies: [], bookingId: b.id }, 'msg');
    db.notify('admin', 'Change request', `${name} asked to change ${b.ref}.`, '/admin/messages');
    setMsg(''); toast('Request sent. We’ll reply by email.');
  };

  return (
    <>
      <PageHero title="Manage a booking" text="Booked without an account? Enter your booking number and email to see, change or cancel it." />
      <div className="wrap narrow section-sm">
        <form className="card pad lookup" onSubmit={find}>
          <Field label="Booking number"><input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="JP-261005" required /></Field>
          <Field label="Email used for the booking"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <button className="btn dark lg">Find booking</button>
          {err && <p className="notice warn full" role="alert">{err}</p>}
        </form>
        {b && (
          <div className="card pad found">
            <div className="found-head">
              <div className="found-photo"><VehiclePhoto vehicle={v} /></div>
              <div>
                <span className="muted small">Booking {b.ref}</span>
                <h2>{v?.name}</h2>
                <div className="row-gap"><Badge status={b.status} /><Badge status={b.paymentStatus} /></div>
              </div>
            </div>
            <dl className="kv" style={{ margin: '18px 0' }}>
              <dt>Name</dt><dd>{name}</dd>
              <dt>Pickup</dt><dd>{fmtDate(b.pickupAt, true)}, {placeOf(b, 'pickup', locations)}</dd>
              <dt>Return</dt><dd>{fmtDate(b.dropoffAt, true)}, {placeOf(b, 'dropoff', locations)}</dd>
              <dt>Total</dt><dd><b>{money(b.total)}</b> (paid {money(b.amountPaid || 0)})</dd>
              <dt>Payment</dt><dd>{PAY_METHOD[b.paymentMethod]}</dd>
            </dl>
            {b.paymentMethod === 'bank' && b.paymentStatus !== 'paid' && <pre className="bank-box">{settings.bankDetails}</pre>}
            <div className="row-gap" style={{ marginTop: 14 }}>
              <WaButton text={`Hi, about my booking ${b.ref}: `}>WhatsApp us</WaButton>
              {['pending', 'confirmed'].includes(b.status) && <button className="btn danger" onClick={cancel}>Cancel booking</button>}
              <Link to="/register" className="btn ghost">Create an account</Link>
            </div>
            {['pending', 'confirmed'].includes(b.status) && (
              <div className="sub-box" style={{ marginTop: 18 }}>
                <h4>Need to change something?</h4>
                <textarea className="input" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="New dates, pickup time, child seat…" />
                <button className="btn dark sm" onClick={send}>Send change request</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
