import { useState } from 'react';
import { Mail, Trash2, MessageCircle, Search } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Badge, Empty, Tabs, useConfirm, useToast } from '../../components/ui';
import { timeAgo, fmtDate, waLink, cx } from '../../lib/utils';

export default function Messages() {
  const { messages, settings } = useDB();
  const { user } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(messages[0]?.id);
  const [reply, setReply] = useState('');
  const list = messages.filter((m) => (tab === 'all' || m.status === tab) && (!q || `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q.toLowerCase())));
  const m = messages.find((x) => x.id === sel);

  const open = (id) => {
    setSel(id);
    const x = messages.find((y) => y.id === id);
    if (x?.status === 'new') db.update('messages', id, { status: 'read' });
  };
  const send = () => {
    if (!reply.trim()) return;
    db.update('messages', m.id, { status: 'replied', replies: [...(m.replies || []), { by: user.name, text: reply, at: new Date().toISOString() }] });
    if (m.userId) db.notify(m.userId, 'Reply from JP Rent A Car', reply.slice(0, 90), '/account/notifications');
    setReply('');
    toast('Reply saved. Email sending will work once the backend is connected.');
  };
  const del = async () => {
    if (!(await confirm({ title: 'Delete this message?', text: 'The conversation will be removed.' }))) return;
    db.remove('messages', m.id);
    setSel(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-head"><div><h1>Messages</h1><p className="muted">Questions from the contact form, transfer requests and booking change requests.</p></div></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: messages.length }, { value: 'new', label: 'Unread', count: messages.filter((x) => x.status === 'new').length }, { value: 'read', label: 'Read' }, { value: 'replied', label: 'Replied' }]} />
      <div className="inbox card">
        <div className="inbox-list">
          <div className="search-box"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" /></div>
          {list.length ? list.map((x) => (
            <button key={x.id} className={cx('inbox-item', x.id === sel && 'on', x.status === 'new' && 'unread')} onClick={() => open(x.id)}>
              <div className="between"><b>{x.name}</b><small>{timeAgo(x.createdAt)}</small></div>
              <span className="inbox-subj">{x.subject}</span>
              <span className="inbox-prev">{x.message}</span>
            </button>
          )) : <Empty icon="Inbox" title="No messages" />}
        </div>
        <div className="inbox-view">
          {m ? (
            <>
              <div className="between inbox-head">
                <div><h2>{m.subject}</h2><p className="muted small">{m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <> · {m.phone}</>} · {fmtDate(m.createdAt, true)}</p></div>
                <div className="row-gap"><Badge status={m.status}>{m.status}</Badge>
                  {m.status !== 'new' && <button className="btn ghost sm" onClick={() => db.update('messages', m.id, { status: 'new' })}>Mark unread</button>}
                  <button className="icon-btn del" onClick={del} aria-label="Delete"><Trash2 size={18} /></button></div>
              </div>
              <div className="msg-bubble">{m.message}</div>
              {(m.replies || []).map((r, i) => <div key={i} className="msg-bubble me"><small>{r.by}, {fmtDate(r.at, true)}</small>{r.text}</div>)}
              <div className="reply-box">
                <textarea className="input" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${m.name.split(' ')[0]}…`} />
                <div className="row-gap">
                  <button className="btn dark sm" onClick={send}>Save reply</button>
                  <a className="btn ghost sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}&body=${encodeURIComponent(reply)}`}><Mail size={15} />Reply by email</a>
                  {m.phone && <a className="btn wa sm" href={waLink(m.phone, reply || `Hi ${m.name.split(' ')[0]}, this is ${settings.businessName}.`)} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp</a>}
                </div>
              </div>
            </>
          ) : <Empty icon="Mail" title="Select a message" />}
        </div>
      </div>
    </div>
  );
}
