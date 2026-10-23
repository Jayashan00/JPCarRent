import { useState } from 'react';
import { Eye, Check, X } from 'lucide-react';
import ResourceManager from './ResourceManager';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Avatar, Badge, Modal, Empty, useToast } from '../../components/ui';
import { money, fmtDate } from '../../lib/utils';

export default function Customers() {
  const { bookings } = useDB();
  const { user: me } = useAuth();
  const [view, setView] = useState(null);
  const stats = (id) => { const bs = bookings.filter((b) => b.userId === id && b.status !== 'cancelled'); return { n: bs.length, spent: bs.reduce((s, b) => s + (b.amountPaid || 0), 0) }; };
  return (
    <>
      <ResourceManager title="Customers & staff" singular="user" collection="users" prefix="usr" searchKeys={['name', 'email', 'phone', 'country']}
        intro="Every account on the website. Change roles to give staff access to this dashboard."
        defaults={{ role: 'customer', status: 'active', documents: [], favorites: [] }}
        filters={[{ key: 'role', label: 'Role', options: ['customer', 'staff', 'admin'] }, { key: 'status', label: 'Status', options: ['active', 'blocked'] }]}
        extraActions={(r) => <button className="icon-btn" aria-label="View profile" onClick={() => setView(r.id)}><Eye size={16} /></button>}
        fields={[
          { key: 'avatar', label: 'Photo', type: 'image', aspect: 'square' },
          { key: 'name', label: 'Full name', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true, validate: (v, all) => db.all('users').some((u) => u.email.toLowerCase() === String(v).toLowerCase() && u.id !== all.id) ? 'Another account uses this email.' : '' },
          { key: 'phone', label: 'Phone' }, { key: 'country', label: 'Country' },
          { key: 'role', label: 'Role', type: 'select', options: [{ value: 'customer', label: 'Customer' }, { value: 'staff', label: 'Staff (dashboard access)' }, { value: 'admin', label: 'Admin (full access)' }], validate: (v, all) => (all.id === me.id && v === 'customer' ? 'You can’t remove your own admin access.' : '') },
          { key: 'status', label: 'Account status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }] },
          { key: 'licenseNo', label: 'Licence number' }, { key: 'passportNo', label: 'Passport/NIC' },
          { key: 'password', label: 'Password', type: 'text', required: true, hint: 'Shown here only in the demo. The real backend will store it encrypted and offer a reset link instead.' },
          { key: 'notes', label: 'Internal notes', type: 'textarea', rows: 2 },
        ]}
        columns={[
          { label: 'Name', render: (r) => <div className="cell-user"><Avatar user={r} /><div><b>{r.name}</b><span>{r.email}</span></div></div> },
          { key: 'phone', label: 'Phone' }, { key: 'country', label: 'Country' },
          { label: 'Role', render: (r) => <Badge tone={r.role === 'customer' ? '' : 's-active'}>{r.role}</Badge> },
          { label: 'Bookings', render: (r) => stats(r.id).n }, { label: 'Paid', render: (r) => money(stats(r.id).spent) },
          { label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
        ]} />
      {view && <CustomerView id={view} onClose={() => setView(null)} />}
    </>
  );
}

function CustomerView({ id, onClose }) {
  const { users, bookings, vehicles } = useDB();
  const toast = useToast();
  const u = users.find((x) => x.id === id);
  const [img, setImg] = useState(null);
  if (!u) return null;
  const bs = bookings.filter((b) => b.userId === u.id);
  const setDoc = (docId, status) => {
    db.update('users', u.id, { documents: u.documents.map((d) => (d.id === docId ? { ...d, status } : d)) });
    db.notify(u.id, status === 'verified' ? 'Document verified' : 'Document needs attention', status === 'verified' ? 'Your document has been verified.' : 'Please upload a clearer copy of your document.', '/account/documents');
    toast(`Document ${status}`);
  };
  return (
    <Modal title={u.name} onClose={onClose} size="lg">
      <div className="cell-user" style={{ marginBottom: 16 }}><Avatar user={u} size={56} /><div><b>{u.email}</b><span>{u.phone} · {u.country} · joined {fmtDate(u.createdAt)}</span></div></div>
      <h4>Documents</h4>
      {u.documents?.length ? (
        <ul className="doc-admin">
          {u.documents.map((d) => (
            <li key={d.id}>
              {d.url ? <button className="doc-thumb" onClick={() => setImg(d.url)}><img src={d.url} alt={d.type} /></button> : <span className="doc-thumb" />}
              <div><b>{d.type}</b><span className="small muted">{fmtDate(d.uploadedAt)}</span></div>
              <Badge status={d.status}>{d.status}</Badge>
              <button className="icon-btn ok" onClick={() => setDoc(d.id, 'verified')} aria-label="Verify"><Check size={16} /></button>
              <button className="icon-btn del" onClick={() => setDoc(d.id, 'rejected')} aria-label="Reject"><X size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <p className="muted small">No documents uploaded.</p>}
      <h4 style={{ marginTop: 18 }}>Bookings</h4>
      {bs.length ? <table className="table compact"><tbody>{bs.map((b) => <tr key={b.id}><td><b>{b.ref}</b></td><td>{vehicles.find((v) => v.id === b.vehicleId)?.name}</td><td>{fmtDate(b.pickupAt)}</td><td>{money(b.total)}</td><td><Badge status={b.status} /></td></tr>)}</tbody></table> : <Empty title="No bookings yet" />}
      {img && <Modal title="Document" onClose={() => setImg(null)}><img src={img} alt="" /></Modal>}
    </Modal>
  );
}
