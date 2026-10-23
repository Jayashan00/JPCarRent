import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, CalendarCheck, Heart, Star, FileText, Bell, UserCog, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useDB } from '../../lib/db';
import { Avatar } from '../../components/ui';

export default function AccountLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications } = useDB();
  const nav = useNavigate();
  const unread = notifications.filter((n) => n.userId === user.id && !n.read).length;
  const links = [
    ['/account', LayoutGrid, 'Overview', true],
    ['/account/bookings', CalendarCheck, 'My bookings'],
    ['/account/saved', Heart, 'Saved cars'],
    ['/account/reviews', Star, 'My reviews'],
    ['/account/documents', FileText, 'Documents'],
    ['/account/notifications', Bell, 'Notifications', false, unread],
    ['/account/profile', UserCog, 'Profile & password'],
  ];
  return (
    <div className="wrap account">
      <aside className="acc-side">
        <div className="acc-user"><Avatar user={user} size={48} /><div><b>{user.name}</b><span>{user.email}</span></div></div>
        <nav className="acc-nav">
          {links.map(([to, Ic, label, end, count]) => (
            <NavLink key={to} to={to} end={end}><Ic size={18} />{label}{count ? <span className="count">{count}</span> : null}</NavLink>
          ))}
          {isAdmin && <NavLink to="/admin"><LayoutDashboard size={18} />Admin dashboard</NavLink>}
          <button onClick={() => { logout(); nav('/'); }}><LogOut size={18} />Sign out</button>
        </nav>
      </aside>
      <section className="acc-main"><Outlet /></section>
    </div>
  );
}
