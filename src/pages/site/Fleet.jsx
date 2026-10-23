import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useDB } from '../../lib/db';
import { PageHero, SearchPanel, VehicleCard } from '../../components/site';
import { Empty } from '../../components/ui';
import { isVehicleFree, money, rentalDays, fmtDate, cx } from '../../lib/utils';

export default function Fleet() {
  const { vehicles, categories, bookings, settings, maintenance } = useDB();
  const [params] = useSearchParams();
  const hasDates = params.get('pickupAt') && params.get('dropoffAt');
  const mode = params.get('mode') || 'self';
  const maxRate = Math.max(...vehicles.map((v) => v.dailyRate), 0);
  const [f, setF] = useState({ q: '', cats: [], trans: 'any', fuel: 'any', seats: 0, price: maxRate, onlyFree: false });
  const [sort, setSort] = useState('price-asc');
  const [showFilters, setShowFilters] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const list = useMemo(() => {
    let l = vehicles.map((v) => ({ v, free: hasDates ? isVehicleFree(v.id, params.get('pickupAt'), params.get('dropoffAt'), bookings, null, maintenance) : undefined }));
    l = l.filter(({ v, free }) =>
      (!f.q || `${v.name} ${v.make} ${v.model}`.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.cats.length || f.cats.includes(v.categoryId)) &&
      (f.trans === 'any' || v.transmission === f.trans) &&
      (f.fuel === 'any' || v.fuel === f.fuel) &&
      v.seats >= f.seats && v.dailyRate <= f.price &&
      (mode === 'driver' ? v.withDriver : true) &&
      (!f.onlyFree || (free !== false && v.status === 'available')));
    const s = {
      'price-asc': (a, b) => a.v.dailyRate - b.v.dailyRate,
      'price-desc': (a, b) => b.v.dailyRate - a.v.dailyRate,
      seats: (a, b) => b.v.seats - a.v.seats,
      newest: (a, b) => b.v.year - a.v.year,
    }[sort];
    return l.sort((a, b) => {
      const avail = (x) => (x.v.status === 'available' && x.free !== false ? 0 : 1);
      return avail(a) - avail(b) || s(a, b);
    });
  }, [vehicles, bookings, f, sort, params, hasDates, mode]);

  const fuels = [...new Set(vehicles.map((v) => v.fuel))];
  const q = hasDates ? `?${params.toString()}` : '';
  const activeCount = f.cats.length + (f.trans !== 'any') + (f.fuel !== 'any') + (f.seats > 0) + (f.price < maxRate) + f.onlyFree;
  const reset = () => setF({ q: '', cats: [], trans: 'any', fuel: 'any', seats: 0, price: maxRate, onlyFree: false });

  return (
    <>
      <PageHero title="Our fleet" text="Compact cars for town, sedans for long drives, SUVs and 4x4s for the hills, and vans for groups. All prices include basic insurance and 150 km a day.">
        <SearchPanel compact initial={hasDates ? Object.fromEntries(params) : {}} key={params.toString()} />
      </PageHero>

      <div className="wrap fleet-layout">
        <aside className={cx('filters', showFilters && 'open')} aria-label="Filters">
          <div className="filters-head">
            <h3>Filter</h3>
            {activeCount > 0 && <button className="btn link" onClick={reset}>Clear all</button>}
            <button className="icon-btn show-mobile" onClick={() => setShowFilters(false)} aria-label="Close filters"><X /></button>
          </div>
          <label className="field"><span className="field-label">Search</span>
            <input value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="e.g. Prius, Vezel" />
          </label>
          <fieldset>
            <legend>Vehicle type</legend>
            {categories.map((c) => (
              <label key={c.id} className="check">
                <input type="checkbox" checked={f.cats.includes(c.id)} onChange={(e) => set('cats', e.target.checked ? [...f.cats, c.id] : f.cats.filter((x) => x !== c.id))} />
                {c.name} <span className="muted small">({vehicles.filter((v) => v.categoryId === c.id).length})</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Gearbox</legend>
            <div className="seg">
              {['any', 'Automatic', 'Manual'].map((t) => <button key={t} className={cx(f.trans === t && 'on')} onClick={() => set('trans', t)}>{t === 'any' ? 'Any' : t}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Fuel</legend>
            <select className="input" value={f.fuel} onChange={(e) => set('fuel', e.target.value)}>
              <option value="any">Any fuel</option>
              {fuels.map((x) => <option key={x}>{x}</option>)}
            </select>
          </fieldset>
          <fieldset>
            <legend>Minimum seats</legend>
            <div className="seg">
              {[0, 4, 5, 7, 10].map((n) => <button key={n} className={cx(f.seats === n && 'on')} onClick={() => set('seats', n)}>{n ? `${n}+` : 'Any'}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend>Max price per day</legend>
            <input type="range" min={0} max={maxRate} step={500} value={f.price} onChange={(e) => set('price', +e.target.value)} className="range" />
            <div className="small muted">Up to {money(f.price, settings.currency)}</div>
          </fieldset>
          {hasDates && (
            <label className="check"><input type="checkbox" checked={f.onlyFree} onChange={(e) => set('onlyFree', e.target.checked)} />Only show cars free on my dates</label>
          )}
          <button className="btn dark block show-mobile" onClick={() => setShowFilters(false)}>Show {list.length} vehicles</button>
        </aside>

        <div>
          <div className="results-bar">
            <div>
              <b>{list.length} vehicle{list.length !== 1 ? 's' : ''}</b>
              {hasDates && <span className="muted"> for {fmtDate(params.get('pickupAt'))} to {fmtDate(params.get('dropoffAt'))} ({rentalDays(params.get('pickupAt'), params.get('dropoffAt'))} days){mode === 'driver' ? ', with driver' : ''}</span>}
            </div>
            <div className="results-tools">
              <button className="btn ghost sm show-mobile" onClick={() => setShowFilters(true)}><SlidersHorizontal size={16} />Filters{activeCount ? ` (${activeCount})` : ''}</button>
              <label className="sort"><span className="sr-only">Sort by</span>
                <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="price-asc">Lowest price first</option>
                  <option value="price-desc">Highest price first</option>
                  <option value="seats">Most seats</option>
                  <option value="newest">Newest model</option>
                </select>
              </label>
            </div>
          </div>
          {list.length ? (
            <div className="fleet-grid two">
              {list.map(({ v, free }) => <VehicleCard key={v.id} vehicle={v} available={free} query={q} />)}
            </div>
          ) : (
            <Empty icon="Car" title="No vehicles match these filters" text="Try removing a filter or changing your dates." action={<button className="btn dark" onClick={reset}>Clear filters</button>} />
          )}
        </div>
      </div>
    </>
  );
}
