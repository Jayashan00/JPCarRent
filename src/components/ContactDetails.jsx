import { MapPin, Phone, Clock, Mail, MessageCircle } from 'lucide-react';
import { useDB } from '../lib/db';
import { waLink } from '../lib/utils';
import '../styles/contact.css';

const tel = (n) => `tel:${String(n || '').replace(/\s/g, '')}`;

/** JP Rent A Car's contact details, used on the home page and the Contact page. */
export default function ContactDetails() {
  const { settings: s } = useDB();
  return (
    <ul className="contact-blocks">
      <li>
        <span className="cb-ic"><MapPin size={22} /></span>
        <div>
          <h3>Our base location</h3>
          <p>{s.address}</p>
          {s.deliveryNote && <p className="cb-accent">{s.deliveryNote}</p>}
        </div>
      </li>
      <li>
        <span className="cb-ic"><Phone size={22} /></span>
        <div>
          <h3>Phone & WhatsApp</h3>
          <p>Phone: <a href={tel(s.phone)}><b>{s.phone}</b></a></p>
          <p>WhatsApp: <a href={waLink(s.whatsapp, `Hi ${s.businessName}!`)} target="_blank" rel="noreferrer"><b>{s.phone}</b></a>{s.whatsappNote ? ` — ${s.whatsappNote}` : ''}</p>
          {s.email && <p><Mail size={14} className="cb-inline" />Email: <a href={`mailto:${s.email}`}>{s.email}</a></p>}
        </div>
      </li>
      <li>
        <span className="cb-ic"><Clock size={22} /></span>
        <div>
          <h3>Operating hours</h3>
          <p>{s.hours}</p>
          {s.whatsappHours && <p>{s.whatsappHours}</p>}
        </div>
      </li>
    </ul>
  );
}

export function AskCard() {
  const { settings: s } = useDB();
  return (
    <div className="ask-card">
      <h3>Have questions about driving in Sri Lanka?</h3>
      <p>Send us a message and our local team will guide you on routes, permits, and vehicle recommendations.</p>
      <a className="btn wa-grad" href={waLink(s.whatsapp, `Hi ${s.businessName}, I have a question about driving in Sri Lanka: `)} target="_blank" rel="noreferrer"><MessageCircle size={18} />Chat with us now</a>
    </div>
  );
}