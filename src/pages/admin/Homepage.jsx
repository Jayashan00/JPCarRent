import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db, useDB } from '../../lib/db';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { Field, ImageUploader, TagsInput, useToast } from '../../components/ui';

export default function Homepage() {
  const { content } = useDB();
  const toast = useToast();
  const [hero, setHero] = useState(content.hero);
  const [trust, setTrust] = useState(content.trustPoints);
  const [cta, setCta] = useState(content.ctaBanner);
  const [slides, setSlides] = useState(content.heroSlides || []);
  const moveSlide = (i, d) => { const n = [...slides]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setSlides(n); };
  const save = () => {
    if (!hero.title.trim()) return toast('The headline can’t be empty.', 'error');
    db.setContent('hero', hero);
    db.setContent('trustPoints', trust);
    db.setContent('ctaBanner', cta);
    db.setContent('heroSlides', slides.filter((x) => x.image));
    toast('Home page saved');
  };
  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Home page</h1><p className="muted">Headline, background photo and banners. Other sections have their own pages in the menu.</p></div>
        <div className="row-gap"><Link to="/" target="_blank" className="btn ghost sm">Preview</Link><button className="btn primary sm" onClick={save}>Save changes</button></div>
      </div>
      <div className="settings-grid">
        <section className="card pad">
          <h3>Top banner</h3>
          <div className="stack">
            <Field label="Headline"><input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></Field>
            <Field label="Text under the headline"><textarea rows={3} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></Field>
            <div className="field"><span className="field-label">Fallback photo</span><ImageUploader value={hero.image} onChange={(x) => setHero({ ...hero, image: x })} /><span className="field-hint">Shown only if the slideshow below is empty.</span></div>
          </div>
        </section>
        <section className="card pad">
          <h3>Hero preview</h3>
          <div className="hero-preview" style={{ '--img': `url("${slides[0]?.image || hero.image}")` }}><b>{hero.title}</b><span>{hero.subtitle}</span></div>
          <h3 style={{ marginTop: 22 }}>Trust points under the search bar</h3>
          <TagsInput value={trust} onChange={setTrust} placeholder="Add a point and press Enter" />
          <h3 style={{ marginTop: 22 }}>Call-to-action band</h3>
          <div className="stack">
            <Field label="Title"><input value={cta.title} onChange={(e) => setCta({ ...cta, title: e.target.value })} /></Field>
            <Field label="Text"><textarea rows={2} value={cta.text} onChange={(e) => setCta({ ...cta, text: e.target.value })} /></Field>
          </div>
        </section>
      </div>
      <section className="card pad">
        <div className="between"><div><h3>Slideshow photos</h3><p className="muted small">These fade from one to the next behind the headline. Use wide landscape photos (at least 1600 px across).</p></div>
          <button className="btn ghost sm" onClick={() => setSlides([...slides, { id: `hs-${Date.now()}`, image: '', caption: '' }])}><Plus size={15} />Add photo</button></div>
        <div className="slides-edit">
          {slides.map((sl, i) => (
            <div key={sl.id} className="slide-edit">
              <ImageUploader value={sl.image} onChange={(x) => setSlides(slides.map((y) => (y.id === sl.id ? { ...y, image: x } : y)))} label="Upload photo" />
              <Field label="Caption (place name)"><input value={sl.caption} onChange={(e) => setSlides(slides.map((y) => (y.id === sl.id ? { ...y, caption: e.target.value } : y)))} placeholder="e.g. Nine Arches Bridge, Ella" /></Field>
              <div className="row-gap">
                <button className="icon-btn" onClick={() => moveSlide(i, -1)} disabled={i === 0} aria-label="Move earlier"><ArrowUp size={16} /></button>
                <button className="icon-btn" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} aria-label="Move later"><ArrowDown size={16} /></button>
                <button className="icon-btn del" onClick={() => setSlides(slides.filter((y) => y.id !== sl.id))} aria-label="Remove photo"><Trash2 size={16} /></button>
                <span className="small muted">Photo {i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="quick-links">
        {[['/admin/why-us', 'Why choose us'], ['/admin/steps', 'How it works'], ['/admin/tours', 'Routes'], ['/admin/reviews', 'Reviews'], ['/admin/destinations', 'Destinations'], ['/admin/faqs', 'FAQ']].map(([to, l]) => <Link key={to} to={to} className="btn ghost sm">Edit {l}</Link>)}
      </div>
    </div>
  );
}
