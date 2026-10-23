import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, MapPin, Check } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { PageHero, WaButton, SafeImg } from '../../components/site';
import { Modal, Field, useToast } from '../../components/ui';
import { money, fmtDate } from '../../lib/utils';

export default function RoutesPage() {
  const { tours, settings } = useDB();
  const [req, setReq] = useState(null);
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }, [hash]);

  return (
    <>
      <PageHero title="Routes & transfers" text="Fixed-price drives from Kandy with one of our drivers. Prices are per vehicle (up to 3 passengers in a car), not per person, and include fuel, tolls and stops along the way." />
      <div className="wrap section-sm tours">
        {tours.filter((t) => t.active).map((t) => (
          <article key={t.id} id={t.id} className="tour card">
            <SafeImg src={t.image} alt={t.destination} className="tour-img" />
            <div className="tour-body">
              <div className="tour-sign"><span>{t.from}</span><svg viewBox="0 0 48 20" aria-hidden="true"><path d="M2 10h38M32 3l9 7-9 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg><b>{t.destination}</b></div>
              <h2>{t.title}</h2>
              <p className="tour-meta"><span><MapPin size={16} />{t.distanceKm} km</span><span><Clock size={16} />About {t.duration}</span></p>
              <p className="muted">{t.description}</p>
              {t.highlights?.length > 0 && <ul className="tour-hl">{t.highlights.map((h) => <li key={h}><Check size={15} />{h}</li>)}</ul>}
              <div className="tour-foot">
                <div className="price"><b>{money(t.price, settings.currency)}</b><span>per car</span></div>
                <div className="row-gap">
                  <button className="btn primary" onClick={() => setReq(t)}>Request this transfer</button>
                  <WaButton className="btn ghost" text={`Hi JP Rent A Car, I’d like to book the ${t.title} transfer. Date: , Passengers: `}>WhatsApp</WaButton>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {req && <TransferRequest tour={req} onClose={() => setReq(null)} />}
    </>
  );
}

function TransferRequest({ tour, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', date: '', passengers: 2, pickup: '', notes: '' });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const send = () => {
    const e = {};
    if (!f.name) e.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email.';
    if (!f.date) e.date = 'Choose a date.';
    setErr(e);
    if (Object.keys(e).length) return;
    db.create('messages', {
      name: f.name, email: f.email, phone: f.phone, status: 'new', replies: [], type: 'transfer', tourId: tour.id,
      subject: `Transfer request: ${tour.title}`,
      message: `Date: ${fmtDate(f.date, true)}\nPassengers: ${f.passengers}\nPickup point: ${f.pickup || 'Not given'}\n\n${f.notes}`,
    }, 'msg');
    db.notify('admin', 'New transfer request', `${f.name} asked for ${tour.title}.`, '/admin/messages');
    toast('Request sent. We’ll reply with a confirmation shortly.');
    onClose();
  };
  return (
    <Modal title={tour.title} onClose={onClose} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={send}>Send request</button></>}>
      <p className="muted" style={{ marginBottom: 16 }}>{money(tour.price)} per vehicle. We’ll confirm availability and the final price by email or WhatsApp.</p>
      <div className="form-grid">
        <Field label="Your name" error={err.name}><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" error={err.email}><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone or WhatsApp"><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Date and pickup time" error={err.date}><input type="datetime-local" value={f.date} onChange={set('date')} /></Field>
        <Field label="Passengers"><input type="number" min={1} max={14} value={f.passengers} onChange={set('passengers')} /></Field>
        <Field label="Pickup point"><input value={f.pickup} onChange={set('pickup')} placeholder="Hotel name or address" /></Field>
        <Field label="Notes" className="full"><textarea value={f.notes} onChange={set('notes')} placeholder="Luggage, child seats, stops you’d like to make…" /></Field>
      </div>
    </Modal>
  );
}
