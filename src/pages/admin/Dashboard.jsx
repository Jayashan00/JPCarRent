import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useDB } from '../../lib/db';
import { Badge, Empty } from '../../components/ui';
import { money, fmtDate, fmtShort, DAY } from '../../lib/utils';

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function Dashboard() {
  const { bookings, vehicles, messages, reviews, maintenance, users, settings } = useDB();
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const pmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const inRange = (b, s, e) => new Date(b.pickupAt) >= s && new Date(b.pickupAt) < e;
  const revThis = live.filter((b) => inRange(b, mStart, new Date(8.64e15))).reduce((s, b) => s + (b.total || 0), 0);
  const revPrev = live.filter((b) => inRange(b, pmStart, mStart)).reduce((s, b) => s + (b.total || 0), 0);
  const bkThis = live.filter((b) => new Date(b.createdAt) >= mStart).length;
  const active = bookings.filter((b) => b.status === 'active');
  const onRoad = new Set(bookings.filter((b) => ['active', 'confirmed'].includes(b.status) && new Date(b.pickupAt) <= now && new Date(b.dropoffAt) >= now).map((b) => b.vehicleId));
  const fleetReady = vehicles.filter((v) => v.status === 'available').length;
  const util = vehicles.length ? Math.round((onRoad.size / vehicles.length) * 100) : 0;
  const pending = bookings.filter((b) => b.status === 'pending');
  const outstanding = live.filter((b) => ['confirmed', 'active', 'completed'].includes(b.status)).reduce((s, b) => s + Math.max(0, (b.total || 0) - (b.amountPaid || 0)), 0);

  // last 6 months revenue
  const months = Array.from({ length: 6 }, (_, i) => {
    const s = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const e = new Date(now.getFullYear(), now.getMonth() - 4 + i, 1);
    return { label: s.toLocaleString('en-GB', { month: 'short' }), value: live.filter((b) => inRange(b, s, e)).reduce((x, b) => x + (b.total || 0), 0) };
  });
  const maxM = Math.max(...months.map((m) => m.value), 1);

  const todayOut = bookings.filter((b) => ['confirmed', 'pending'].includes(b.status) && new Date(b.pickupAt) < new Date(+now + 2 * DAY) && new Date(b.pickupAt) > new Date(+now - DAY));
  const todayIn = bookings.filter((b) => b.status === 'active' && new Date(b.dropoffAt) < new Date(+now + 3 * DAY));
  const vName = (id) => vehicles.find((v) => v.id === id)?.name;
  const cName = (b) => b.contact?.name || users.find((u) => u.id === b.userId)?.name || b.guest?.name || 'Guest';
  const recent = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const upMaint = maintenance.filter((m) => m.status !== 'done').sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
  const delta = revPrev ? Math.round(((revThis - revPrev) / revPrev) * 100) : null;

  const byCat = vehicles.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {});

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Dashboard</h1><p className="muted">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
        <div className="row-gap"><Link to="/admin/bookings?new=1" className="btn primary sm"><Plus size={16} />New booking</Link><Link to="/admin/vehicles?new=1" className="btn ghost sm"><Plus size={16} />Add vehicle</Link></div>
      </div>

      {(pending.length > 0 || messages.some((m) => m.status === 'new') || reviews.some((r) => r.status === 'pending')) && (
        <div className="todo-bar">
          {pending.length > 0 && <Link to="/admin/bookings?status=pending"><b>{pending.length}</b> booking{pending.length > 1 ? 's' : ''} to confirm</Link>}
          {messages.some((m) => m.status === 'new') && <Link to="/admin/messages"><b>{messages.filter((m) => m.status === 'new').length}</b> unread message{messages.filter((m) => m.status === 'new').length > 1 ? 's' : ''}</Link>}
          {reviews.some((r) => r.status === 'pending') && <Link to="/admin/reviews"><b>{reviews.filter((r) => r.status === 'pending').length}</b> review{reviews.filter((r) => r.status === 'pending').length > 1 ? 's' : ''} to approve</Link>}
        </div>
      )}

      <div className="kpis">
        <div className="kpi card"><span>Revenue this month</span><b>{money(revThis, settings.currency)}</b>
          {delta != null && <small className={delta >= 0 ? 'up' : 'down'}>{delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(delta)}% vs last month</small>}</div>
        <div className="kpi card"><span>New bookings this month</span><b>{bkThis}</b><small>{pending.length} awaiting confirmation</small></div>
        <div className="kpi card"><span>Cars on the road now</span><b>{onRoad.size} of {vehicles.length}</b><small>{util}% of the fleet in use</small></div>
        <div className="kpi card"><span>Balance to collect</span><b>{money(outstanding, settings.currency)}</b><small>from confirmed and past rentals</small></div>
      </div>

      <div className="dash-grid">
        <section className="card pad">
          <div className="between"><h3>Revenue, last 6 months</h3><span className="small muted">by pickup month</span></div>
          <div className="bars" role="img" aria-label="Revenue chart">
            {months.map((m) => (
              <div key={m.label} className="bar-col">
                <span className="bar-val">{m.value ? `${Math.round(m.value / 1000)}k` : ''}</span>
                <div className="bar" style={{ height: `${(m.value / maxM) * 100}%` }} />
                <span className="bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card pad">
          <h3>Fleet status</h3>
          <ul className="fleet-status">
            <li><span className="dotc ok" />Available<b>{byCat.available || 0}</b></li>
            <li><span className="dotc warn" />In maintenance<b>{byCat.maintenance || 0}</b></li>
            <li><span className="dotc off" />Unavailable<b>{byCat.unavailable || 0}</b></li>
            <li><span className="dotc road" />On a rental right now<b>{onRoad.size}</b></li>
          </ul>
          <p className="small muted">{fleetReady} vehicles are bookable on the website.</p>
          <Link to="/admin/calendar" className="btn ghost sm">Open availability calendar</Link>
        </section>
      </div>

      <div className="dash-grid three">
        <section className="card pad">
          <h3>Pickups in the next 48 hours</h3>
          {todayOut.length ? <ul className="mini-list">{todayOut.map((b) => <li key={b.id}><Link to={`/admin/bookings?open=${b.id}`}><b>{vName(b.vehicleId)}</b><span>{cName(b)}, {fmtDate(b.pickupAt, true)}</span></Link><Badge status={b.status} /></li>)}</ul> : <p className="muted small">No pickups due.</p>}
        </section>
        <section className="card pad">
          <h3>Returns in the next 3 days</h3>
          {todayIn.length ? <ul className="mini-list">{todayIn.map((b) => <li key={b.id}><Link to={`/admin/bookings?open=${b.id}`}><b>{vName(b.vehicleId)}</b><span>{cName(b)}, {fmtDate(b.dropoffAt, true)}</span></Link></li>)}</ul> : <p className="muted small">No returns due.</p>}
        </section>
        <section className="card pad">
          <h3>Upcoming maintenance</h3>
          {upMaint.length ? <ul className="mini-list">{upMaint.map((m) => <li key={m.id}><Link to="/admin/maintenance"><b>{vName(m.vehicleId)}</b><span>{m.type}, {fmtShort(m.date)}</span></Link><Badge status={m.status}>{m.status}</Badge></li>)}</ul> : <p className="muted small">Nothing scheduled.</p>}
        </section>
      </div>

      <section className="card">
        <div className="between pad" style={{ paddingBottom: 8 }}><h3>Latest bookings</h3><Link to="/admin/bookings" className="small">All bookings</Link></div>
        {recent.length ? (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Booking</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{recent.map((b) => (
              <tr key={b.id}>
                <td data-label="Booking"><Link to={`/admin/bookings?open=${b.id}`}><b>{b.ref}</b></Link></td>
                <td data-label="Customer">{cName(b)}</td><td data-label="Vehicle">{vName(b.vehicleId)}</td>
                <td data-label="Dates">{fmtShort(b.pickupAt)} – {fmtShort(b.dropoffAt)}</td><td data-label="Total">{money(b.total)}</td>
                <td data-label="Status"><Badge status={b.status} /></td>
              </tr>))}</tbody>
          </table></div>
        ) : <Empty title="No bookings yet" />}
      </section>
    </div>
  );
}
