import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDB } from '../../lib/db';
import { BookingDrawer, BookingForm, customerOf } from './Bookings';
import { DAY, toLocalInput, cx } from '../../lib/utils';

export default function Calendar() {
  const { vehicles, bookings, users, maintenance } = useDB();
  const [start, setStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return new Date(+d - 3 * DAY); });
  const [len, setLen] = useState(21);
  const [open, setOpen] = useState(null);
  const [preset, setPreset] = useState(null);
  const end = new Date(+start + len * DAY);
  const days = Array.from({ length: len }, (_, i) => new Date(+start + i * DAY));
  const today = new Date().toDateString();
  const shift = (n) => setStart(new Date(+start + n * DAY));

  const col = (date) => Math.max(0, Math.min(len, (new Date(date) - start) / DAY));

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Availability calendar</h1><p className="muted">See every car’s bookings at a glance. Click an empty day to create a booking, or a bar to open it.</p></div>
        <div className="row-gap">
          <button className="icon-btn" onClick={() => shift(-7)} aria-label="Previous week"><ChevronLeft /></button>
          <button className="btn ghost sm" onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setStart(new Date(+d - 3 * DAY)); }}>Today</button>
          <button className="icon-btn" onClick={() => shift(7)} aria-label="Next week"><ChevronRight /></button>
          <select className="input slim" value={len} onChange={(e) => setLen(+e.target.value)} aria-label="Range"><option value={14}>2 weeks</option><option value={21}>3 weeks</option><option value={31}>1 month</option></select>
        </div>
      </div>
      <div className="legend">
        {['pending', 'confirmed', 'active', 'completed'].map((s) => <span key={s}><i className={`lg-swatch s-${s}`} />{{ pending: 'Awaiting confirmation', confirmed: 'Confirmed', active: 'On trip', completed: 'Completed' }[s]}</span>)}
        <span><i className="lg-swatch maint" />Maintenance</span>
      </div>
      <div className="gantt card" style={{ '--days': len }}>
        <div className="g-row g-head">
          <div className="g-label">{start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
          <div className="g-days">{days.map((d) => <span key={+d} className={cx(d.toDateString() === today && 'today', [0, 6].includes(d.getDay()) && 'we')}><small>{d.toLocaleDateString('en-GB', { weekday: 'narrow' })}</small>{d.getDate()}</span>)}</div>
        </div>
        {vehicles.map((v) => {
          const vb = bookings.filter((b) => b.vehicleId === v.id && b.status !== 'cancelled' && new Date(b.dropoffAt) > start && new Date(b.pickupAt) < end);
          const vm = maintenance.filter((m) => m.vehicleId === v.id && m.status !== 'done' && new Date(m.date) >= start && new Date(m.date) < end);
          return (
            <div key={v.id} className="g-row">
              <div className="g-label"><b>{v.name}</b><span>{v.plate}{v.status !== 'available' ? ` · ${v.status}` : ''}</span></div>
              <div className="g-days g-track">
                {days.map((d) => (
                  <button key={+d} className={cx('g-cell', d.toDateString() === today && 'today', [0, 6].includes(d.getDay()) && 'we')} aria-label={`New booking for ${v.name} on ${d.toDateString()}`}
                    onClick={() => { const a = new Date(d); a.setHours(9); setPreset({ vehicleId: v.id, pickupAt: toLocalInput(a), dropoffAt: toLocalInput(new Date(+a + 3 * DAY)) }); }} />
                ))}
                {vb.map((b) => {
                  const s = col(b.pickupAt), e = col(b.dropoffAt);
                  return (
                    <button key={b.id} className={cx('g-bar', `s-${b.status}`)} style={{ left: `calc(${s} * var(--cell))`, width: `calc(${Math.max(0.5, e - s)} * var(--cell) - 3px)` }} onClick={() => setOpen(b.id)} title={`${b.ref} – ${customerOf(b, users).name}`}>
                      {customerOf(b, users).name}
                    </button>
                  );
                })}
                {vm.map((m) => <span key={m.id} className="g-bar maint" style={{ left: `calc(${col(m.date)} * var(--cell))`, width: 'calc(var(--cell) - 3px)' }} title={m.type}>🔧</span>)}
              </div>
            </div>
          );
        })}
      </div>
      {open && <BookingDrawer id={open} onClose={() => setOpen(null)} />}
      {preset && <BookingForm preset={preset} onClose={() => setPreset(null)} onSaved={(id) => { setPreset(null); setOpen(id); }} />}
    </div>
  );
}
