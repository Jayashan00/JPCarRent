import { Link, useParams } from 'react-router-dom';
import { Printer, ChevronLeft } from 'lucide-react';
import { useDB } from '../../lib/db';
import { Logo } from '../../components/ui';
import { money, fmtDate, placeOf } from '../../lib/utils';
import { setMoneyScope } from '../../lib/currency';
import { FUEL } from '../admin/Inspection';

/** Printable rental agreement, signed by both parties at handover. */
export default function Agreement() {
  setMoneyScope('base');
  const { id } = useParams();
  const { bookings, vehicles, locations, users, settings, drivers, pages, extras } = useDB();
  const b = bookings.find((x) => x.id === id);
  if (!b) return <div className="wrap section"><p>Booking not found.</p><Link to="/admin/bookings">Back</Link></div>;
  const v = vehicles.find((x) => x.id === b.vehicleId) || {};
  const c = b.contact || users.find((u) => u.id === b.userId) || b.guest || {};
  const u = users.find((x) => x.id === b.userId) || {};
  const loc = (lid) => locations.find((l) => l.id === lid)?.name;
  const drv = drivers.find((d) => d.id === b.driverId);
  const terms = pages.find((p) => p.id === 'terms')?.body || '';
  const out = b.checkout;
  return (
    <div className="invoice-page">
      <div className="invoice-tools no-print">
        <Link to={`/admin/bookings?open=${b.id}`} className="btn ghost sm"><ChevronLeft size={16} />Back</Link>
        <button className="btn dark sm" onClick={() => window.print()}><Printer size={16} />Print agreement</button>
      </div>
      <article className="invoice agreement">
        <header className="inv-head">
          <div><Logo settings={settings} /><p className="small muted" style={{ marginTop: 10 }}>{settings.address}<br />Phone & WhatsApp: {settings.phone}{settings.email ? ` · ${settings.email}` : ''}</p></div>
          <div className="inv-meta"><h1>Rental agreement</h1><p><b>{b.ref}</b></p><p className="small muted">{fmtDate(new Date())}</p></div>
        </header>
        <section className="inv-parties">
          <div><h4>Renter</h4><p>{c.name}<br />{c.email} · {c.phone}<br />{c.country}<br />Licence: {c.licenseNo || u.licenseNo || '________________'}<br />Passport/NIC: {c.passportNo || u.passportNo || '________________'}</p></div>
          <div><h4>Vehicle</h4><p>{v.name} ({v.year})<br />Plate: {v.plate}<br />{b.mode === 'driver' ? `With driver${drv ? `: ${drv.name} (${drv.phone})` : ''}` : 'Self-drive'}<br />Free km: {v.kmPerDay} per day, then {money(v.extraKmRate)} per km</p></div>
        </section>
        <table className="inv-table">
          <tbody>
            <tr><td>Pickup</td><td>{fmtDate(b.pickupAt, true)}, {placeOf(b, 'pickup', locations)}</td></tr>
            <tr><td>Return</td><td>{fmtDate(b.dropoffAt, true)}, {placeOf(b, 'dropoff', locations)}</td></tr>
            <tr><td>Rental days</td><td>{b.days}</td></tr>
            <tr><td>Extras</td><td>{(b.extras || []).map((e) => extras.find((x) => x.id === e)?.name).filter(Boolean).join(', ') || 'None'}</td></tr>
            <tr><td>Rental total</td><td>{money(b.total)}</td></tr>
            <tr><td>Paid at signing</td><td>{money(b.amountPaid || 0)}</td></tr>
            <tr><td>Security deposit</td><td>{b.deposit ? money(b.deposit) : 'None'}</td></tr>
            <tr><td>Odometer at handover</td><td>{out ? `${out.odometer?.toLocaleString()} km` : '__________ km'}</td></tr>
            <tr><td>Fuel at handover</td><td>{out ? FUEL[out.fuel] : 'Empty  ¼  ½  ¾  Full'}</td></tr>
            <tr><td>Existing damage</td><td>{out?.damage || ' '}</td></tr>
          </tbody>
        </table>
        <h4>Terms</h4>
        <div className="agree-terms">{terms.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
        <p className="small">The renter confirms they have read these terms, checked the vehicle, and agree to return it on time with the same fuel level and in the same condition. Late returns, extra kilometres, fuel, cleaning, damage and traffic fines are charged as listed in the terms.</p>
        <div className="signs">
          <div><span /><b>Renter</b><small>{c.name}</small></div>
          <div><span /><b>For {settings.businessName}</b><small>Name and signature</small></div>
        </div>
      </article>
    </div>
  );
}