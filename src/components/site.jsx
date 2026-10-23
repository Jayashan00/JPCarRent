import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Users, Fuel, Cog, Briefcase, Plus, Minus, Search, MessageCircle, GitCompare, X } from 'lucide-react';
import { useCompare } from '../lib/compare';
import PlaceInput from './PlaceInput';
import { useDB } from '../lib/db';
import { useAuth } from '../lib/auth';
import { VehiclePhoto } from './VehiclePhoto';
import { Stars, useToast } from './ui';
import { money, usd, cx, defaultDates, waLink, fmtDate } from '../lib/utils';

export function PageHero({ title, text, children, image }) {
  return (
    <section className={cx('page-hero', image && 'with-img')} style={image ? { '--img': `url("${image}")` } : undefined}>
      <div className="wrap">
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHead({ title, text, action, center }) {
  return (
    <div className={cx('section-head', center && 'center')}>
      <div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function VehicleCard({ vehicle, available, query = '' }) {
  const { categories, settings, reviews } = useDB();
  const { user, toggleFavorite } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const cat = categories.find((c) => c.id === vehicle.categoryId);
  const fav = user?.favorites?.includes(vehicle.id);
  const vr = reviews.filter((r) => r.vehicleId === vehicle.id && r.status === 'approved');
  const avg = vr.length ? vr.reduce((s, r) => s + r.rating, 0) / vr.length : 0;
  const unavailable = vehicle.status !== 'available' || available === false;
  const compare = useCompare();
  const inCompare = compare.has(vehicle.id);

  const onFav = (e) => {
    e.preventDefault();
    if (!toggleFavorite(vehicle.id)) { toast('Sign in to save cars to your list.', 'error'); nav('/login'); return; }
    toast(fav ? 'Removed from saved cars' : 'Saved to your list');
  };

  return (
    <article className={cx('vcard', unavailable && 'is-off')}>
      <Link to={`/fleet/${vehicle.id}${query}`} className="vcard-media">
        <VehiclePhoto vehicle={vehicle} />
        <span className="vcard-cat">{cat?.name}</span>
        {available === true && vehicle.status === 'available' && <span className="vcard-free">Free on your dates</span>}
        {unavailable && <span className="vcard-busy">{vehicle.status === 'maintenance' ? 'In service' : 'Booked on your dates'}</span>}
      </Link>
      <button className={cx('fav-btn', fav && 'on')} onClick={onFav} aria-label={fav ? 'Remove from saved' : 'Save this car'} aria-pressed={!!fav}>
        <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
      </button>
      <div className="vcard-body">
        <div className="vcard-title">
          <h3><Link to={`/fleet/${vehicle.id}${query}`}>{vehicle.name}</Link></h3>
          <span className="muted small">{vehicle.year}{avg ? <> · <Stars value={avg} size={12} /></> : null}</span>
        </div>
        <ul className="specs">
          <li><Users size={15} />{vehicle.seats} seats</li>
          <li><Cog size={15} />{vehicle.transmission}</li>
          <li><Fuel size={15} />{vehicle.fuel}</li>
          <li><Briefcase size={15} />{vehicle.bags} bags</li>
        </ul>
        <div className="vcard-foot">
          <div className="price">
            <b>{money(vehicle.dailyRate, settings.currency)}</b><span>/ day</span>
            {settings.showUsd && <small>{usd(vehicle.dailyRate, settings.usdRate)}</small>}
          </div>
          <Link to={`/fleet/${vehicle.id}${query}`} className="btn dark sm">View & book</Link>
        </div>
        <div className="vcard-extra">
          {!vehicle.selfDrive ? <span className="vcard-note">Available with driver only</span> : <span />}
          <label className="cmp-check">
            <input type="checkbox" checked={inCompare} disabled={!inCompare && compare.full} onChange={() => compare.toggle(vehicle.id)} />
            Compare
          </label>
        </div>
      </div>
    </article>
  );
}

export function SearchPanel({ compact, initial = {} }) {
  const nav = useNavigate();
  const d = defaultDates();
  const [f, setF] = useState({ pickup: '', dropoff: '', pickupAt: d.pickupAt, dropoffAt: d.dropoffAt, mode: 'self', ...initial });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (new Date(f.dropoffAt) <= new Date(f.pickupAt)) return setErr('Return must be after pickup.');
    if (new Date(f.pickupAt) < new Date(Date.now() - 3600000)) return setErr('Pickup can’t be in the past.');
    setErr('');
    nav(`/fleet?${new URLSearchParams({ ...f, dropoff: f.dropoff || f.pickup }).toString()}`);
  };
  return (
    <form className={cx('search-panel', compact && 'compact')} onSubmit={submit}>
      <div className="sp-mode" role="radiogroup" aria-label="Rental type">
        <button type="button" className={cx(f.mode === 'self' && 'on')} onClick={() => setF({ ...f, mode: 'self' })} aria-pressed={f.mode === 'self'}>Self-drive</button>
        <button type="button" className={cx(f.mode === 'driver' && 'on')} onClick={() => setF({ ...f, mode: 'driver' })} aria-pressed={f.mode === 'driver'}>With a driver</button>
      </div>
      <div className="sp-fields">
        <div className="sp-field"><span>Pickup</span><PlaceInput value={f.pickup} onChange={(v) => setF({ ...f, pickup: v })} placeholder="Any place in Sri Lanka" ariaLabel="Pickup location" /></div>
        <div className="sp-field"><span>Return</span><PlaceInput value={f.dropoff} onChange={(v) => setF({ ...f, dropoff: v })} placeholder="Same as pickup" ariaLabel="Return location" /></div>
        <label className="sp-field"><span>Pickup date</span>
          <input type="datetime-local" value={f.pickupAt} onChange={set('pickupAt')} required />
        </label>
        <label className="sp-field"><span>Return date</span>
          <input type="datetime-local" value={f.dropoffAt} onChange={set('dropoffAt')} required />
        </label>
        <button className="btn primary sp-go" type="submit"><Search size={18} />Find a car</button>
      </div>
      {err && <p className="sp-err" role="alert">{err}</p>}
    </form>
  );
}

export function RouteSign({ tour, onClick }) {
  return (
    <button className="route-sign" onClick={onClick} type="button">
      <span className="rs-plate">
        <span className="rs-from">From {tour.from}</span>
        <span className="rs-row"><b>{tour.destination}</b><span className="rs-km">{tour.distanceKm}<small>km</small></span></span>
        <svg className="rs-arrow" viewBox="0 0 48 20" aria-hidden="true"><path d="M2 10h38M32 3l9 7-9 7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="rs-meta"><span>{tour.duration} drive</span><span>with driver from <b>{money(tour.price)}</b></span></span>
    </button>
  );
}

export function Accordion({ items }) {
  const [open, setOpen] = useState(items[0]?.id);
  return (
    <div className="accordion">
      {items.map((it) => (
        <div key={it.id} className={cx('acc-item', open === it.id && 'open')}>
          <button className="acc-q" onClick={() => setOpen(open === it.id ? null : it.id)} aria-expanded={open === it.id}>
            <span>{it.question}</span>{open === it.id ? <Minus size={18} /> : <Plus size={18} />}
          </button>
          {open === it.id && <div className="acc-a"><p>{it.answer}</p></div>}
        </div>
      ))}
    </div>
  );
}

export function ReviewCard({ review }) {
  return (
    <figure className="review">
      <Stars value={review.rating} size={15} />
      <blockquote>{review.text}</blockquote>
      <figcaption>
        <b>{review.name}</b>
        <span>{review.trip}{review.source === 'google' ? ' (Google review)' : ` (${fmtDate(review.createdAt)})`}</span>
      </figcaption>
    </figure>
  );
}

export function MapEmbed({ query }) {
  return (
    <iframe className="map" title="Map to JP Rent A Car Kandy" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`} />
  );
}

export function Prose({ text }) {
  return <div className="prose">{String(text || '').split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>;
}

export function WaButton({ text, children = 'Ask on WhatsApp', className = 'btn wa' }) {
  const { settings } = useDB();
  return <a className={className} href={waLink(settings.whatsapp, text)} target="_blank" rel="noreferrer"><MessageCircle size={18} />{children}</a>;
}

export function SafeImg({ src, alt, className }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return <div className={cx('img-fallback', className)} aria-label={alt} role="img" />;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setBad(true)} />;
}

export function CompareBar() {
  const { vehicles } = useDB();
  const compare = useCompare();
  const nav = useNavigate();
  const list = compare.ids.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="compare-bar" role="region" aria-label="Cars to compare">
      <div className="wrap cb-inner">
        <GitCompare size={20} />
        <div className="cb-items">
          {list.map((v) => <span key={v.id} className="cb-item">{v.name}<button onClick={() => compare.toggle(v.id)} aria-label={`Remove ${v.name}`}><X size={14} /></button></span>)}
          {list.length < 3 && <span className="muted small">Add up to {3 - list.length} more</span>}
        </div>
        <button className="btn link" onClick={compare.clear}>Clear</button>
        <button className="btn primary sm" disabled={list.length < 2} onClick={() => nav('/compare')}>Compare {list.length} cars</button>
      </div>
    </div>
  );
}
