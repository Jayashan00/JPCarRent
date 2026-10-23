import { Link } from 'react-router-dom';
import { X, Check, Minus } from 'lucide-react';
import { useDB } from '../../lib/db';
import { useCompare } from '../../lib/compare';
import { PageHero } from '../../components/site';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Empty, Stars } from '../../components/ui';
import { money } from '../../lib/utils';

export default function Compare() {
  const { vehicles, categories, reviews } = useDB();
  const compare = useCompare();
  const list = compare.ids.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean);
  const allFeatures = [...new Set(list.flatMap((v) => v.features))];
  const rating = (v) => { const r = reviews.filter((x) => x.vehicleId === v.id && x.status === 'approved'); return r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0; };
  const cheapest = Math.min(...list.map((v) => v.dailyRate));
  const rows = [
    ['Type', (v) => categories.find((c) => c.id === v.categoryId)?.name],
    ['Year', (v) => v.year],
    ['Seats', (v) => v.seats],
    ['Large bags', (v) => v.bags],
    ['Gearbox', (v) => v.transmission],
    ['Fuel', (v) => v.fuel],
    ['Price per day', (v) => <b className={v.dailyRate === cheapest ? 'ok-text' : ''}>{money(v.dailyRate)}</b>],
    ['Per day, 7+ days', (v) => (v.weeklyRate ? money(v.weeklyRate / 7) : '—')],
    ['Per day, 30+ days', (v) => (v.monthlyRate ? money(v.monthlyRate / 30) : '—')],
    ['Driver per day', (v) => (v.withDriver ? `+ ${money(v.driverRate)}` : 'Not offered')],
    ['Self-drive', (v) => (v.selfDrive ? <Check size={18} className="ok-text" /> : <Minus size={18} />)],
    ['Deposit', (v) => money(v.deposit)],
    ['Free km per day', (v) => v.kmPerDay],
    ['Rating', (v) => (rating(v) ? <Stars value={rating(v)} size={13} /> : '—')],
  ];
  return (
    <>
      <PageHero title="Compare cars" text="Side by side, so you can pick the right car for your trip." />
      <div className="wrap section-sm">
        {list.length ? (
          <div className="table-wrap card">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th />
                  {list.map((v) => (
                    <th key={v.id}>
                      <div className="cmp-head">
                        <button className="icon-btn" onClick={() => compare.toggle(v.id)} aria-label={`Remove ${v.name}`}><X size={16} /></button>
                        <div className="cmp-photo"><VehiclePhoto vehicle={v} /></div>
                        <b>{v.name}</b>
                        <Link to={`/fleet/${v.id}`} className="btn primary sm">View & book</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => <tr key={label}><th>{label}</th>{list.map((v) => <td key={v.id}>{fn(v)}</td>)}</tr>)}
                {allFeatures.map((ft) => <tr key={ft}><th>{ft}</th>{list.map((v) => <td key={v.id}>{v.features.includes(ft) ? <Check size={18} className="ok-text" /> : <Minus size={18} className="muted" />}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card"><Empty icon="Car" title="No cars selected" text="Tick “Compare” on up to three cars in the fleet." action={<Link to="/fleet" className="btn primary">Browse the fleet</Link>} /></div>
        )}
        {list.length > 0 && list.length < 3 && <p className="center" style={{ marginTop: 20 }}><Link to="/fleet" className="btn ghost">Add another car</Link></p>}
      </div>
    </>
  );
}
