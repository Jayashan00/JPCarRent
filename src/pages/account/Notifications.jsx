import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Empty } from '../../components/ui';
import { timeAgo } from '../../lib/utils';
export default function Notifications() {
  const { user } = useAuth();
  const { notifications } = useDB();
  const nav = useNavigate();
  const list = notifications.filter((n) => n.userId === user.id);
  return (
    <>
      <div className="between"><h1 className="acc-title">Notifications</h1>
        {list.some((n) => !n.read) && <button className="btn ghost sm" onClick={() => list.forEach((n) => !n.read && db.update('notifications', n.id, { read: true }))}>Mark all as read</button>}</div>
      {list.length ? (
        <ul className="notif-list card">
          {list.map((n) => (
            <li key={n.id} className={n.read ? '' : 'unread'}>
              <button className="notif-main" onClick={() => { db.update('notifications', n.id, { read: true }); n.link && nav(n.link); }}>
                <b>{n.title}</b><span>{n.text}</span><small>{timeAgo(n.createdAt)}</small>
              </button>
              <button className="icon-btn" aria-label="Delete notification" onClick={() => db.remove('notifications', n.id)}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <div className="card"><Empty icon="Inbox" title="You’re all caught up" /></div>}
    </>
  );
}
