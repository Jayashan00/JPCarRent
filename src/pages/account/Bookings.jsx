import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Badge, Empty, Modal, Tabs, Stars, Field, useConfirm, useToast } from '../../components/ui';
import { WaButton } from '../../components/site';
import { money, fmtDate, PAY_METHOD, quote, isVehicleFree, toLocalInput, placeOf } from '../../lib/utils';

export default function Bookings() {
  const { user } = useAuth();
  const { bookings, vehicles } = useDB();
  const [tab, setTab] = useState('upcoming');
  const [open, setOpen] = useState(null);
  const mine = bookings.filter((b) => b.userId === user.id).sort((a, b) => new Date(b.pickupAt) - new Date(a.pickupAt));
  const groups = {
    upcoming: mine.filter((b) => ['pending', 'confirmed', 'active'].includes(b.status)),
    past: mine.filter((b) => b.status === 'completed'),
    cancelled: mine.filter((b) => b.status === 'cancelled'),
  };
  const list = groups[tab];
  return (
    <>
      <div className="between"><h1 className="acc-title">My bookings</h1><Link to="/fleet" className="btn primary sm">New booking</Link></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length }, { value: 'past', label: 'Past', count: groups.past.length }, { value: 'cancelled', label: 'Cancelled', count: groups.cancelled.length }]} />
      <div className="bk-list">
        {list.length ? list.map((b) => {
          const v = vehicles.find((x) => x.id === b.vehicleId);
          return (
            <button key={b.id} className="bk-row card" onClick={() => setOpen(b.id)}>
              <VehiclePhoto vehicle={v} />
              <div className="bk-info"><b>{v?.name}</b><span>{fmtDate(b.pickupAt)} to {fmtDate(b.dropoffAt)}</span><small className="muted">{b.ref}</small></div>
              <div className="bk-right"><Badge status={b.status} /><b>{money(b.total)}</b></div>
            </button>
          );
        }) : <Empty icon="Calendar" title={`No ${tab} bookings`} action={tab === 'upcoming' && <Link to="/fleet" className="btn primary">Find a car</Link>} />}
      </div>
      {open && <BookingModal id={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function BookingModal({ id, onClose }) {
  const { bookings, vehicles, locations, extras, reviews, drivers, seasons, maintenance } = useDB();
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const b = bookings.find((x) => x.id === id);
  const v = vehicles.find((x) => x.id === b.vehicleId);
  const loc = (lid) => locations.find((l) => l.id === lid)?.name;
  const myReview = reviews.find((r) => r.bookingId === b.id);
  const [rev, setRev] = useState({ rating: 5, text: '' });
  const [change, setChange] = useState('');
  const hoursToPickup = (new Date(b.pickupAt) - Date.now()) / 3600000;
  const canCancel = ['pending', 'confirmed'].includes(b.status);
  const drv = drivers.find((d) => d.id === b.driverId);
  const [extTo, setExtTo] = useState(() => toLocalInput(new Date(new Date(b.dropoffAt).getTime() + 2 * 86400000)));
  const canExtend = ['confirmed', 'active'].includes(b.status) && !b.extensionRequest;
  const params = { vehicle: v, mode: b.mode, extras: b.extras, allExtras: extras, pickupLocation: locations.find((l) => l.id === b.pickupLocationId), dropoffLocation: locations.find((l) => l.id === b.dropoffLocationId), seasons };
  const extExtra = v && new Date(extTo) > new Date(b.dropoffAt) ? quote({ ...params, pickupAt: b.pickupAt, dropoffAt: extTo }).total - quote({ ...params, pickupAt: b.pickupAt, dropoffAt: b.dropoffAt }).total : 0;
  const extFree = v && isVehicleFree(v.id, b.dropoffAt, extTo, bookings, b.id, maintenance);
  const requestExt = () => {
    if (new Date(extTo) <= new Date(b.dropoffAt)) return toast('Choose a return date after the current one.', 'error');
    if (!extFree) return toast('The car is booked by someone else for part of that time. Message us for options.', 'error');
    db.update('bookings', b.id, (x) => ({ extensionRequest: { dropoffAt: new Date(extTo).toISOString(), extra: Math.max(0, extExtra), at: new Date().toISOString() }, history: [...(x.history || []), { at: new Date().toISOString(), text: `Customer asked to extend to ${fmtDate(extTo, true)}` }] }));
    db.notify('admin', 'Extension request', `${user.name} wants to keep the ${v.name} until ${fmtDate(extTo, true)} (${b.ref}).`, `/admin/bookings?open=${b.id}`);
    toast('Extension requested. We’ll confirm shortly.');
  };

  const cancel = async () => {
    const late = hoursToPickup < 48;
    if (!(await confirm({ title: 'Cancel this booking?', text: late ? 'Your pickup is less than 48 hours away, so one rental day will be charged.' : 'This is free because your pickup is more than 48 hours away.', confirmText: 'Cancel booking' }))) return;
    db.update('bookings', b.id, (x) => ({ status: 'cancelled', history: [...(x.history || []), { at: new Date().toISOString(), text: 'Cancelled by customer' }] }));
    db.notify('admin', 'Booking cancelled', `${user.name} cancelled ${b.ref}.`, '/admin/bookings');
    toast('Booking cancelled');
  };
  const requestChange = () => {
    if (!change.trim()) return;
    db.create('messages', { name: user.name, email: user.email, phone: user.phone, subject: `Change request for ${b.ref}`, message: change, status: 'new', replies: [], userId: user.id, bookingId: b.id }, 'msg');
    db.notify('admin', 'Change request', `${user.name} asked to change ${b.ref}.`, '/admin/messages');
    setChange('');
    toast('Request sent. We’ll confirm the change by email.');
  };
  const sendReview = () => {
    if (rev.text.trim().length < 5) return toast('Write a few words about your rental.', 'error');
    db.create('reviews', { name: user.name, trip: `${v.name}, ${b.days || ''} days`, rating: rev.rating, text: rev.text, source: 'site', status: 'pending', userId: user.id, vehicleId: v.id, bookingId: b.id }, 'rev');
    db.notify('admin', 'New review to approve', `${user.name} reviewed the ${v.name}.`, '/admin/reviews');
    toast('Thanks! Your review will appear once approved.');
  };

  return (
    <Modal title={`Booking ${b.ref}`} onClose={onClose} size="lg">
      <div className="bm-grid">
        <div>
          <VehiclePhoto vehicle={v} className="bm-photo" />
          <h3 style={{ marginTop: 12 }}>{v?.name}</h3>
          <div className="row-gap" style={{ margin: '8px 0 16px' }}><Badge status={b.status} /><Badge status={b.paymentStatus} /></div>
          <dl className="kv">
            <dt>Pickup</dt><dd>{fmtDate(b.pickupAt, true)}<br />{placeOf(b, 'pickup', locations)}</dd>
            <dt>Return</dt><dd>{fmtDate(b.dropoffAt, true)}<br />{placeOf(b, 'dropoff', locations)}</dd>
            <dt>Type</dt><dd>{b.mode === 'driver' ? `With driver${drv ? ` (${drv.name}, ${drv.phone})` : ''}` : 'Self-drive'}</dd>
            {b.extras?.length > 0 && <><dt>Extras</dt><dd>{b.extras.map((e) => extras.find((x) => x.id === e)?.name).filter(Boolean).join(', ')}</dd></>}
            <dt>Payment</dt><dd>{PAY_METHOD[b.paymentMethod]}</dd>
          </dl>
        </div>
        <div>
          <div className="quote">
            {(b.lines || []).map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
            {b.discount > 0 && <div className="q-line ok-text"><span>Discount</span><span>− {money(b.discount)}</span></div>}
            <div className="q-total"><span>Total</span><span>{money(b.total)}</span></div>
            <div className="q-line"><span>Paid so far</span><span>{money(b.amountPaid || 0)}</span></div>
          </div>
          <div className="row-gap" style={{ margin: '14px 0' }}>
            <Link to={`/invoice/${b.id}`} className="btn ghost sm"><Printer size={15} />Invoice</Link>
            <WaButton className="btn wa sm" text={`Hi, about my booking ${b.ref}: `}>WhatsApp us</WaButton>
            {canCancel && <button className="btn sm danger" onClick={cancel}>Cancel booking</button>}
          </div>
          {canCancel && (
            <div className="sub-box">
              <h4>Need to change something?</h4>
              <textarea className="input" rows={3} value={change} onChange={(e) => setChange(e.target.value)} placeholder="e.g. Move pickup to 10 AM, add a child seat" />
              <button className="btn dark sm" style={{ marginTop: 8 }} onClick={requestChange}>Send change request</button>
            </div>
          )}
          {b.extensionRequest && <p className="notice info">Extension to {fmtDate(b.extensionRequest.dropoffAt, true)} requested (+{money(b.extensionRequest.extra)}). Waiting for confirmation.</p>}
          {canExtend && (
            <div className="sub-box">
              <h4>Keep the car longer?</h4>
              <input className="input" type="datetime-local" value={extTo} onChange={(e) => setExtTo(e.target.value)} aria-label="New return date" />
              {new Date(extTo) > new Date(b.dropoffAt) && <p className="small">{extFree ? <>Extra cost about <b>{money(Math.max(0, extExtra))}</b>.</> : <span className="err-text">The car isn’t free for all of that time.</span>}</p>}
              <button className="btn dark sm" onClick={requestExt}>Request extension</button>
            </div>
          )}
          {b.status === 'completed' && (
            <div className="sub-box">
              <h4>{myReview ? 'Your review' : 'How was your rental?'}</h4>
              {myReview ? (
                <><Stars value={myReview.rating} /><p className="small" style={{ marginTop: 6 }}>{myReview.text}</p><Badge status={myReview.status} /></>
              ) : (
                <><Stars value={rev.rating} onChange={(n) => setRev({ ...rev, rating: n })} size={22} />
                  <Field label="Your review"><textarea value={rev.text} onChange={(e) => setRev({ ...rev, text: e.target.value })} /></Field>
                  <button className="btn dark sm" style={{ marginTop: 8 }} onClick={sendReview}>Post review</button></>
              )}
            </div>
          )}
        </div>
      </div>
      {b.history?.length > 0 && (
        <div className="timeline">
          <h4>History</h4>
          <ul>{b.history.map((h, i) => <li key={i}><span>{fmtDate(h.at, true)}</span>{h.text}</li>)}</ul>
        </div>
      )}
    </Modal>
  );
}
