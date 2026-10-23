import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Printer } from 'lucide-react';
import { useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { WaButton } from '../../components/site';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { money, fmtDate, PAY_METHOD, placeOf } from '../../lib/utils';
import NotFound from './NotFound';

export default function BookingDone() {
  const { ref } = useParams();
  const { bookings, vehicles, locations, settings } = useDB();
  const { user } = useAuth();
  const b = bookings.find((x) => x.ref === ref);
  if (!b) return <NotFound />;
  const v = vehicles.find((x) => x.id === b.vehicleId);
  const loc = (id) => locations.find((l) => l.id === id)?.name;
  const confirmed = b.status === 'confirmed';
  const msg = `Hi JP Rent A Car, this is ${b.contact?.name || ''}. My booking ${b.ref}: ${v?.name}, ${fmtDate(b.pickupAt, true)} (${placeOf(b, 'pickup', locations)}) to ${fmtDate(b.dropoffAt, true)} (${placeOf(b, 'dropoff', locations)}). Total ${money(b.total)}.`;

  return (
    <div className="wrap done">
      <div className="done-card card">
        <CheckCircle2 size={48} className="done-icon" />
        <h1>{confirmed ? 'Your car is booked' : 'Booking request sent'}</h1>
        <p className="lead">
          {confirmed ? 'We’ve confirmed your booking and sent the details to ' : 'We’ll check the car and confirm within the hour (7 AM – 9 PM). Details sent to '}
          <b>{b.contact?.email}</b>.
        </p>
        <div className="done-ref"><span>Booking number</span><b>{b.ref}</b></div>
        <div className="done-sum">
          <VehiclePhoto vehicle={v} />
          <dl className="kv">
            <dt>Vehicle</dt><dd>{v?.name} ({b.mode === 'driver' ? 'with driver' : 'self-drive'})</dd>
            <dt>Pickup</dt><dd>{fmtDate(b.pickupAt, true)}, {placeOf(b, 'pickup', locations)}</dd>
            <dt>Return</dt><dd>{fmtDate(b.dropoffAt, true)}, {placeOf(b, 'dropoff', locations)}</dd>
            <dt>Total</dt><dd><b>{money(b.total, settings.currency)}</b></dd>
            <dt>Payment</dt><dd>{PAY_METHOD[b.paymentMethod]}</dd>
          </dl>
        </div>
        {b.paymentMethod === 'bank' && <pre className="bank-box">{settings.bankDetails}</pre>}
        <div className="done-actions">
          <WaButton text={msg}>Send details on WhatsApp</WaButton>
          {user ? <Link to="/account/bookings" className="btn dark">View my bookings</Link> : <Link to="/register" className="btn dark">Create an account</Link>}
          {user && <Link to={`/invoice/${b.id}`} className="btn ghost"><Printer size={16} />Print summary</Link>}
        </div>
      </div>
    </div>
  );
}
