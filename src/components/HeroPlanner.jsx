import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Flag, CalendarDays, Zap, Info, MessageCircle, Search, Users, Car, ChevronDown } from 'lucide-react';
import { db, useDB } from '../lib/db';
import PlaceInput from './PlaceInput';
import { waLink, fmtDate, rentalDays, cx, DAY } from '../lib/utils';

/* ---------- Hero slideshow: cross-fade with a slow zoom ---------- */
export function HeroSlides({ slides, children }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (n < 2 || paused) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), reduce ? 9000 : 6500);
    return () => clearInterval(t);
  }, [n, paused, reduce]);
  // preload the next slide so the fade is smooth
  useEffect(() => { if (n > 1) { const img = new Image(); img.src = slides[(i + 1) % n].image; } }, [i, n, slides]);
  const go = (d) => setI((x) => (x + d + n) % n);

  return (
    <section className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="hero-slides" aria-hidden="true">
        {slides.map((s, k) => (
          <div key={s.id || k} className={cx('hero-slide', k === i && 'on')} style={{ backgroundImage: `url("${s.image}")` }} />
        ))}
      </div>
      <div className="hero-shade" />
      {children}
      {n > 1 && (
        <div className="hero-controls wrap">
          <span className="hero-caption" aria-live="polite"><MapPin size={14} />{slides[i]?.caption}</span>
          <div className="hero-dots" role="tablist" aria-label="Choose a photo">
            {slides.map((s, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={s.caption || `Photo ${k + 1}`} className={cx(k === i && 'on')} onClick={() => setI(k)}><span style={k === i && !paused && !reduce ? { animationDuration: '6.5s' } : undefined} /></button>)}
          </div>
          <div className="hero-arrows">
            <button onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={20} /></button>
            <button onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={20} /></button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- "Plan your island journey" — WhatsApp request + availability search ---------- */
const toDate = (d) => new Date(d).toISOString().slice(0, 10);

export function TripPlanner() {
  const { settings, categories } = useDB();
  const nav = useNavigate();
  const today = toDate(Date.now());
  const [f, setF] = useState({ pickup: '', dropoff: '', from: toDate(Date.now() + DAY), to: toDate(Date.now() + 4 * DAY), sameReturn: true, type: '', passengers: 2, driver: 'self', name: '' });
  const [more, setMore] = useState(false);
  const [err, setErr] = useState({});
  const pickRef = useRef();
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const days = rentalDays(`${f.from}T09:00`, `${f.to}T09:00`);
  const dropoff = f.sameReturn ? f.pickup : f.dropoff;

  const check = () => {
    const e = {};
    if (!f.pickup.trim()) e.pickup = 'Where should we meet you?';
    if (!f.sameReturn && !f.dropoff.trim()) e.dropoff = 'Where will you return the car?';
    if (!f.from || f.from < today) e.from = 'Choose today or later.';
    if (!f.to || f.to <= f.from) e.to = 'Return must be after pickup.';
    setErr(e);
    if (e.pickup) pickRef.current?.querySelector('input')?.focus();
    return !Object.keys(e).length;
  };

  const message = () => {
    const cat = categories.find((c) => c.id === f.type)?.name;
    return [
      `Hi ${settings.businessName}! I’d like to rent a vehicle.`,
      '',
      `📍 Pickup: ${f.pickup.trim()}`,
      `🏁 Drop-off: ${dropoff.trim()}`,
      `🗓️ Dates: ${fmtDate(f.from)} to ${fmtDate(f.to)} (${days} day${days > 1 ? 's' : ''})`,
      `🚗 Vehicle: ${cat || 'Any suitable car'}`,
      `👥 Passengers: ${f.passengers}`,
      `🧑‍✈️ ${f.driver === 'driver' ? 'With a driver' : 'Self-drive'}`,
      f.name.trim() ? `🙋 Name: ${f.name.trim()}` : null,
      '',
      'Is a vehicle available?',
    ].filter((l) => l !== null).join('\n');
  };

  const sendWhatsApp = () => {
    if (!check()) return;
    const text = message();
    // keep a copy in the admin inbox so no enquiry is lost
    db.create('messages', { name: f.name.trim() || 'WhatsApp enquiry', email: '', phone: '', subject: `WhatsApp request: ${f.pickup.trim()} → ${dropoff.trim()}`, message: text, status: 'new', replies: [], type: 'whatsapp' }, 'msg');
    db.notify('admin', 'WhatsApp request started', `${f.pickup.trim()}, ${fmtDate(f.from)} to ${fmtDate(f.to)}`, '/admin/messages');
    window.open(waLink(settings.whatsapp, text), '_blank', 'noopener');
  };
  const searchCars = () => {
    if (!check()) return;
    const q = new URLSearchParams({ pickup: f.pickup.trim(), dropoff: dropoff.trim(), pickupAt: `${f.from}T09:00`, dropoffAt: `${f.to}T09:00`, mode: f.driver });
    nav(`/fleet?${q}`);
  };

  return (
    <div className="planner" id="plan">
      <div className="planner-head">
        <div>
          <h2>Plan your island journey</h2>
          <p>Fill in a few details. We’ll format your WhatsApp message for a quick reply, or you can check which cars are free and book online.</p>
        </div>
        <span className="planner-badge"><Zap size={14} />Quick WhatsApp response</span>
      </div>

      <div className="planner-grid">
        <div className="pl-field" ref={pickRef}>
          <label htmlFor="pl-pickup"><MapPin size={15} />Pickup location</label>
          <PlaceInput id="pl-pickup" value={f.pickup} onChange={(v) => set('pickup', v)} placeholder="e.g. Kandy City Centre, your hotel, the airport" invalid={err.pickup} />
          {err.pickup && <span className="pl-err">{err.pickup}</span>}
        </div>
        <div className="pl-field">
          <label htmlFor="pl-drop"><Flag size={15} />Drop-off location</label>
          {f.sameReturn ? (
            <button type="button" className="pl-same" onClick={() => set('sameReturn', false)}>
              <span>{f.pickup ? `Same as pickup (${f.pickup})` : 'Same as pickup'}</span><small>Change</small>
            </button>
          ) : (
            <PlaceInput id="pl-drop" icon={Flag} value={f.dropoff} onChange={(v) => set('dropoff', v)} placeholder="e.g. Ella, Galle, Colombo airport" invalid={err.dropoff} />
          )}
          {!f.sameReturn && <button type="button" className="pl-link" onClick={() => { set('sameReturn', true); set('dropoff', ''); }}>Return to the pickup place</button>}
          {err.dropoff && <span className="pl-err">{err.dropoff}</span>}
        </div>
        <div className="pl-field pl-dates">
          <label htmlFor="pl-from"><CalendarDays size={15} />Trip dates <em>{days > 0 ? `${days} day${days > 1 ? 's' : ''}` : ''}</em></label>
          <div className="pl-daterow">
            <input id="pl-from" type="date" min={today} value={f.from} onChange={(e) => { const v = e.target.value; setF((x) => ({ ...x, from: v, to: x.to <= v ? toDate(new Date(v).getTime() + 3 * DAY) : x.to })); }} aria-label="Pickup date" className={cx(err.from && 'invalid')} />
            <span aria-hidden="true">to</span>
            <input type="date" min={f.from} value={f.to} onChange={(e) => set('to', e.target.value)} aria-label="Return date" className={cx(err.to && 'invalid')} />
          </div>
          {(err.from || err.to) && <span className="pl-err">{err.from || err.to}</span>}
        </div>
        <div className="pl-actions">
          <button type="button" className="btn wa-grad lg" onClick={sendWhatsApp}><MessageCircle size={19} />Send request on WhatsApp</button>
          <button type="button" className="btn ghost" onClick={searchCars}><Search size={16} />See available cars</button>
        </div>
      </div>

      <button type="button" className={cx('pl-more', more && 'open')} onClick={() => setMore(!more)} aria-expanded={more}>
        <ChevronDown size={16} />{more ? 'Fewer details' : 'Add vehicle type, passengers or a driver (optional)'}
      </button>
      {more && (
        <div className="planner-extra">
          <label className="pl-mini"><Car size={15} /><span>Vehicle</span>
            <select value={f.type} onChange={(e) => set('type', e.target.value)}><option value="">Any suitable car</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <label className="pl-mini"><Users size={15} /><span>Passengers</span>
            <input type="number" min={1} max={14} value={f.passengers} onChange={(e) => set('passengers', e.target.value)} />
          </label>
          <div className="pl-mini"><span>Driver</span>
            <div className="seg">
              <button type="button" className={cx(f.driver === 'self' && 'on')} onClick={() => set('driver', 'self')}>Self-drive</button>
              <button type="button" className={cx(f.driver === 'driver' && 'on')} onClick={() => set('driver', 'driver')}>With driver</button>
            </div>
          </div>
          <label className="pl-mini"><span>Your name</span><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Optional" /></label>
        </div>
      )}
      <p className="planner-note"><Info size={14} />No payment or card needed. WhatsApp opens with your message ready to send.</p>
    </div>
  );
}
