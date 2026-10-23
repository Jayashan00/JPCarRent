import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useDB } from '../../lib/db';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Tabs } from '../../components/ui';
import { customerOf } from './Bookings';
import { money, downloadCSV, DAY, PAY_METHOD } from '../../lib/utils';

const RANGES = [
  { value: '30', label: 'Last 30 days' }, { value: 'month', label: 'This month' }, { value: '90', label: 'Last 3 months' },
  { value: 'year', label: 'This year' }, { value: '365', label: 'Last 12 months' }, { value: 'custom', label: 'Custom' },
];

function rangeOf(key, custom) {
  const now = new Date();
  if (key === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)];
  if (key === 'year') return [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear() + 1, 0, 1)];
  if (key === 'custom') return [custom.from ? new Date(custom.from) : new Date(+now - 30 * DAY), custom.to ? new Date(custom.to + 'T23:59') : now];
  return [new Date(+now - +key * DAY), new Date(+now + 60 * DAY)];
}

export default function Reports() {
  const { bookings, vehicles, users, categories, maintenance } = useDB();
  const [range, setRange] = useState('365');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [start, end] = rangeOf(range, custom);
  const periodDays = Math.max(1, Math.round((Math.min(+end, Date.now() + 60 * DAY) - +start) / DAY));

  const data = useMemo(() => {
    const live = bookings.filter((b) => b.status !== 'cancelled' && new Date(b.pickupAt) >= start && new Date(b.pickupAt) < end);
    const cancelled = bookings.filter((b) => b.status === 'cancelled' && new Date(b.pickupAt) >= start && new Date(b.pickupAt) < end);
    const revenue = live.reduce((s, b) => s + (b.total || 0), 0);
    const daysRented = live.reduce((s, b) => s + (b.days || 0), 0);
    const perVehicle = vehicles.map((v) => {
      const vb = live.filter((b) => b.vehicleId === v.id);
      const days = vb.reduce((s, b) => s + (b.days || 0), 0);
      const rev = vb.reduce((s, b) => s + (b.total || 0), 0);
      const cost = maintenance.filter((m) => m.vehicleId === v.id && new Date(m.date) >= start && new Date(m.date) < end).reduce((s, m) => s + (+m.cost || 0), 0);
      return { v, n: vb.length, days, rev, cost, util: Math.min(100, Math.round((days / periodDays) * 100)) };
    }).sort((a, b) => b.rev - a.rev);
    const custs = {};
    live.forEach((b) => { const c = customerOf(b, users); const k = c.email || c.name; custs[k] = custs[k] || { name: c.name, country: c.country, n: 0, rev: 0 }; custs[k].n++; custs[k].rev += b.total || 0; });
    const countries = {};
    live.forEach((b) => { const c = customerOf(b, users).country || 'Unknown'; countries[c] = (countries[c] || 0) + 1; });
    const byCat = categories.map((c) => ({ name: c.name, rev: live.filter((b) => vehicles.find((v) => v.id === b.vehicleId)?.categoryId === c.id).reduce((s, b) => s + (b.total || 0), 0) }));
    const months = Array.from({ length: 12 }, (_, i) => {
      const s = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + i, 1);
      const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      const mb = bookings.filter((b) => b.status !== 'cancelled' && new Date(b.pickupAt) >= s && new Date(b.pickupAt) < e);
      return { label: s.toLocaleString('en-GB', { month: 'short' }), rev: mb.reduce((x, b) => x + (b.total || 0), 0), n: mb.length };
    });
    return {
      live, cancelled, revenue, daysRented, perVehicle, months, byCat,
      customers: Object.values(custs).sort((a, b) => b.rev - a.rev).slice(0, 8),
      countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 8),
      driver: live.filter((b) => b.mode === 'driver').length,
      methods: Object.keys(PAY_METHOD).map((m) => [PAY_METHOD[m], live.filter((b) => b.paymentMethod === m).length]),
      util: vehicles.length ? Math.round((daysRented / (periodDays * vehicles.length)) * 100) : 0,
    };
  }, [bookings, vehicles, users, categories, maintenance, start, end, periodDays]);

  const maxM = Math.max(...data.months.map((m) => m.rev), 1);
  const maxCat = Math.max(...data.byCat.map((c) => c.rev), 1);

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Reports</h1><p className="muted">Revenue, fleet use and customers. Figures count bookings by pickup date and leave out cancellations.</p></div>
        <button className="btn ghost sm" onClick={() => downloadCSV('fleet-report.csv', data.perVehicle.map((r) => ({ vehicle: r.v.name, plate: r.v.plate, bookings: r.n, days_rented: r.days, utilisation_pct: r.util, revenue: r.rev, maintenance_cost: r.cost, net: r.rev - r.cost })))}><Download size={16} />Export fleet report</button>
      </div>
      <Tabs value={range} onChange={setRange} tabs={RANGES} />
      {range === 'custom' && (
        <div className="toolbar">
          <label className="date-filter">From <input type="date" className="input slim" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
          <label className="date-filter">To <input type="date" className="input slim" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
        </div>
      )}
      <div className="kpis">
        <div className="kpi card"><span>Revenue</span><b>{money(data.revenue)}</b><small>{data.live.length} bookings</small></div>
        <div className="kpi card"><span>Average booking</span><b>{money(data.live.length ? data.revenue / data.live.length : 0)}</b><small>{data.live.length ? (data.daysRented / data.live.length).toFixed(1) : 0} days on average</small></div>
        <div className="kpi card"><span>Fleet utilisation</span><b>{data.util}%</b><small>{data.daysRented} car-days rented</small></div>
        <div className="kpi card"><span>Cancellation rate</span><b>{data.live.length + data.cancelled.length ? Math.round((data.cancelled.length / (data.live.length + data.cancelled.length)) * 100) : 0}%</b><small>{data.cancelled.length} cancelled · {data.driver} with driver</small></div>
      </div>

      <section className="card pad">
        <div className="between"><h3>Revenue by month (last 12 months)</h3><span className="small muted">by pickup month</span></div>
        <div className="bars twelve" role="img" aria-label="Revenue by month">
          {data.months.map((m, i) => (
            <div key={i} className="bar-col"><span className="bar-val">{m.rev ? `${Math.round(m.rev / 1000)}k` : ''}</span><div className="bar" style={{ height: `${(m.rev / maxM) * 100}%` }} title={`${m.n} bookings`} /><span className="bar-label">{m.label}</span></div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="pad" style={{ paddingBottom: 6 }}><h3>Each vehicle</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Vehicle</th><th>Bookings</th><th>Days rented</th><th>Utilisation</th><th>Revenue</th><th>Maintenance</th><th>Net</th></tr></thead>
            <tbody>{data.perVehicle.map((r) => (
              <tr key={r.v.id}>
                <td data-label="Vehicle"><div className="cell-user"><div className="cell-car"><VehiclePhoto vehicle={r.v} /></div><div><b>{r.v.name}</b><span>{r.v.plate}</span></div></div></td>
                <td data-label="Bookings">{r.n}</td><td data-label="Days rented">{r.days}</td>
                <td data-label="Utilisation"><div className="util"><i style={{ width: `${r.util}%` }} /><span>{r.util}%</span></div></td>
                <td data-label="Revenue">{money(r.rev)}</td><td data-label="Maintenance">{money(r.cost)}</td><td data-label="Net"><b>{money(r.rev - r.cost)}</b></td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>

      <div className="dash-grid three">
        <section className="card pad">
          <h3>Revenue by vehicle type</h3>
          <ul className="hbars">{data.byCat.map((c) => <li key={c.name}><span>{c.name}</span><i style={{ width: `${(c.rev / maxCat) * 100}%` }} /><b>{money(c.rev)}</b></li>)}</ul>
        </section>
        <section className="card pad">
          <h3>Top customers</h3>
          <ul className="mini-list">{data.customers.map((c, i) => <li key={i}><div><b>{c.name}</b><span>{c.country || '—'} · {c.n} booking{c.n > 1 ? 's' : ''}</span></div><b>{money(c.rev)}</b></li>)}</ul>
        </section>
        <section className="card pad">
          <h3>Where customers come from</h3>
          <ul className="mini-list">{data.countries.map(([c, n]) => <li key={c}><span>{c}</span><b>{n}</b></li>)}</ul>
          <h3 style={{ marginTop: 18 }}>Payment method chosen</h3>
          <ul className="mini-list">{data.methods.map(([m, n]) => <li key={m}><span>{m}</span><b>{n}</b></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
