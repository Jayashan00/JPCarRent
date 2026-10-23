import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useDB } from '../../lib/db';
import { Field, useToast } from '../../components/ui';
import { SafeImg } from '../../components/site';

function Shell({ title, text, children }) {
  const { content } = useDB();
  return (
    <div className="auth">
      <div className="auth-art"><SafeImg src={content.hero.image} alt="" /><div className="auth-quote"><b>“Picked up at the airport at 2am without any fuss.”</b><span>Emma, 14-day island tour</span></div></div>
      <div className="auth-form">
        <div className="auth-box">
          <h1>{title}</h1>
          {text && <p className="muted">{text}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

function Password({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  );
}

export function Login() {
  const { login, user, isAdmin } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to={params.get('next') || (isAdmin ? '/admin' : '/account')} replace />;
  const submit = (e) => {
    e.preventDefault();
    try {
      const u = login(f.email, f.password);
      toast(`Welcome back, ${u.name.split(' ')[0]}`);
      nav(params.get('next') || (u.role === 'customer' ? '/account' : '/admin'));
    } catch (x) { setErr(x.message); }
  };
  const demo = (email, password) => setF({ email, password });
  return (
    <Shell title="Sign in" text="Manage your bookings, saved cars and documents.">
      <form onSubmit={submit} className="stack">
        <Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></Field>
        <Field label="Password"><Password value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" /></Field>
        {err && <p className="notice warn" role="alert">{err}</p>}
        <div className="between"><Link to="/forgot-password" className="small">Forgot your password?</Link></div>
        <button className="btn dark lg block">Sign in</button>
      </form>
      <p className="muted center">New here? <Link to={`/register${params.get('next') ? `?next=${params.get('next')}` : ''}`}>Create an account</Link></p>
      <div className="demo-box">
        <b>Demo accounts for the preview</b>
        <button type="button" onClick={() => demo('admin@jprentacar.lk', 'admin123')}>Admin: admin@jprentacar.lk / admin123</button>
        <button type="button" onClick={() => demo('user@demo.com', 'user123')}>Customer: user@demo.com / user123</button>
      </div>
    </Shell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', country: '', password: '', confirm: '', agree: false });
  const [err, setErr] = useState({});
  if (user) return <Navigate to="/account" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address.';
    if (f.password.length < 6) x.password = 'Use at least 6 characters.';
    if (f.password !== f.confirm) x.confirm = 'Passwords don’t match.';
    if (!f.agree) x.agree = 'Please accept the terms.';
    setErr(x);
    if (Object.keys(x).length) return;
    try {
      register(f);
      toast('Account created. Welcome!');
      nav(params.get('next') || '/account');
    } catch (y) { setErr({ email: y.message }); }
  };
  return (
    <Shell title="Create an account" text="Book faster, track your rentals and keep your licence on file.">
      <form onSubmit={submit} className="stack" noValidate>
        <Field label="Full name" error={err.name}><input value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label="Email" error={err.email}><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <div className="form-grid">
          <Field label="Phone or WhatsApp"><input value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
          <Field label="Country"><input value={f.country} onChange={set('country')} autoComplete="country-name" /></Field>
          <Field label="Password" error={err.password}><Password value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
          <Field label="Confirm password" error={err.confirm}><Password value={f.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} /><span>I agree to the <Link to="/terms">rental terms</Link> and <Link to="/privacy">privacy policy</Link>.</span></label>
        {err.agree && <p className="field-error">{err.agree}</p>}
        <button className="btn dark lg block">Create account</button>
      </form>
      <p className="muted center">Already registered? <Link to="/login">Sign in</Link></p>
    </Shell>
  );
}

export function Forgot() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  return (
    <Shell title="Reset your password" text="Enter the email you registered with and we’ll send a reset link.">
      {sent ? (
        <div className="notice ok">If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox and spam folder.</div>
      ) : (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <Field label="Email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <button className="btn dark lg block">Send reset link</button>
        </form>
      )}
      <p className="muted center"><Link to="/login">Back to sign in</Link></p>
    </Shell>
  );
}
