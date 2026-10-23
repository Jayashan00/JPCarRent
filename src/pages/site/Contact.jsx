import { useState } from 'react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { PageHero, MapEmbed } from '../../components/site';
import ContactDetails, { AskCard } from '../../components/ContactDetails';
import { Field, useToast } from '../../components/ui';

export default function Contact() {
  const { settings } = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const blank = { name: user?.name || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const send = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email) && f.phone.replace(/\D/g, '').length < 7) x.email = 'Enter an email or a phone / WhatsApp number so we can reply.';
    if (f.message.trim().length < 10) x.message = 'Tell us a little more (at least 10 characters).';
    setErr(x);
    if (Object.keys(x).length) return;
    db.create('messages', { ...f, subject: f.subject || 'General question', status: 'new', replies: [], userId: user?.id || null }, 'msg');
    db.notify('admin', 'New message', `${f.name}: ${f.subject || 'General question'}`, '/admin/messages');
    toast('Message sent. We’ll reply shortly by WhatsApp or email.');
    setF(blank);
  };
  return (
    <>
      <PageHero title="Contact & location" text="Based conveniently in Kandy, Sri Lanka. Drop by to pick up your vehicle or message us to arrange delivery directly to your hotel or arrival stop." />
      <div className="wrap section-sm">
        <div className="contact-layout">
          <div className="stack">
            <ContactDetails />
            <AskCard />
          </div>
          <div className="map-card"><MapEmbed query={settings.mapQuery} /></div>
        </div>

        <form className="card pad contact-form" onSubmit={send} noValidate>
          <h2 className="step-title">Prefer to send a message?</h2>
          <p className="muted" style={{ marginBottom: 16 }}>We reply on WhatsApp or by email, usually within a few hours.</p>
          <div className="form-grid">
            <Field label="Name" error={err.name}><input value={f.name} onChange={set('name')} autoComplete="name" /></Field>
            <Field label="Phone or WhatsApp"><input value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+94 77 123 4567" /></Field>
            <Field label="Email (optional)" error={err.email}><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
            <Field label="Subject"><input value={f.subject} onChange={set('subject')} placeholder="e.g. Van for 8 people in March" /></Field>
            <Field label="Message" error={err.message} className="full"><textarea value={f.message} onChange={set('message')} rows={5} /></Field>
          </div>
          <button className="btn primary lg" style={{ marginTop: 18 }}>Send message</button>
        </form>
      </div>
    </>
  );
}