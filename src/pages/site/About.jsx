import { Link } from 'react-router-dom';
import { useDB } from '../../lib/db';
import { PageHero, Prose, SafeImg } from '../../components/site';
import { Avatar, Stars, DynIcon } from '../../components/ui';
import { place } from '../../data/seed';
export default function About() {
  const { pages, drivers, whyUs, destinations, vehicles, settings } = useDB();
  const about = pages.find((p) => p.id === 'about');
  return (
    <>
      <PageHero title={about?.title || 'About us'} text={settings.tagline} />
      <div className="wrap section-sm about-grid">
        <Prose text={about?.body} />
        <div className="about-aside">
          <SafeImg src={place('kandy', 1280)} alt="Kandy Lake and the Temple of the Tooth" className="about-img" />
          <dl className="facts">
            <div><dt>Vehicles</dt><dd>{vehicles.length}</dd></div>
            <div><dt>Drivers</dt><dd>{drivers.length}</dd></div>
            <div><dt>Google rating</dt><dd>{settings.googleRating}</dd></div>
          </dl>
        </div>
      </div>
      <section className="section-sm wrap">
        <h2>Our drivers</h2>
        <p className="muted" style={{ marginBottom: 20 }}>Experienced, licensed and local. Book any car with a driver at checkout.</p>
        <div className="team">
          {drivers.map((d) => (
            <article key={d.id} className="member card">
              {d.photo ? <img src={d.photo} alt={d.name} className="member-photo" /> : <Avatar user={d} size={72} />}
              <h3>{d.name}</h3>
              <Stars value={d.rating} size={14} />
              <p className="small muted">{d.experience} years driving. Speaks {d.languages}.</p>
              <p className="small">{d.bio}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section-sm wrap">
        <div className="why-mini">
          {whyUs.map((w) => <div key={w.id}><DynIcon name={w.icon} /><h3>{w.title}</h3><p className="muted small">{w.text}</p></div>)}
        </div>
        <div className="center-row" style={{ marginTop: 32 }}><Link to="/fleet" className="btn primary lg">See the fleet</Link></div>
      </section>
    </>
  );
}
