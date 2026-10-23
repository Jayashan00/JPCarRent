import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/db';
import { Field, ImageUploader, useToast, useConfirm } from '../../components/ui';
export default function Profile() {
  const { user, updateMe, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const nav = useNavigate();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: user.phone || '', country: user.country || '', avatar: user.avatar || '', marketing: !!user.marketing });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Name can’t be empty.', 'error');
    if (db.all('users').some((u) => u.id !== user.id && u.email.toLowerCase() === f.email.toLowerCase())) return toast('That email is used by another account.', 'error');
    updateMe(f);
    toast('Profile saved');
  };
  const changePw = (e) => {
    e.preventDefault();
    if (pw.current !== user.password) return setPwErr('Your current password is incorrect.');
    if (pw.next.length < 6) return setPwErr('Use at least 6 characters.');
    if (pw.next !== pw.confirm) return setPwErr('New passwords don’t match.');
    updateMe({ password: pw.next });
    setPw({ current: '', next: '', confirm: '' });
    setPwErr('');
    toast('Password changed');
  };
  const del = async () => {
    if (!(await confirm({ title: 'Delete your account?', text: 'Your profile, saved cars and documents will be removed. Past bookings stay on record for accounting.', confirmText: 'Delete account' }))) return;
    const id = user.id;
    logout();
    db.remove('users', id);
    nav('/');
  };
  return (
    <>
      <h1 className="acc-title">Profile & password</h1>
      <form className="card pad" onSubmit={save}>
        <h3 style={{ marginBottom: 14 }}>Your details</h3>
        <div className="profile-row">
          <div style={{ width: 160 }}><span className="field-label">Photo</span><div style={{ marginTop: 6 }}><ImageUploader value={f.avatar} onChange={(x) => setF({ ...f, avatar: x })} label="Upload" aspect="square" /></div></div>
          <div className="form-grid" style={{ flex: 1 }}>
            <Field label="Full name"><input value={f.name} onChange={set('name')} /></Field>
            <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
            <Field label="Phone or WhatsApp"><input value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Country"><input value={f.country} onChange={set('country')} /></Field>
            <label className="check full"><input type="checkbox" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} />Send me occasional offers and travel tips</label>
          </div>
        </div>
        <button className="btn dark" style={{ marginTop: 16 }}>Save profile</button>
      </form>
      <form className="card pad" onSubmit={changePw} style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 14 }}>Change password</h3>
        <div className="form-grid three">
          <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password"><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        {pwErr && <p className="field-error" style={{ marginTop: 8 }}>{pwErr}</p>}
        <button className="btn dark" style={{ marginTop: 16 }}>Change password</button>
      </form>
      <div className="card pad danger-zone" style={{ marginTop: 18 }}>
        <div><h3>Delete account</h3><p className="muted small">Permanently remove your profile and documents.</p></div>
        <button className="btn danger" onClick={del}>Delete account</button>
      </div>
    </>
  );
}
