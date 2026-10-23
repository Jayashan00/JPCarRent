import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Users, Cog, Fuel, Briefcase, DoorOpen, Calendar, Check, Heart, ChevronLeft, ChevronRight, Gauge, ShieldCheck, GitCompare } from 'lucide-react';
import { useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';
import { useCompare } from '../../lib/compare';
import { VehicleCard, ReviewCard, WaButton } from '../../components/site';
import { Stars, useToast, Empty } from '../../components/ui';
import { money, usd, quote, defaultDates, isVehicleFree, fmtDate, cx, resolvePlace } from '../../lib/utils';
import PlaceInput from '../../components/PlaceInput';
import NotFound from './NotFound';

export default function VehicleDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { vehicles, categories, extras, locations, bookings, settings, reviews, maintenance, seasons } = useDB();
  const { user, toggleFavorite } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const v = vehicles.find((x) => x.id === id);
  const d = defaultDates();
  const [f, setF] = useState({
    pickupAt: params.get('pickupAt') || d.pickupAt,
    dropoffAt: params.get('dropoffAt') || d.dropoffAt,
    pickup: resolvePlace(params.get('pickup'), locations)?.name || 'JP Rent A Car office, Kandy',
    dropoff: resolvePlace(params.get('dropoff') || params.get('pickup'), locations)?.name || 'JP Rent A Car office, Kandy',
    mode: params.get('mode') || (v && !v.selfDrive ? 'driver' : 'self'),
  });
  const [img, setImg] = useState(0);
  const q = useMemo(() => v && quote({
    vehicle: v, ...f, allExtras: extras,
    pickupLocation: resolvePlace(f.pickup, locations), dropoffLocation: resolvePlace(f.dropoff, locations),
    taxPercent: settings.taxPercent, seasons,
  }), [v, f, extras, locations, settings, seasons]);

  if (!v) return <NotFound />;
  const cat = categories.find((c) => c.id === v.categoryId);
  const free = isVehicleFree(v.id, f.pickupAt, f.dropoffAt, bookings, null, maintenance);
  const bad = new Date(f.dropoffAt) <= new Date(f.pickupAt);
  const canBook = v.status === 'available' && free && !bad;
  const vr = reviews.filter((r) => r.vehicleId === v.id && r.status === 'approved');
  const avg = vr.length ? vr.reduce((s, r) => s + r.rating, 0) / vr.length : 0;
  const fav = user?.favorites?.includes(v.id);
  const upcoming = bookings.filter((b) => b.vehicleId === v.id && ['pending', 'confirmed', 'active'].includes(b.status) && new Date(b.dropoffAt) > new Date())
    .sort((a, b) => new Date(a.pickupAt) - new Date(b.pickupAt));
  const similar = vehicles.filter((x) => x.id !== v.id && (x.categoryId === v.categoryId || Math.abs(x.dailyRate - v.dailyRate) < 4000)).slice(0, 3);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const compare = useCompare();

  const go = () => nav(`/book/${v.id}?${new URLSearchParams(f).toString()}`);

  return (
    <div className="wrap detail">
      <Link to="/fleet" className="back"><ChevronLeft size={18} />Back to all vehicles</Link>
      <div className="detail-grid">
        <div>
          <div className="gallery">
            <div className="gallery-main">
              <VehiclePhoto vehicle={v} index={img} />
              {v.images?.length > 1 && (
                <>
                  <button className="gal-nav prev" onClick={() => setImg((img - 1 + v.images.length) % v.images.length)} aria-label="Previous photo"><ChevronLeft size={22} /></button>
                  <button className="gal-nav next" onClick={() => setImg((img + 1) % v.images.length)} aria-label="Next photo"><ChevronRight size={22} /></button>
                  <span className="gal-count">{img + 1} / {v.images.length}</span>
                </>
              )}
              <button className={cx('fav-btn big', fav && 'on')} aria-pressed={!!fav} aria-label="Save this car"
                onClick={() => { if (!toggleFavorite(v.id)) { toast('Sign in to save cars.', 'error'); return nav('/login'); } toast(fav ? 'Removed from saved cars' : 'Saved to your list'); }}>
                <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>
            {v.images?.length > 1 && (
              <div className="gallery-thumbs">
                {v.images.map((src, i) => (
                  <button key={i} className={cx(i === img && 'on')} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}><VehiclePhoto vehicle={{ ...v, images: [src] }} /></button>
                ))}
              </div>
            )}
            {v.photoCredit && <p className="photo-credit">{v.photoCreditUrl ? <a href={v.photoCreditUrl} target="_blank" rel="noreferrer">{v.photoCredit}</a> : v.photoCredit}</p>}
          </div>

          <div className="detail-head">
            <span className="muted">{cat?.name} · {v.year}</span>
            <h1>{v.name}</h1>
            {avg > 0 && <div className="rating-line"><Stars value={avg} /> <span className="muted small">{avg.toFixed(1)} from {vr.length} review{vr.length > 1 ? 's' : ''}</span></div>}
          </div>

          <ul className="spec-grid">
            <li><Users /><b>{v.seats}</b><span>Seats</span></li>
            <li><Cog /><b>{v.transmission}</b><span>Gearbox</span></li>
            <li><Fuel /><b>{v.fuel}</b><span>Fuel</span></li>
            <li><Briefcase /><b>{v.bags}</b><span>Large bags</span></li>
            <li><DoorOpen /><b>{v.doors}</b><span>Doors</span></li>
            <li><Gauge /><b>{v.kmPerDay} km</b><span>Free per day</span></li>
          </ul>

          <section className="detail-sec">
            <h2>About this car</h2>
            <p className="lead">{v.description}</p>
          </section>

          <section className="detail-sec">
            <h2>Features</h2>
            <ul className="feature-list">{v.features.map((x) => <li key={x}><Check size={16} />{x}</li>)}</ul>
          </section>

          <section className="detail-sec">
            <h2>Prices</h2>
            <table className="price-table">
              <tbody>
                <tr><th>1 to 6 days</th><td>{money(v.dailyRate, settings.currency)} per day</td></tr>
                {v.weeklyRate > 0 && <tr><th>7 to 29 days</th><td>{money(v.weeklyRate / 7, settings.currency)} per day <span className="muted">({money(v.weeklyRate)} a week)</span></td></tr>}
                {v.monthlyRate > 0 && <tr><th>30 days or more</th><td>{money(v.monthlyRate / 30, settings.currency)} per day <span className="muted">({money(v.monthlyRate)} a month)</span></td></tr>}
                {v.withDriver && <tr><th>Driver</th><td>+ {money(v.driverRate, settings.currency)} per day, meals and lodging included</td></tr>}
                <tr><th>Refundable deposit</th><td>{money(v.deposit, settings.currency)} <span className="muted">(self-drive only)</span></td></tr>
                <tr><th>Extra kilometres</th><td>{money(v.extraKmRate, settings.currency)} per km over {v.kmPerDay} km a day</td></tr>
              </tbody>
            </table>
          </section>

          <section className="detail-sec">
            <h2>Good to know</h2>
            <ul className="feature-list plain">
              <li><ShieldCheck size={16} />Basic insurance included. Add full cover at checkout to reduce your excess to zero.</li>
              <li><Calendar size={16} />Free cancellation up to 48 hours before pickup.</li>
              <li><Check size={16} />Drivers must be {settings.minDriverAge}+ with an International Driving Permit if licensed abroad.</li>
            </ul>
          </section>

          <section className="detail-sec">
            <h2>Availability</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>Crossed-out days are already booked. Pick your dates in the booking box.</p>
            <AvailabilityCalendar vehicleId={v.id} from={f.pickupAt} to={f.dropoffAt} onPick={(a, b) => setF({ ...f, pickupAt: a, dropoffAt: b })} />
          </section>

          <section className="detail-sec">
            <h2>Reviews</h2>
            {vr.length ? <div className="reviews-col">{vr.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              : <Empty icon="Star" title="No reviews for this car yet" text="Customers can review a car after their rental is completed." />}
          </section>
        </div>

        <aside className="book-box" aria-label="Book this car">
          <div className="book-price">
            <b>{money(v.dailyRate, settings.currency)}</b><span>per day</span>
            {settings.showUsd && <small>{usd(v.dailyRate, settings.usdRate)}</small>}
          </div>
          {v.status !== 'available' && <p className="notice warn">This vehicle is {v.status === 'maintenance' ? 'being serviced' : 'not available'} right now. Ask us about similar cars.</p>}
          {v.withDriver && v.selfDrive && (
            <div className="seg full">
              <button className={cx(f.mode === 'self' && 'on')} onClick={() => setF({ ...f, mode: 'self' })}>Self-drive</button>
              <button className={cx(f.mode === 'driver' && 'on')} onClick={() => setF({ ...f, mode: 'driver' })}>With driver</button>
            </div>
          )}
          <div className="bb-fields">
            <label className="field"><span className="field-label">Pickup</span><input type="datetime-local" value={f.pickupAt} onChange={set('pickupAt')} /></label>
            <label className="field"><span className="field-label">Return</span><input type="datetime-local" value={f.dropoffAt} onChange={set('dropoffAt')} /></label>
            <div className="field"><span className="field-label">Pickup location</span><PlaceInput value={f.pickup} onChange={(v) => setF({ ...f, pickup: v })} ariaLabel="Pickup location" /></div>
            <div className="field"><span className="field-label">Return location</span><PlaceInput value={f.dropoff} onChange={(v) => setF({ ...f, dropoff: v })} ariaLabel="Return location" /></div>
            {(resolvePlace(f.pickup, locations)?.custom || resolvePlace(f.dropoff, locations)?.custom) && <p className="small muted">We deliver anywhere in Sri Lanka. For places outside our listed points, we confirm any delivery charge on WhatsApp before you pay.</p>}
          </div>
          {bad ? <p className="notice warn">Return must be after pickup.</p> : !free ? <p className="notice warn">This car is already booked for part of these dates. Try other dates or a similar car.</p> : null}
          {q && q.days > 0 && (
            <div className="quote">
              {q.lines.map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
              {q.tax > 0 && <div className="q-line"><span>Tax</span><span>{money(q.tax)}</span></div>}
              <div className="q-total"><span>Total</span><span>{money(q.total, settings.currency)}</span></div>
              {settings.showUsd && <div className="q-usd">{usd(q.total, settings.usdRate)}</div>}
              {q.deposit > 0 && <p className="small muted">Plus a refundable deposit of {money(q.deposit)} at pickup.</p>}
            </div>
          )}
          <button className="btn primary block lg" disabled={!canBook} onClick={go}>Continue to book</button>
          <p className="small muted center">No payment needed now. Free cancellation up to 48 hours before pickup.</p>
          <button className="btn ghost block" onClick={() => { compare.toggle(v.id); toast(compare.has(v.id) ? 'Removed from comparison' : 'Added to comparison'); }}><GitCompare size={16} />{compare.has(v.id) ? 'Remove from compare' : 'Compare with other cars'}</button>
          <WaButton className="btn ghost block" text={`Hi JP Rent A Car, is the ${v.name} available from ${fmtDate(f.pickupAt, true)} to ${fmtDate(f.dropoffAt, true)}?`}>Ask about this car</WaButton>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section-sm">
          <h2>Similar vehicles</h2>
          <div className="fleet-grid">{similar.map((x) => <VehicleCard key={x.id} vehicle={x} />)}</div>
        </section>
      )}
    </div>
  );
}
