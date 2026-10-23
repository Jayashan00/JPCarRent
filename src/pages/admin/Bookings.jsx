import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Download, Printer, MessageCircle, Trash2, Check, Car, Flag, X as XIcon, Calculator, FileSignature, CalendarPlus } from 'lucide-react';
import { HandoverModal, ReturnModal, FUEL } from './Inspection';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Badge, Modal, Field, Tabs, Empty, Pager, useConfirm, useToast } from '../../components/ui';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { money, fmtDate, fmtShort, quote, isVehicleFree, toLocalInput, defaultDates, downloadCSV, waLink, rentalDays, PAY_METHOD, STATUS_LABEL, cx, placeOf, resolvePlace } from '../../lib/utils';
import PlaceInput from '../../components/PlaceInput';

const STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

export const customerOf = (b, users) => b.contact || users.find((u) => u.id === b.userId) || b.guest || { name: 'Guest' };

export default function AdminBookings() {
  const { bookings, vehicles, users } = useDB();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('status') || 'all');
  const [q, setQ] = useState('');
  const [pay, setPay] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(params.get('open'));
  const [creating, setCreating] = useState(params.get('new') === '1');
  useEffect(() => { if (params.get('open')) setOpen(params.get('open')); }, [params]);

  const vName = (id) => vehicles.find((v) => v.id === id)?.name || 'Removed vehicle';
  const list = useMemo(() => [...bookings].sort((a, b) => new Date(b.pickupAt) - new Date(a.pickupAt)).filter((b) => {
    const c = customerOf(b, users);
    return (tab === 'all' || b.status === tab) && (!pay || b.paymentStatus === pay) &&
      (!q || `${b.ref} ${c.name} ${c.email} ${c.phone} ${vName(b.vehicleId)}`.toLowerCase().includes(q.toLowerCase())) &&
      (!from || new Date(b.pickupAt) >= new Date(from)) && (!to || new Date(b.pickupAt) <= new Date(to + 'T23:59'));
  }), [bookings, tab, q, pay, from, to, users, vehicles]);
  const pages = Math.max(1, Math.ceil(list.length / 15));
  const shown = list.slice((page - 1) * 15, page * 15);

  const exportCsv = () => downloadCSV('bookings.csv', list.map((b) => {
    const c = customerOf(b, users);
    return { ref: b.ref, status: b.status, customer: c.name, email: c.email, phone: c.phone, vehicle: vName(b.vehicleId), pickup: fmtDate(b.pickupAt, true), return: fmtDate(b.dropoffAt, true), days: b.days, mode: b.mode, total: b.total, paid: b.amountPaid, payment: b.paymentStatus, method: b.paymentMethod };
  }));
  const close = () => { setOpen(null); params.delete('open'); setParams(params, { replace: true }); };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Bookings</h1><p className="muted">Confirm requests, record payments, assign drivers and track every rental.</p></div>
        <div className="row-gap">
          <button className="btn ghost sm" onClick={exportCsv}><Download size={16} />Export</button>
          <button className="btn primary sm" onClick={() => setCreating(true)}><Plus size={16} />New booking</button>
        </div>
      </div>
      <Tabs value={tab} onChange={(t) => { setTab(t); setPage(1); }} tabs={[{ value: 'all', label: 'All', count: bookings.length }, ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: bookings.filter((b) => b.status === s).length }))]} />
      <div className="toolbar">
        <div className="search-box"><Search size={16} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by booking no, name, email or car" aria-label="Search bookings" /></div>
        <select className="input slim" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment status">
          <option value="">Payment: all</option>{['unpaid', 'partial', 'paid', 'refunded'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <label className="date-filter">From <input type="date" className="input slim" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="date-filter">To <input type="date" className="input slim" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {(q || pay || from || to) && <button className="btn link small" onClick={() => { setQ(''); setPay(''); setFrom(''); setTo(''); }}>Clear</button>}
        <span className="muted small push">{list.length} bookings</span>
      </div>
      <div className="table-wrap card">
        {shown.length ? (
          <table className="table">
            <thead><tr><th>Booking</th><th>Customer</th><th>Vehicle</th><th>Pickup</th><th>Return</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {shown.map((b) => {
                const c = customerOf(b, users);
                return (
                  <tr key={b.id} className="clickable" onClick={() => setOpen(b.id)}>
                    <td data-label="Booking"><b>{b.ref}</b><div className="small muted">{b.mode === 'driver' ? 'With driver' : 'Self-drive'}</div></td>
                    <td data-label="Customer">{c.name}<div className="small muted">{c.phone}</div></td>
                    <td data-label="Vehicle">{vName(b.vehicleId)}</td>
                    <td data-label="Pickup">{fmtDate(b.pickupAt, true)}</td>
                    <td data-label="Return">{fmtDate(b.dropoffAt, true)}</td>
                    <td data-label="Total">{money(b.total)}</td>
                    <td data-label="Payment"><Badge status={b.paymentStatus} /></td>
                    <td data-label="Status"><Badge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty icon="Calendar" title="No bookings found" text="Try another tab or clear the filters." />}
        <Pager page={page} pages={pages} onPage={setPage} />
      </div>
      {open && bookings.some((b) => b.id === open) && <BookingDrawer id={open} onClose={close} />}
      {creating && <BookingForm onClose={() => setCreating(false)} onSaved={(id) => { setCreating(false); setOpen(id); }} />}
    </div>
  );
}

export function BookingDrawer({ id, onClose }) {
  const { bookings, vehicles, users, drivers, locations, extras, settings } = useDB();
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const b = bookings.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [payAmt, setPayAmt] = useState('');
  const [payMethod, setPayMethod] = useState(b.paymentMethod);
  const [note, setNote] = useState('');
  const [handover, setHandover] = useState(false);
  const [receive, setReceive] = useState(false);
  const [deduct, setDeduct] = useState('');
  if (!b) return null;
  const v = vehicles.find((x) => x.id === b.vehicleId);
  const c = customerOf(b, users);
  const account = users.find((u) => u.id === b.userId);
  const loc = (lid) => locations.find((l) => l.id === lid)?.name;
  const balance = Math.max(0, (b.total || 0) - (b.amountPaid || 0));
  const log = (text) => [...(b.history || []), { at: new Date().toISOString(), text: `${text} (${user.name})` }];

  const setStatus = (status, text) => {
    db.update('bookings', b.id, { status, history: log(text) });
    if (b.userId) db.notify(b.userId, `Booking ${STATUS_LABEL[status].toLowerCase()}`, `${v?.name}, ${b.ref}.`, '/account/bookings');
    toast(`Booking ${STATUS_LABEL[status].toLowerCase()}`);
  };
  const recordPayment = () => {
    const amt = +payAmt;
    if (!amt) return toast('Enter an amount.', 'error');
    const paid = (b.amountPaid || 0) + amt;
    const pay = { id: `pay-${Date.now()}`, at: new Date().toISOString(), amount: amt, method: payMethod, by: user.name, note: paid >= b.total ? 'Balance paid' : 'Part payment' };
    db.update('bookings', b.id, { amountPaid: paid, payments: [...(b.payments || []), pay], paymentMethod: payMethod, paymentStatus: paid >= b.total ? 'paid' : 'partial', history: log(`Payment of ${money(amt)} recorded (${PAY_METHOD[payMethod]})`) });
    setPayAmt('');
    toast('Payment recorded');
  };
  const refund = async () => {
    if (!(await confirm({ title: 'Mark as refunded?', text: `Records a refund of ${money(b.amountPaid)} to the customer.`, confirmText: 'Mark refunded', danger: false }))) return;
    db.update('bookings', b.id, { paymentStatus: 'refunded', payments: [...(b.payments || []), { id: `pay-${Date.now()}`, at: new Date().toISOString(), amount: -(b.amountPaid || 0), method: b.paymentMethod, by: user.name, note: 'Refund' }], history: log(`Refund of ${money(b.amountPaid)} recorded`) });
  };
  const approveExt = () => {
    const r = b.extensionRequest;
    const days = rentalDays(b.pickupAt, r.dropoffAt);
    db.update('bookings', b.id, (x) => ({
      dropoffAt: r.dropoffAt, days, total: (x.total || 0) + r.extra, extensionRequest: null,
      lines: [...(x.lines || []), { label: `Extension to ${fmtDate(r.dropoffAt)}`, amount: r.extra }],
      paymentStatus: (x.amountPaid || 0) >= (x.total || 0) + r.extra ? 'paid' : (x.amountPaid || 0) > 0 ? 'partial' : 'unpaid',
      history: [...(x.history || []), { at: new Date().toISOString(), text: `Extension approved to ${fmtDate(r.dropoffAt, true)} (${user.name})` }],
    }));
    if (b.userId) db.notify(b.userId, 'Extension approved', `Your ${v?.name} is now booked until ${fmtDate(r.dropoffAt, true)}.`, '/account/bookings');
    toast('Extension approved');
  };
  const assign = (driverId) => {
    db.update('bookings', b.id, { driverId: driverId || null, history: log(driverId ? `Driver ${drivers.find((d) => d.id === driverId)?.name} assigned` : 'Driver removed') });
    toast('Driver updated');
  };
  const addNote = () => {
    if (!note.trim()) return;
    db.update('bookings', b.id, { history: log(`Note: ${note}`) });
    setNote('');
  };
  const del = async () => {
    if (!(await confirm({ title: `Delete booking ${b.ref}?`, text: 'This removes it from reports too. Cancelling is usually better.' }))) return;
    db.remove('bookings', b.id);
    toast('Booking deleted');
    onClose();
  };
  const waText = `Hi ${c.name?.split(' ')[0] || ''}, this is ${settings.businessName} about your booking ${b.ref} (${v?.name}, ${fmtDate(b.pickupAt, true)}).`;

  if (editing) return <BookingForm booking={b} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />;

  return (
    <Modal title={`Booking ${b.ref}`} onClose={onClose} size="xl">
      <div className="bd-actions">
        <Badge status={b.status} /><Badge status={b.paymentStatus} />
        <span className="push" />
        {b.status === 'pending' && <button className="btn dark sm" onClick={() => setStatus('confirmed', 'Confirmed')}><Check size={15} />Confirm</button>}
        {b.status === 'confirmed' && <button className="btn dark sm" onClick={() => setHandover(true)}><Car size={15} />Hand over car</button>}
        {b.status === 'active' && <button className="btn dark sm" onClick={() => setReceive(true)}><Flag size={15} />Receive car back</button>}
        {['pending', 'confirmed'].includes(b.status) && <button className="btn ghost sm" onClick={async () => { if (await confirm({ title: 'Cancel this booking?', text: 'The car becomes available again for these dates.', confirmText: 'Cancel booking' })) setStatus('cancelled', 'Cancelled'); }}><XIcon size={15} />Cancel</button>}
        {b.status === 'cancelled' && <button className="btn ghost sm" onClick={() => setStatus('pending', 'Reopened')}>Reopen</button>}
        <button className="btn ghost sm" onClick={() => setEditing(true)}>Edit booking</button>
        <Link to={`/invoice/${b.id}`} className="btn ghost sm"><Printer size={15} />Invoice</Link>
        <Link to={`/agreement/${b.id}`} className="btn ghost sm"><FileSignature size={15} />Agreement</Link>
        <a className="btn wa sm" href={waLink(c.phone || '', waText)} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a>
      </div>

      {b.extensionRequest && (
        <div className="ext-box">
          <CalendarPlus size={20} />
          <div><b>Extension requested</b><span>New return {fmtDate(b.extensionRequest.dropoffAt, true)} (+{money(b.extensionRequest.extra)}). {isVehicleFree(b.vehicleId, b.dropoffAt, b.extensionRequest.dropoffAt, bookings, b.id) ? 'The car is free for these extra days.' : 'Warning: the car is booked by someone else in that period.'}</span></div>
          <button className="btn dark sm" onClick={approveExt}>Approve</button>
          <button className="btn ghost sm" onClick={() => { db.update('bookings', b.id, { extensionRequest: null, history: log('Extension declined') }); if (b.userId) db.notify(b.userId, 'Extension not possible', `We couldn’t extend ${b.ref}. Please message us for options.`, '/account/bookings'); }}>Decline</button>
        </div>
      )}
      <div className="bd-grid">
        <div className="stack">
          <section className="sub-box">
            <h4>Customer</h4>
            <dl className="kv">
              <dt>Name</dt><dd>{c.name} {account ? <span className="badge s-confirmed">Account</span> : <span className="badge">Guest</span>}</dd>
              <dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
              <dt>Phone</dt><dd><a href={`tel:${c.phone}`}>{c.phone}</a></dd>
              <dt>Country</dt><dd>{c.country || '—'}</dd>
              <dt>Licence</dt><dd>{c.licenseNo || account?.licenseNo || '—'}</dd>
              <dt>Passport/NIC</dt><dd>{c.passportNo || account?.passportNo || '—'}</dd>
              {account?.documents?.length > 0 && <><dt>Documents</dt><dd>{account.documents.map((d) => <span key={d.id} className="badge s-read" style={{ marginRight: 4 }}>{d.type}: {d.status}</span>)}</dd></>}
            </dl>
          </section>
          <section className="sub-box">
            <h4>Trip</h4>
            <div className="bd-car"><VehiclePhoto vehicle={v} /><div><b>{v?.name}</b><span className="small muted">{v?.plate}</span></div></div>
            <dl className="kv">
              <dt>Pickup</dt><dd>{fmtDate(b.pickupAt, true)}, {placeOf(b, 'pickup', locations)}</dd>
              <dt>Return</dt><dd>{fmtDate(b.dropoffAt, true)}, {placeOf(b, 'dropoff', locations)}</dd>
              <dt>Length</dt><dd>{b.days} days</dd>
              <dt>Type</dt><dd>{b.mode === 'driver' ? 'With driver' : 'Self-drive'}</dd>
              {b.flightNo && <><dt>Flight</dt><dd>{b.flightNo}</dd></>}
              {b.passengers && <><dt>Passengers</dt><dd>{b.passengers}</dd></>}
              {b.extras?.length > 0 && <><dt>Extras</dt><dd>{b.extras.map((e) => extras.find((x) => x.id === e)?.name).filter(Boolean).join(', ')}</dd></>}
              {b.notes && <><dt>Customer note</dt><dd>{b.notes}</dd></>}
            </dl>
            {b.mode === 'driver' && (
              <Field label="Assigned driver">
                <select value={b.driverId || ''} onChange={(e) => assign(e.target.value)}>
                  <option value="">Not assigned</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                </select>
              </Field>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="sub-box">
            <h4>Price</h4>
            <div className="quote">
              {(b.lines || []).map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
              {b.discount > 0 && <div className="q-line ok-text"><span>Discount {b.promoCode}</span><span>− {money(b.discount)}</span></div>}
              {b.tax > 0 && <div className="q-line"><span>Tax</span><span>{money(b.tax)}</span></div>}
              <div className="q-total"><span>Total</span><span>{money(b.total)}</span></div>
              <div className="q-line"><span>Paid</span><span>{money(b.amountPaid || 0)}</span></div>
              <div className="q-line"><b>Balance</b><b>{money(balance)}</b></div>
              {b.deposit > 0 && <div className="q-line muted"><span>Deposit to hold at pickup</span><span>{money(b.deposit)}</span></div>}
            </div>
          </section>
          {(b.deposit > 0 && b.mode === 'self') && (
            <section className="sub-box">
              <h4>Security deposit</h4>
              <div className="between"><span>{money(b.deposit)}</span><span className={`badge s-${{ held: 'active', returned: 'completed', kept: 'cancelled', 'part-returned': 'pending' }[b.depositStatus] || 'new'}`}>{{ held: 'Held', returned: 'Returned', kept: 'Kept', 'part-returned': `Part returned (${money(b.deposit - (b.depositDeducted || 0))})` }[b.depositStatus] || 'Not collected yet'}</span></div>
              <div className="row-gap">
                {(!b.depositStatus || b.depositStatus === 'none') && b.status !== 'cancelled' && <button className="btn ghost sm" onClick={() => db.update('bookings', b.id, { depositStatus: 'held', history: log(`Deposit of ${money(b.deposit)} collected`) })}>Mark collected</button>}
                {b.depositStatus === 'held' && <>
                  <button className="btn ghost sm" onClick={() => db.update('bookings', b.id, { depositStatus: 'returned', history: log('Deposit returned in full') })}>Return in full</button>
                  <input className="input slim" type="number" min={0} max={b.deposit} placeholder="Amount to keep" value={deduct} onChange={(e) => setDeduct(e.target.value)} style={{ width: 140 }} />
                  <button className="btn ghost sm" disabled={!+deduct} onClick={() => { const amt = Math.min(+deduct, b.deposit); db.update('bookings', b.id, { depositStatus: amt >= b.deposit ? 'kept' : 'part-returned', depositDeducted: amt, history: log(`${money(amt)} kept from deposit`) }); setDeduct(''); }}>Keep amount</button>
                </>}
              </div>
            </section>
          )}
          <section className="sub-box">
            <h4>Record a payment</h4>
            <div className="form-grid">
              <Field label="Amount (LKR)"><input type="number" min={0} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder={String(balance)} /></Field>
              <Field label="Method"><select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>{Object.entries(PAY_METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            </div>
            <div className="row-gap" style={{ marginTop: 10 }}>
              <button className="btn dark sm" onClick={recordPayment}>Record payment</button>
              {balance > 0 && <button className="btn ghost sm" onClick={() => setPayAmt(String(balance))}>Fill balance</button>}
              {b.amountPaid > 0 && b.paymentStatus !== 'refunded' && <button className="btn ghost sm" onClick={refund}>Mark refunded</button>}
            </div>
          </section>
          {(b.checkout || b.checkin) && (
            <section className="sub-box">
              <h4>Vehicle condition</h4>
              <dl className="kv">
                {b.checkout && <><dt>Handed over</dt><dd>{fmtDate(b.checkout.at, true)}, {b.checkout.odometer?.toLocaleString()} km, fuel {FUEL[b.checkout.fuel]}{b.checkout.damage ? `. ${b.checkout.damage}` : ''} <span className="muted small">({b.checkout.by})</span></dd></>}
                {b.checkin && <><dt>Returned</dt><dd>{fmtDate(b.checkin.at, true)}, {b.checkin.odometer?.toLocaleString()} km ({b.checkin.driven} km driven), fuel {FUEL[b.checkin.fuel]}{b.checkin.damage ? `. ${b.checkin.damage}` : ''}</dd></>}
              </dl>
              {[...(b.checkout?.photos || []), ...(b.checkin?.photos || [])].length > 0 && <div className="thumbs square">{[...(b.checkout?.photos || []), ...(b.checkin?.photos || [])].map((p, i) => <a key={i} className="thumb" href={p} target="_blank" rel="noreferrer"><img src={p} alt="" /></a>)}</div>}
            </section>
          )}
          {b.payments?.length > 0 && (
            <section className="sub-box">
              <h4>Payments</h4>
              <ul className="history">{b.payments.slice().reverse().map((p) => <li key={p.id}><span>{fmtDate(p.at, true)} · {PAY_METHOD[p.method] || p.method} · {p.by}</span><b className={p.amount < 0 ? 'err-text' : ''}>{money(p.amount)}</b> {p.note}</li>)}</ul>
            </section>
          )}
          <section className="sub-box">
            <h4>History and notes</h4>
            <ul className="history">{(b.history || []).slice().reverse().map((h, i) => <li key={i}><span>{fmtDate(h.at, true)}</span>{h.text}</li>)}</ul>
            <div className="inline-input" style={{ marginTop: 10 }}>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note" onKeyDown={(e) => e.key === 'Enter' && addNote()} />
              <button className="btn ghost" onClick={addNote}>Add</button>
            </div>
          </section>
          <button className="btn link danger-text" onClick={del}><Trash2 size={15} />Delete booking</button>
        </div>
      </div>
      {handover && <HandoverModal booking={b} onClose={() => setHandover(false)} />}
      {receive && <ReturnModal booking={b} onClose={() => setReceive(false)} />}
    </Modal>
  );
}

export function BookingForm({ booking, onClose, onSaved, preset = {} }) {
  const { vehicles, users, locations, extras, bookings, settings, promos, maintenance, seasons } = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const d = defaultDates();
  const existing = booking;
  const [f, setF] = useState(() => existing ? {
    vehicleId: existing.vehicleId, pickupAt: toLocalInput(existing.pickupAt), dropoffAt: toLocalInput(existing.dropoffAt),
    pickupPlace: placeOf(existing, 'pickup', locations), dropoffPlace: placeOf(existing, 'dropoff', locations), mode: existing.mode, extras: existing.extras || [],
    userId: existing.userId || '', contact: existing.contact || existing.guest || {}, paymentMethod: existing.paymentMethod, status: existing.status,
    promoCode: existing.promoCode || '', flightNo: existing.flightNo || '', notes: existing.notes || '', overrideTotal: '',
  } : {
    vehicleId: preset.vehicleId || vehicles[0]?.id, pickupAt: preset.pickupAt || d.pickupAt, dropoffAt: preset.dropoffAt || d.dropoffAt,
    pickupPlace: 'JP Rent A Car office, Kandy', dropoffPlace: 'JP Rent A Car office, Kandy', mode: 'self', extras: [], userId: '', contact: { name: '', email: '', phone: '', country: '' },
    paymentMethod: 'pickup', status: 'confirmed', promoCode: '', flightNo: '', notes: '', overrideTotal: '',
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const v = vehicles.find((x) => x.id === f.vehicleId);
  const promo = promos.find((p) => p.code === f.promoCode.toUpperCase());
  const q = useMemo(() => quote({ vehicle: v, pickupAt: f.pickupAt, dropoffAt: f.dropoffAt, mode: f.mode, extras: f.extras, allExtras: extras, pickupLocation: resolvePlace(f.pickupPlace, locations), dropoffLocation: resolvePlace(f.dropoffPlace, locations), promo, taxPercent: settings.taxPercent, seasons }), [v, f, extras, locations, promo, settings, seasons]);
  const free = v && isVehicleFree(v.id, f.pickupAt, f.dropoffAt, bookings, existing?.id, maintenance);
  const bad = new Date(f.dropoffAt) <= new Date(f.pickupAt);
  const customers = users.filter((u) => u.role === 'customer');

  const pickUser = (id) => {
    const u = users.find((x) => x.id === id);
    setF((x) => ({ ...x, userId: id, contact: u ? { name: u.name, email: u.email, phone: u.phone, country: u.country, licenseNo: u.licenseNo, passportNo: u.passportNo } : x.contact }));
  };
  const save = () => {
    if (bad) return toast('Return must be after pickup.', 'error');
    if (!f.contact.name) return toast('Enter the customer’s name.', 'error');
    if (!free && !window.confirm('This car is already booked for part of these dates. Save anyway?')) return;
    const total = f.overrideTotal !== '' ? +f.overrideTotal : q.total;
    const data = {
      vehicleId: f.vehicleId, pickupAt: new Date(f.pickupAt).toISOString(), dropoffAt: new Date(f.dropoffAt).toISOString(),
      pickupLocationId: resolvePlace(f.pickupPlace, locations)?.id || null, dropoffLocationId: resolvePlace(f.dropoffPlace, locations)?.id || null, pickupPlace: f.pickupPlace, dropoffPlace: f.dropoffPlace, mode: f.mode, extras: f.extras,
      userId: f.userId || null, contact: f.contact, guest: f.userId ? null : f.contact, paymentMethod: f.paymentMethod, status: f.status,
      promoCode: promo ? promo.code : '', flightNo: f.flightNo, notes: f.notes,
      lines: f.overrideTotal !== '' ? [...q.lines, { label: 'Manual price adjustment', amount: total - q.total }] : q.lines,
      total, discount: q.discount, tax: q.tax, days: q.days, deposit: q.deposit,
    };
    if (existing) {
      const paid = existing.amountPaid || 0;
      db.update('bookings', existing.id, { ...data, paymentStatus: existing.paymentStatus === 'refunded' ? 'refunded' : paid <= 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial', history: [...(existing.history || []), { at: new Date().toISOString(), text: `Booking edited (${user.name})` }] });
      toast('Booking updated');
      onSaved(existing.id);
    } else {
      const nb = db.create('bookings', { ...data, ref: db.nextBookingRef(), paymentStatus: 'unpaid', amountPaid: 0, driverId: null, history: [{ at: new Date().toISOString(), text: `Created by ${user.name}` }] }, 'bk');
      if (nb.userId) db.notify(nb.userId, 'New booking', `${v.name}, ${fmtDate(nb.pickupAt)} (${nb.ref}).`, '/account/bookings');
      toast(`Booking ${nb.ref} created`);
      onSaved(nb.id);
    }
  };

  return (
    <Modal title={existing ? `Edit ${existing.ref}` : 'New booking'} onClose={onClose} size="xl"
      footer={<><span className="muted small push">{q.days} days · total {money(f.overrideTotal !== '' ? +f.overrideTotal : q.total)}</span><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn dark" onClick={save}>{existing ? 'Save changes' : 'Create booking'}</button></>}>
      <div className="bd-grid">
        <div className="stack">
          <h4>Customer</h4>
          <Field label="Existing customer" hint="Or leave empty and type a walk-in or phone customer below.">
            <select value={f.userId} onChange={(e) => pickUser(e.target.value)}><option value="">Guest (no account)</option>{customers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select>
          </Field>
          <div className="form-grid">
            {['name', 'email', 'phone', 'country', 'licenseNo', 'passportNo'].map((k) => (
              <Field key={k} label={{ name: 'Name *', email: 'Email', phone: 'Phone', country: 'Country', licenseNo: 'Licence no', passportNo: 'Passport/NIC' }[k]}>
                <input value={f.contact[k] || ''} onChange={(e) => set('contact', { ...f.contact, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
          <h4>Status</h4>
          <div className="form-grid">
            <Field label="Booking status"><select value={f.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
            <Field label="Payment method"><select value={f.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>{Object.entries(PAY_METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field label="Promo code" error={f.promoCode && !promo ? 'Unknown code' : ''}><input value={f.promoCode} onChange={(e) => set('promoCode', e.target.value.toUpperCase())} /></Field>
            <Field label="Flight number"><input value={f.flightNo} onChange={(e) => set('flightNo', e.target.value)} /></Field>
            <Field label="Notes" className="full"><textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          </div>
        </div>
        <div className="stack">
          <h4>Trip</h4>
          <div className="form-grid">
            <Field label="Vehicle" className="full"><select value={f.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>{vehicles.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.plate}){x.status !== 'available' ? ` – ${x.status}` : ''}</option>)}</select></Field>
            <Field label="Pickup"><input type="datetime-local" value={f.pickupAt} onChange={(e) => set('pickupAt', e.target.value)} /></Field>
            <Field label="Return" error={bad ? 'Must be after pickup' : !free ? 'Clashes with another booking' : ''}><input type="datetime-local" value={f.dropoffAt} onChange={(e) => set('dropoffAt', e.target.value)} /></Field>
            <div className="field"><span className="field-label">Pickup location</span><PlaceInput value={f.pickupPlace} onChange={(v) => set('pickupPlace', v)} ariaLabel="Pickup location" /></div>
            <div className="field"><span className="field-label">Return location</span><PlaceInput value={f.dropoffPlace} onChange={(v) => set('dropoffPlace', v)} ariaLabel="Return location" /></div>
            <Field label="Rental type"><select value={f.mode} onChange={(e) => set('mode', e.target.value)}><option value="self">Self-drive</option><option value="driver">With driver</option></select></Field>
          </div>
          <div>
            <span className="field-label">Extras</span>
            <div className="check-grid">{extras.map((e) => <label key={e.id} className="check"><input type="checkbox" checked={f.extras.includes(e.id)} onChange={(x) => set('extras', x.target.checked ? [...f.extras, e.id] : f.extras.filter((y) => y !== e.id))} />{e.name}</label>)}</div>
          </div>
          <div className="quote">
            {q.lines.map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
            {q.discount > 0 && <div className="q-line ok-text"><span>Discount</span><span>− {money(q.discount)}</span></div>}
            <div className="q-total"><span>Calculated total</span><span>{money(q.total)}</span></div>
          </div>
          <Field label="Override total (optional)" hint="Use for negotiated prices. Leave empty to use the calculated total.">
            <div className="inline-input"><Calculator size={18} className="muted" /><input type="number" min={0} value={f.overrideTotal} onChange={(e) => set('overrideTotal', e.target.value)} placeholder={String(q.total)} /></div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
