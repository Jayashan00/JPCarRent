import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarRange, CalendarCheck, Car, Tags, PackagePlus, MapPin, Percent, Wrench, Users, IdCard, Star, Mail,
  Home, Briefcase, Signpost, ShieldCheck, ListOrdered, Images, HelpCircle, FileText, Settings, Bell, Menu, X, ExternalLink, LogOut, Wallet, BarChart3, SunSnow,
} from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Logo, Avatar } from '../../components/ui';
import { timeAgo, cx } from '../../lib/utils';
import { setMoneyScope } from '../../lib/currency';

export default function AdminLayout() {
  setMoneyScope('base');
  const { bookings, messages, reviews, notifications, settings } = useDB();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setOpen(false); setBell(false); }, [loc.pathname]);

  const pending = bookings.filter((b) => b.status === 'pending').length;
  const newMsgs = messages.filter((m) => m.status === 'new').length;
  const pendingRev = reviews.filter((r) => r.status === 'pending').length;
  const notes = notifications.filter((n) => n.userId === 'admin');
  const unread = notes.filter((n) => !n.read).length;

  const groups = [
    ['', [['/admin', LayoutDashboard, 'Dashboard', 0, true], ['/admin/bookings', CalendarCheck, 'Bookings', pending], ['/admin/calendar', CalendarRange, 'Availability calendar'], ['/admin/payments', Wallet, 'Payments'], ['/admin/reports', BarChart3, 'Reports']]],
    ['Fleet', [['/admin/vehicles', Car, 'Vehicles'], ['/admin/categories', Tags, 'Categories'], ['/admin/maintenance', Wrench, 'Maintenance']]],
    ['Pricing', [['/admin/extras', PackagePlus, 'Extras'], ['/admin/locations', MapPin, 'Locations & fees'], ['/admin/seasons', SunSnow, 'Seasonal prices'], ['/admin/promos', Percent, 'Promo codes']]],
    ['People', [['/admin/customers', Users, 'Customers & staff'], ['/admin/drivers', IdCard, 'Drivers'], ['/admin/messages', Mail, 'Messages', newMsgs], ['/admin/reviews', Star, 'Reviews', pendingRev]]],
    ['Website', [['/admin/homepage', Home, 'Home page'], ['/admin/tours', Signpost, 'Routes & transfers'], ['/admin/services', Briefcase, 'Services'], ['/admin/why-us', ShieldCheck, 'Why choose us'], ['/admin/steps', ListOrdered, 'How it works'], ['/admin/destinations', Images, 'Destinations'], ['/admin/faqs', HelpCircle, 'FAQ'], ['/admin/pages', FileText, 'Pages']]],
    ['', [['/admin/settings', Settings, 'Settings']]],
  ];

  return (
    <div className="admin">
      <aside className={cx('admin-side', open && 'open')}>
        <div className="admin-brand">
          <Link to="/admin"><Logo settings={settings} light /></Link>
          <button className="icon-btn show-mobile" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="admin-nav">
          {groups.map(([label, items], gi) => (
            <div key={gi} className="nav-group">
              {label && <span className="nav-label">{label}</span>}
              {items.map(([to, Ic, text, count, end]) => (
                <NavLink key={to} to={to} end={end}><Ic size={18} /><span>{text}</span>{count ? <em>{count}</em> : null}</NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="admin-scrim" onClick={() => setOpen(false)} />}

      <div className="admin-body">
        <header className="admin-top">
          <button className="icon-btn show-mobile" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
          <span className="admin-top-title">{settings.businessName}</span>
          <div className="row-gap push">
            <Link to="/" className="btn ghost sm" target="_blank"><ExternalLink size={15} /><span className="hide-sm">View website</span></Link>
            <div className="bell-wrap">
              <button className="icon-btn" onClick={() => setBell(!bell)} aria-label={`Notifications, ${unread} unread`}><Bell size={20} />{unread > 0 && <span className="dot">{unread}</span>}</button>
              {bell && (
                <div className="dropdown wide">
                  <div className="dropdown-head between"><b>Notifications</b>{unread > 0 && <button className="btn link small" onClick={() => notes.forEach((n) => db.update('notifications', n.id, { read: true }))}>Mark all read</button>}</div>
                  {notes.length ? notes.slice(0, 8).map((n) => (
                    <button key={n.id} className={cx('notif-item', !n.read && 'unread')} onClick={() => { db.update('notifications', n.id, { read: true }); n.link && nav(n.link); }}>
                      <b>{n.title}</b><span>{n.text}</span><small>{timeAgo(n.createdAt)}</small>
                    </button>
                  )) : <p className="muted small" style={{ padding: 14 }}>No notifications.</p>}
                </div>
              )}
            </div>
            <div className="admin-user"><Avatar user={user} size={32} /><div className="hide-sm"><b>{user.name}</b><span>{user.role}</span></div></div>
            <button className="icon-btn" onClick={() => { logout(); nav('/'); }} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
