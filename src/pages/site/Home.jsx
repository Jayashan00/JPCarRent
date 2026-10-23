import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Phone, MapPin } from 'lucide-react';
import { useDB } from '../../lib/db';
import { HeroSlides, TripPlanner } from '../../components/HeroPlanner';
import { SectionHead, VehicleCard, RouteSign, Accordion, ReviewCard, MapEmbed, WaButton, SafeImg } from '../../components/site';
import { DynIcon, Stars } from '../../components/ui';
import { cx } from '../../lib/utils';
import { place } from '../../data/seed';
import ContactDetails, { AskCard } from '../../components/ContactDetails';

export default function Home() {
  const { content, vehicles, categories, whyUs, steps, tours, reviews, destinations, faqs, settings } = useDB();
  const [cat, setCat] = useState('all');
  const nav = useNavigate();
  const fleet = vehicles.filter((v) => cat === 'all' || v.categoryId === cat);
  const shown = (cat === 'all' ? fleet.filter((v) => v.featured) : fleet).slice(0, 6);
  const approved = reviews.filter((r) => r.status === 'approved');
  const { hero } = content;

  return (
    <>
      <HeroSlides slides={content.heroSlides?.length ? content.heroSlides : [{ id: 'h', image: hero.image, caption: 'Sri Lanka' }]}>
        <div className="wrap hero-inner">
          <p className="hero-place"><MapPin size={16} />Based in Kandy, delivering anywhere in Sri Lanka</p>
          <h1>{hero.title}</h1>
          <p className="hero-sub">{hero.subtitle}</p>
          <div className="hero-cta">
            <a href="#plan" className="btn primary lg">Plan my trip</a>
            <Link to="/fleet" className="btn light lg">Browse the fleet</Link>
          </div>
        </div>
      </HeroSlides>

      <div className="wrap search-dock">
        <TripPlanner />
        <ul className="trust-row">
          {content.trustPoints.map((t) => <li key={t}><Check size={16} />{t}</li>)}
        </ul>
      </div>

      <section className="section">
        <div className="wrap">
          <SectionHead title="Our fleet" text="Every car is serviced, air-conditioned and ready for both expressways and steep hill-country bends."
            action={<Link className="btn ghost" to="/fleet">See all {vehicles.length} vehicles</Link>} />
          <div className="chips" role="tablist" aria-label="Vehicle type">
            <button className={cx('chip', cat === 'all' && 'on')} onClick={() => setCat('all')}>Popular</button>
            {categories.map((c) => <button key={c.id} className={cx('chip', cat === c.id && 'on')} onClick={() => setCat(c.id)}>{c.name}</button>)}
          </div>
          <div className="fleet-grid">
            {shown.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      </section>

      <section className="section why">
        <div className="wrap why-grid">
          <div className="why-media">
            <SafeImg src={place('temple', 1280)} alt="The Temple of the Tooth in Kandy" />
            <div className="why-stat">
              <Stars value={settings.googleRating} size={18} />
              <b>{settings.googleRating} on Google</b>
              <span>from {settings.googleReviewCount}+ travellers</span>
            </div>
          </div>
          <div>
            <h2>A local team that picks up the phone</h2>
            <p className="lead">We’re a small, family-run team from Kandy. We care about your safety, your time and making your trip easy.</p>
            <ul className="why-list">
              {whyUs.map((w) => (
                <li key={w.id}>
                  <span className="why-ic"><DynIcon name={w.icon} size={22} /></span>
                  <div><h3>{w.title}</h3><p>{w.text}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section steps-sec">
        <div className="wrap">
          <SectionHead title="How booking works" text="Renting a car in Sri Lanka should be as relaxed as the holiday. Three steps, no complicated paperwork." center />
          <ol className="road-steps">
            {steps.map((s, i) => (
              <li key={s.id}><span className="step-n">{i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section routes-sec">
        <div className="wrap">
          <SectionHead title="Where are you heading?" text="Popular drives from Kandy. Book any of them as a transfer with one of our drivers, or take a self-drive car and go at your own pace."
            action={<Link className="btn light" to="/routes">All routes and prices</Link>} />
          <div className="signs-grid">
            {tours.filter((t) => t.active).map((t) => <RouteSign key={t.id} tour={t} onClick={() => nav(`/routes#${t.id}`)} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead title="What travellers say"
            text={`Rated ${settings.googleRating} out of 5 on Google. Here are a few of the reviews.`} />
          <div className="reviews-row">
            {approved.slice(0, 8).map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </div>
      </section>

      <section className="section dest-sec">
        <div className="wrap">
          <SectionHead title="Your gateway to the island" text="From Kandy’s lake and misty tea terraces to rock citadels and sun-soaked coastal roads." />
          <div className="mosaic">
            {destinations.map((d) => (
              <figure key={d.id} className="mosaic-item">
                <SafeImg src={d.image} alt={d.title} />
                <figcaption><b>{d.title}</b><span>{d.text}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section faq-home">
        <div className="wrap faq-grid">
          <div>
            <h2>Before you book</h2>
            <p className="lead">The questions we hear most. Anything else, just ask us on WhatsApp.</p>
            <Link to="/faq" className="btn ghost">Read all questions</Link>
          </div>
          <Accordion items={faqs.slice(0, 5)} />
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap cta-inner">
          <div>
            <h2>{content.ctaBanner.title}</h2>
            <p>{content.ctaBanner.text}</p>
          </div>
          <div className="cta-actions">
            <WaButton text="Hi JP Rent A Car, can you suggest a car for my trip? Group size: , Dates: , Route: " className="btn wa lg">Message us on WhatsApp</WaButton>
            <a className="btn light lg" href={`tel:${settings.phone.replace(/\s/g, '')}`}><Phone size={18} />Call {settings.phone}</a>
          </div>
        </div>
      </section>

      <section className="section contact-sec" id="contact">
        <div className="wrap">
          <SectionHead title="Contact & location" center
            text="Based conveniently in Kandy, Sri Lanka. Drop by to pick up your vehicle or message us to arrange delivery directly to your hotel or arrival stop." />
          <div className="contact-layout">
            <div className="stack">
              <ContactDetails />
              <AskCard />
            </div>
            <div className="map-card"><MapEmbed query={settings.mapQuery} /></div>
          </div>
        </div>
      </section>
    </>
  );
}