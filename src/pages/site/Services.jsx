import { Link } from 'react-router-dom';
import { useDB } from '../../lib/db';
import { PageHero, WaButton } from '../../components/site';
import { DynIcon } from '../../components/ui';
import { money } from '../../lib/utils';
export default function Services() {
  const { services, settings, extras } = useDB();
  return (
    <>
      <PageHero title="Services" text="Self-drive cars, drivers, airport runs and island tours, all handled by the same small team in Kandy." />
      <div className="wrap section-sm">
        <div className="services">
          {services.filter((s) => s.active).map((s) => (
            <article key={s.id} className="service">
              <span className="svc-ic"><DynIcon name={s.icon} size={24} /></span>
              <h2>{s.title}</h2>
              <p className="muted">{s.text}</p>
              {s.priceFrom > 0 && <p className="svc-price">From <b>{money(s.priceFrom, settings.currency)}</b> {s.unit}</p>}
            </article>
          ))}
        </div>
        <div className="extras-band card pad">
          <h2>Extras you can add</h2>
          <ul className="extras-mini">
            {extras.filter((e) => e.active).map((e) => <li key={e.id}><b>{e.name}</b><span>{money(e.price)} {e.per === 'day' ? 'per day' : 'per rental'}</span></li>)}
          </ul>
        </div>
        <div className="row-gap center-row">
          <Link to="/fleet" className="btn primary lg">Choose a car</Link>
          <WaButton className="btn ghost lg" text="Hi JP Rent A Car, I’d like to ask about your services." />
        </div>
      </div>
    </>
  );
}
