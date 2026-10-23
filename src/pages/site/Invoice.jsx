import { Link, useParams } from 'react-router-dom';
import { Printer, ChevronLeft } from 'lucide-react';
import { useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Logo, Badge } from '../../components/ui';
import { money, fmtDate, PAY_METHOD, placeOf } from '../../lib/utils';
import { setMoneyScope } from '../../lib/currency';

export default function Invoice() {
  setMoneyScope('base');
  const { id } = useParams();
  const { bookings, vehicles, locations, users, settings, drivers } = useDB();
  const { user, isAdmin } = useAuth();
  const b = bookings.find((x) => x.id === id);
  if (!b || (!isAdmin && b.userId !== user.id)) return <div className="wrap section"><p>Invoice not found.</p><Link to="/">Home</Link></div>;
  const v = vehicles.find((x) => x.id === b.vehicleId);
  const c = b.contact || users.find((u) => u.id === b.userId) || b.guest || {};
  const loc = (lid) => locations.find((l) => l.id === lid)?.name;
  const drv = drivers.find((d) => d.id === b.driverId);
  const balance = (b.total || 0) - (b.amountPaid || 0);
  return (
    <div className="invoice-page">
      <div className="invoice-tools no-print">
        <Link to={isAdmin ? '/admin/bookings' : '/account/bookings'} className="btn ghost sm"><ChevronLeft size={16} />Back</Link>
        <button className="btn dark sm" onClick={() => window.print()}><Printer size={16} />Print or save as PDF</button>
      </div>
      <article className="invoice">
        <header className="inv-head">
          <div><Logo settings={settings} /><p className="small muted" style={{ marginTop: 10 }}>{settings.address}<br />Phone & WhatsApp: {settings.phone}{settings.email ? ` · ${settings.email}` : ''}</p></div>
          <div className="inv-meta"><h1>Invoice</h1><p><b>{b.ref}</b></p><p className="small muted">Issued {fmtDate(b.createdAt)}</p><Badge status={b.paymentStatus} /></div>
        </header>
        <section className="inv-parties">
          <div><h4>Billed to</h4><p>{c.name}<br />{c.email}<br />{c.phone}<br />{c.country}</p></div>
          <div><h4>Rental</h4><p>{v?.name} ({v?.plate})<br />{b.mode === 'driver' ? `With driver${drv ? `: ${drv.name}` : ''}` : 'Self-drive'}<br />{fmtDate(b.pickupAt, true)}, {placeOf(b, 'pickup', locations)}<br />to {fmtDate(b.dropoffAt, true)}, {placeOf(b, 'dropoff', locations)}</p></div>
        </section>
        <table className="inv-table">
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            {(b.lines || []).map((l, i) => <tr key={i}><td>{l.label}</td><td>{money(l.amount)}</td></tr>)}
            {b.discount > 0 && <tr><td>Discount {b.promoCode && `(${b.promoCode})`}</td><td>− {money(b.discount)}</td></tr>}
            {b.tax > 0 && <tr><td>Tax</td><td>{money(b.tax)}</td></tr>}
          </tbody>
          <tfoot>
            <tr><th>Total</th><th>{money(b.total, settings.currency)}</th></tr>
            <tr><td>Paid ({PAY_METHOD[b.paymentMethod]})</td><td>{money(b.amountPaid || 0)}</td></tr>
            <tr><th>Balance due</th><th>{money(balance, settings.currency)}</th></tr>
          </tfoot>
        </table>
        {b.deposit > 0 && <p className="small muted">A refundable security deposit of {money(b.deposit)} is collected at pickup and is not part of this invoice.</p>}
        <footer className="inv-foot small muted">Thank you for renting with {settings.businessName}. Questions? WhatsApp {settings.phone}.</footer>
      </article>
    </div>
  );
}