import { useState } from 'react';
import { FileText, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/db';
import { Badge, Empty, ImageUploader, Field, Modal, useConfirm, useToast } from '../../components/ui';
import { fmtDate, uid } from '../../lib/utils';
const TYPES = ['Driving licence', 'International Driving Permit', 'Passport', 'National ID card', 'Recognition permit'];
export default function Documents() {
  const { user, updateMe } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [type, setType] = useState(TYPES[0]);
  const [img, setImg] = useState('');
  const [view, setView] = useState(null);
  const docs = user.documents || [];
  const add = () => {
    if (!img) return toast('Choose a photo or scan first.', 'error');
    updateMe({ documents: [...docs, { id: uid('doc'), type, name: `${type}.jpg`, url: img, status: 'pending', uploadedAt: new Date().toISOString() }] });
    db.notify('admin', 'Document uploaded', `${user.name} uploaded a ${type.toLowerCase()}.`, '/admin/customers');
    setImg('');
    toast('Document uploaded. We’ll verify it before pickup.');
  };
  return (
    <>
      <h1 className="acc-title">Documents</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Upload your licence and passport before you arrive so the handover takes minutes, not half an hour. Only our team can see these files.</p>
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <Field label="Licence number"><input defaultValue={user.licenseNo} onBlur={(e) => updateMe({ licenseNo: e.target.value })} /></Field>
        <Field label="Passport or NIC number"><input defaultValue={user.passportNo} onBlur={(e) => updateMe({ passportNo: e.target.value })} /></Field>
      </div>
      <div className="card pad" style={{ marginBottom: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Upload a document</h3>
        <Field label="Document type"><select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <div style={{ margin: '12px 0' }}><ImageUploader value={img} onChange={setImg} label="Choose a photo or scan" /></div>
        <button className="btn dark" onClick={add}>Upload document</button>
      </div>
      {docs.length ? (
        <div className="doc-list">
          {docs.map((d) => (
            <div key={d.id} className="doc card">
              <FileText size={22} />
              <div><b>{d.type}</b><span className="small muted">Uploaded {fmtDate(d.uploadedAt)}</span></div>
              <Badge status={d.status}>{d.status === 'verified' ? 'Verified' : d.status === 'rejected' ? 'Rejected' : 'Checking'}</Badge>
              {d.url && <button className="icon-btn" onClick={() => setView(d)} aria-label="View"><Eye size={18} /></button>}
              <button className="icon-btn" aria-label="Delete" onClick={async () => { if (await confirm({ title: 'Delete this document?', text: 'You can upload it again at any time.' })) updateMe({ documents: docs.filter((x) => x.id !== d.id) }); }}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty icon="Inbox" title="No documents yet" /></div>}
      {view && <Modal title={view.type} onClose={() => setView(null)}><img src={view.url} alt={view.type} style={{ borderRadius: 10 }} /></Modal>}
    </>
  );
}
