import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, User, LayoutDashboard, LogOut, MessageCircle, Facebook, Instagram, MapPin, Clock, Mail } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useDB } from '../lib/db';
import { Logo, Avatar } from './ui';
import { CompareBar } from './site';
import WhatsAppIcon from './WhatsAppIcon';
import { waLink, cx } from '../lib/utils';
import { setMoneyScope, setCurrency, useCurrency } from '../lib/currency';

const NAV = [
  ['/fleet', 'Our fleet'],
  ['/routes', 'Routes & transfers'],
  ['/services', 'Services'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function SiteLayout() {
  setMoneyScope('display');
  const currency = useCurrency();
  const { settings, tours } = useDB();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);

  return (
    <div className="site">
      <a href="#main" className="skip">Skip to content</a>
      <header className="site-head">
        <div className="wrap head-row">
          <Link to="/" aria-label="JP Rent A Car Kandy home"><Logo settings={settings} /></Link>
          <nav className="main-nav" aria-label="Main">
            {NAV.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          </nav>
          <div className="head-actions">
            <label className="cur-switch"><span className="sr-only">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Show prices in">
                <option value="LKR">LKR</option><option value="USD">USD $</option><option value="EUR">EUR €</option>
              </select>
            </label>
            <a className="head-phone" href={`tel:${settings.phone.replace(/\s/g, '')}`}><Phone size={16} />{settings.phone}</a>
            {user ? (
              <div className="user-menu">
                <button className="user-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                  <Avatar user={user} size={32} /><span className="hide-sm">{user.name.split(' ')[0]}</span>
                </button>
                {menu && (
                  <div className="dropdown" onMouseLeave={() => setMenu(false)}>
                    <div className="dropdown-head"><b>{user.name}</b><small>{user.email}</small></div>
                    {isAdmin && <Link to="/admin"><LayoutDashboard size={16} />Admin dashboard</Link>}
                    <Link to="/account"><User size={16} />My account</Link>
                    <Link to="/account/bookings">My bookings</Link>
                    <button onClick={() => { logout(); nav('/'); }}><LogOut size={16} />Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn ghost sm hide-sm">Sign in</Link>
            )}
            <Link to="/fleet" className="btn primary sm hide-xs">Book a car</Link>
            <button className="icon-btn burger" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-nav" role="dialog" aria-label="Menu">
          <div className="mobile-nav-head">
            <Logo settings={settings} light />
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
          </div>
          <nav>
            <NavLink to="/" end>Home</NavLink>
            {NAV.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
            <NavLink to="/faq">FAQ</NavLink>
            {user ? <NavLink to="/account">My account</NavLink> : <NavLink to="/login">Sign in or register</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin dashboard</NavLink>}
          </nav>
          <label className="mobile-cur">Show prices in
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="LKR">LKR</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select>
          </label>
          <div className="mobile-nav-foot">
            <Link to="/fleet" className="btn primary block lg">Book a car</Link>
            <a className="btn wa block" href={waLink(settings.whatsapp, 'Hi JP Rent A Car, I’d like to ask about renting a car.')} target="_blank" rel="noreferrer"><MessageCircle size={18} />Chat on WhatsApp</a>
          </div>
        </div>
      )}

      <main id="main"><Outlet /></main>
      {!loc.pathname.startsWith('/compare') && !loc.pathname.startsWith('/book/') && <CompareBar />}

      <footer className="site-foot">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <Logo settings={settings} light />
            <p>Independent, family-run car rental in Kandy. We deliver cars anywhere in Sri Lanka and help travellers see the island safely and on their own terms.</p>
            <div className="socials">
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>}
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
              <a href={waLink(settings.whatsapp, 'Hi JP Rent A Car!')} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>
            </div>
          </div>
          <div>
            <h4>Rent</h4>
            <Link to="/fleet">All vehicles</Link>
            <Link to="/services">Services</Link>
            <Link to="/faq">Questions & answers</Link>
            <Link to="/manage-booking">Manage a booking</Link>
            <Link to="/compare">Compare cars</Link>
          </div>
          <div>
            <h4>Popular routes</h4>
            {tours.filter((t) => t.active).slice(0, 5).map((t) => <Link key={t.id} to="/routes">{t.title}</Link>)}
          </div>
          <div className="foot-contact">
            <h4>Contact</h4>
            <p><MapPin size={16} />{settings.address}</p>
            <p><Phone size={16} /><a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></p>
            <p><MessageCircle size={16} /><a href={waLink(settings.whatsapp, `Hi ${settings.businessName}!`)} target="_blank" rel="noreferrer">WhatsApp: {settings.phone}</a></p>
            {settings.email && <p><Mail size={16} /><a href={`mailto:${settings.email}`}>{settings.email}</a></p>}
            <p><Clock size={16} /><span>{settings.hours}<br />{settings.whatsappHours}</span></p>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>© {new Date().getFullYear()} {settings.businessName}. All rights reserved.</span>
          <span className="foot-legal"><Link to="/terms">Rental terms</Link><Link to="/cancellation">Cancellation</Link><Link to="/privacy">Privacy</Link><Link to="/credits">Photo credits</Link></span>
        </div>
      </footer>

      <a style={{ background: '#25D366' }} className={cx('wa-fab', loc.pathname.startsWith('/book/') && 'hidden')} href={waLink(settings.whatsapp, 'Hi JP Rent A Car, I’d like to ask about renting a car.')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <WhatsAppIcon size={30} />
      </a>
    </div>
  );
}