import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDB } from '../lib/db';
import { busyPeriods, toLocalInput, cx } from '../lib/utils';

const DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function Month({ year, month, busy, from, to, onDay }) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const today = startOfDay(new Date());
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
  return (
    <div className="cal-month">
      <h4>{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
      <div className="cal-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const t = +d;
          const isBusy = busy.some(([s, e]) => t + DAY > s && t < e);
          const past = d < today;
          const inRange = from && to && t >= +startOfDay(from) && t <= +startOfDay(to);
          const edge = (from && t === +startOfDay(from)) || (to && t === +startOfDay(to));
          return (
            <button key={i} type="button" disabled={past || isBusy} onClick={() => onDay(d)}
              className={cx('cal-day', isBusy && 'busy', past && 'past', inRange && 'range', edge && 'edge', t === +today && 'today')}
              aria-label={`${d.toDateString()}${isBusy ? ', booked' : ''}`}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

export default function AvailabilityCalendar({ vehicleId, from, to, onPick }) {
  const { bookings, maintenance } = useDB();
  const [base, setBase] = useState(() => { const d = new Date(from || Date.now()); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [anchor, setAnchor] = useState(null);
  const busy = useMemo(() => busyPeriods(vehicleId, bookings, maintenance).map((p) => [+new Date(p.start), +new Date(p.end)]), [vehicleId, bookings, maintenance]);
  const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const pick = (d) => {
    const at = new Date(d); at.setHours(9, 0, 0, 0);
    if (!anchor) { setAnchor(at); onPick?.(toLocalInput(at), toLocalInput(new Date(+at + DAY))); }
    else {
      const [a, b] = at > anchor ? [anchor, at] : [at, anchor];
      setAnchor(null);
      onPick?.(toLocalInput(a), toLocalInput(+b === +a ? new Date(+a + DAY) : b));
    }
  };
  return (
    <div className="avail-cal">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span className="small muted">{anchor ? 'Now tap your return day' : 'Tap your pickup day, then your return day'}</span>
        <button type="button" className="icon-btn" onClick={() => setBase(next)} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div className="cal-months">
        <Month year={base.getFullYear()} month={base.getMonth()} busy={busy} from={anchor || from} to={anchor ? null : to} onDay={pick} />
        <Month year={next.getFullYear()} month={next.getMonth()} busy={busy} from={anchor || from} to={anchor ? null : to} onDay={pick} />
      </div>
      <div className="cal-legend"><span><i className="lg-free" />Available</span><span><i className="lg-busy" />Booked</span><span><i className="lg-sel" />Your dates</span></div>
    </div>
  );
}
