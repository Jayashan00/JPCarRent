import { useState } from 'react';
import { useDB } from '../../lib/db';
import { PageHero, Accordion, WaButton } from '../../components/site';
import { cx } from '../../lib/utils';
export default function Faq() {
  const { faqs } = useDB();
  const cats = ['All', ...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const list = faqs.filter((f) => (cat === 'All' || f.category === cat) && (!q || (f.question + f.answer).toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageHero title="Questions & answers" text="Licences, deposits, insurance and everything else about renting a car with us." />
      <div className="wrap narrow section-sm">
        <input className="input faq-search" placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <div className="chips">{cats.map((c) => <button key={c} className={cx('chip', cat === c && 'on')} onClick={() => setCat(c)}>{c}</button>)}</div>
        {list.length ? <Accordion items={list} key={cat + q} /> : <p className="muted">No questions match your search.</p>}
        <div className="ask-more card pad">
          <div><h3>Still have a question?</h3><p className="muted">Our team answers on WhatsApp, usually within minutes.</p></div>
          <WaButton text="Hi JP Rent A Car, I have a question: " />
        </div>
      </div>
    </>
  );
}
