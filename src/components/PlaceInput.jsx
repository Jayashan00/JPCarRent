import { useId, useMemo, useRef, useState } from 'react';
import { MapPin, Plane, TrainFront, Building2, Waves, Landmark, Home } from 'lucide-react';
import { useDB } from '../lib/db';
import { SRI_LANKA_PLACES } from '../data/places';
import { money, cx } from '../lib/utils';

const ICONS = { airport: Plane, station: TrainFront, city: Building2, beach: Waves, landmark: Landmark, office: Home, hotel: Building2 };

/**
 * Type any place in Sri Lanka. Suggestions include JP's own delivery points
 * (with their fee) and ~170 towns, airports, stations, beaches and sights.
 */
export default function PlaceInput({ value, onChange, placeholder = 'Town, hotel, airport…', icon, id: idProp, className, invalid, ariaLabel }) {
  const { locations } = useDB();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const autoId = useId();
  const id = idProp || autoId;
  const listId = `${id}-list`;
  const wrap = useRef();

  const options = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    const own = locations.filter((l) => l.active).map((l) => ({ name: l.name, sub: l.fee ? `Delivery ${money(l.fee)}` : 'No delivery fee', type: l.type, own: true }));
    const all = [...own, ...SRI_LANKA_PLACES.filter((p) => !own.some((o) => o.name === p.name)).map((p) => ({ name: p.name, sub: p.area === p.name ? '' : `${p.area} District`, type: p.type }))];
    if (!q) return all.filter((o) => o.own).slice(0, 8);
    return all.filter((o) => o.name.toLowerCase().includes(q) || (o.sub || '').toLowerCase().includes(q))
      .sort((a, b) => (b.name.toLowerCase().startsWith(q) - a.name.toLowerCase().startsWith(q)) || (b.own - a.own) || (a.name.length - b.name.length))
      .slice(0, 8);
  }, [value, locations]);

  const pick = (o) => { onChange(o.name); setOpen(false); };
  const onKey = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open) { if (options[active]) { e.preventDefault(); pick(options[active]); } else setOpen(false); }
    else if (e.key === 'Escape') setOpen(false);
  };
  const LeadIcon = icon || MapPin;
  const showList = open && options.length > 0;

  return (
    <div className={cx('place-input', className, invalid && 'invalid')} ref={wrap}
      onBlur={(e) => { if (!wrap.current.contains(e.relatedTarget)) setOpen(false); }}>
      <LeadIcon size={17} className="pi-icon" aria-hidden="true" />
      <input id={id} value={value || ''} placeholder={placeholder} autoComplete="off" aria-label={ariaLabel}
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)} onKeyDown={onKey} />
      {showList && (
        <ul className="pi-list" id={listId} role="listbox">
          {!String(value || '').trim() && <li className="pi-head" role="presentation">Popular pickup points, or type any place in Sri Lanka</li>}
          {options.map((o, i) => {
            const Ic = ICONS[o.type] || MapPin;
            return (
              <li key={o.name} id={`${id}-opt-${i}`} role="option" aria-selected={i === active} className={cx(i === active && 'on')}
                onMouseDown={(e) => { e.preventDefault(); pick(o); }} onMouseEnter={() => setActive(i)}>
                <Ic size={16} aria-hidden="true" />
                <span className="pi-name">{o.name}{o.sub && <small>{o.sub}</small>}</span>
                {o.own && <em>JP point</em>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
