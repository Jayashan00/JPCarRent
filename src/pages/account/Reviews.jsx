import { useState } from 'react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Stars, Badge, Empty, Modal, Field, useConfirm, useToast } from '../../components/ui';
import { fmtDate } from '../../lib/utils';
export default function Reviews() {
  const { user } = useAuth();
  const { reviews } = useDB();
  const confirm = useConfirm();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const mine = reviews.filter((r) => r.userId === user.id);
  const save = () => {
    db.update('reviews', edit.id, { rating: edit.rating, text: edit.text, status: 'pending' });
    toast('Review updated. It will show again once approved.');
    setEdit(null);
  };
  return (
    <>
      <h1 className="acc-title">My reviews</h1>
      <p className="muted" style={{ marginBottom: 16 }}>You can review a car from <b>My bookings</b> once a rental is completed.</p>
      {mine.length ? (
        <div className="stack">
          {mine.map((r) => (
            <div key={r.id} className="card pad">
              <div className="between"><div><b>{r.trip}</b><div><Stars value={r.rating} /></div></div><Badge status={r.status} /></div>
              <p style={{ margin: '10px 0' }}>{r.text}</p>
              <div className="between"><span className="small muted">{fmtDate(r.createdAt)}</span>
                <div className="row-gap"><button className="btn ghost sm" onClick={() => setEdit({ ...r })}>Edit</button>
                  <button className="btn ghost sm" onClick={async () => { if (await confirm({ title: 'Delete this review?', text: 'It will be removed from the website.' })) { db.remove('reviews', r.id); toast('Review deleted'); } }}>Delete</button></div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty icon="Star" title="No reviews yet" text="After your trip, tell other travellers how it went." /></div>}
      {edit && (
        <Modal title="Edit review" onClose={() => setEdit(null)} footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn dark" onClick={save}>Save review</button></>}>
          <Stars value={edit.rating} onChange={(n) => setEdit({ ...edit, rating: n })} size={24} />
          <Field label="Review"><textarea value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  );
}
