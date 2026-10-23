import { Link } from 'react-router-dom';
import { CalendarCheck, MapPin, FileWarning, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useDB } from '../../lib/db';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Badge, Empty } from '../../components/ui';
import { WaButton } from '../../components/site';
import { money, fmtDate, timeAgo, placeOf } from '../../lib/utils';

export default function Overview() {
  const { user } = useAuth();
  const { bookings, vehicles, locations, notifications } = useDB();
  const mine = bookings.filter((b) => b.userId === user.id);
  const upcoming = mine.filter((b) => ['pending', 'confirmed', 'active'].includes(b.status)).sort((a, b) => new Date(a.pickupAt) - new Date(b.pickupAt));
  const next = upcoming[0];
  const v = next && vehicles.find((x) => x.id === next.vehicleId);
  const spent = mine.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.total || 0), 0);
  const days = next ? Math.ceil((new Date(next.pickupAt) - Date.now()) / 86400000) : 0;
  const noDocs = !(user.documents || []).length;
  const notes = notifications.filter((n) => n.userId === user.id).slice(0, 4);

  return (
    <>
      <h1 className="acc-title">Hello, {user.name.split(' ')[0]}</h1>
      {noDocs && (
        <div className="notice info"><FileWarning size={18} /><span>Add a photo of your driving licence to speed up pickup. <Link to="/account/documents">Upload documents</Link></span></div>
      )}
      {next ? (
        <div className="next-trip card">
          <VehiclePhoto vehicle={v} />
          <div className="next-body">
            <span className="muted small">{next.status === 'active' ? 'On the road now' : days <= 0 ? 'Pickup today' : `Your next trip starts in ${days} day${days > 1 ? 's' : ''}`}</span>
            <h2>{v?.name}</h2>
            <p><CalendarCheck size={16} />{fmtDate(next.pickupAt, true)} to {fmtDate(next.dropoffAt, true)}</p>
            <p><MapPin size={16} />{placeOf(next, 'pickup', locations)}</p>
            <div className="row-gap"><Badge status={next.status} /><span className="small">Booking {next.ref}</span></div>
            <div className="row-gap" style={{ marginTop: 14 }}>
              <Link to="/account/bookings" className="btn dark sm">Manage booking</Link>
              <WaButton className="btn ghost sm" text={`Hi, about my booking ${next.ref}: `}>Message us</WaButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="card"><Empty icon="Car" title="No upcoming trips" text="When you book a car it will show up here." action={<Link to="/fleet" className="btn primary">Find a car</Link>} /></div>
      )}
      {next && (
        <div className="card pad">
          <h3 style={{ marginBottom: 10 }}>Before you pick up</h3>
          <ul className="checklist">
            {[
              [next.status !== 'pending', 'Booking confirmed by our team'],
              [(user.documents || []).some((d) => d.type === 'Driving licence'), 'Driving licence uploaded', '/account/documents'],
              [next.mode === 'driver' || (user.documents || []).some((d) => /Permit/.test(d.type)), 'International Driving Permit or recognition permit uploaded', '/account/documents'],
              [(user.documents || []).some((d) => /Passport|National ID/.test(d.type)) || !!user.passportNo, 'Passport or NIC details added', '/account/documents'],
              [next.paymentStatus === 'paid' || next.paymentMethod === 'pickup', next.paymentMethod === 'pickup' ? 'Pay on pickup (cash or card)' : 'Payment completed'],
            ].map(([done, label, link], i) => (
              <li key={i} className={done ? 'done' : ''}>{done ? <CheckCircle2 size={18} /> : <Circle size={18} />}<span>{label}</span>{!done && link && <Link to={link} className="small">Do it now</Link>}</li>
            ))}
          </ul>
          <p className="small muted" style={{ marginTop: 10 }}>Bring your licence, passport and the card or cash for the deposit when you collect the car.</p>
        </div>
      )}
      <div className="mini-stats">
        <div className="card pad"><span>Total bookings</span><b>{mine.length}</b></div>
        <div className="card pad"><span>Upcoming</span><b>{upcoming.length}</b></div>
        <div className="card pad"><span>Saved cars</span><b>{user.favorites?.length || 0}</b></div>
        <div className="card pad"><span>Spent with us</span><b>{money(spent)}</b></div>
      </div>
      <div className="card pad">
        <div className="between"><h3>Recent updates</h3><Link to="/account/notifications" className="small">See all</Link></div>
        {notes.length ? <ul className="updates">{notes.map((n) => <li key={n.id} className={n.read ? '' : 'unread'}><b>{n.title}</b><span>{n.text}</span><small>{timeAgo(n.createdAt)}</small></li>)}</ul> : <p className="muted">Nothing new.</p>}
      </div>
    </>
  );
}
