import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ShieldCheck, Mountain, MapPin, MessageCircle, Car, Clock, Heart, Award, Fuel, Users, Wrench, Phone, Sparkles, Plane, Map as MapIcon, Inbox, Calendar, Star as StarIcon, ThumbsUp, Leaf, Key, Headphones, Circle } from 'lucide-react';
import { X, Star, Upload, ImagePlus, Trash2, Link2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { cx, fileToDataUrl, STATUS_LABEL, initials } from '../lib/utils';
import shopLogo from '../assets/jp-logo.jpg';

export const ICON_SET = { ShieldCheck, Mountain, MapPin, MessageCircle, Car, Clock, Heart, Award, Fuel, Users, Wrench, Phone, Sparkles, Plane, Map: MapIcon, Inbox, Calendar, Star: StarIcon, ThumbsUp, Leaf, Key, Headphones };
export function DynIcon({ name, size = 20, ...p }) {
  const I = ICON_SET[name] || Circle;
  return <I size={size} {...p} />;
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, type = 'success') => {
    const id = Math.random();
    setItems((x) => [...x, { id, text, type }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  useEffect(() => {
    const h = (e) => push(e.detail.text, e.detail.type);
    window.addEventListener('jp-toast', h);
    return () => window.removeEventListener('jp-toast', h);
  }, [push]);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className={cx('toast', t.type)}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Confirm dialog ---------- */
const ConfirmCtx = createContext(async () => true);
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (v) => { state?.resolve(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <Modal onClose={() => close(false)} title={state.title || 'Are you sure?'} size="sm">
          <p className="muted">{state.text}</p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => close(false)}>Keep it</button>
            <button className={cx('btn', state.danger !== false ? 'danger' : 'primary')} onClick={() => close(true)} autoFocus>{state.confirmText || 'Delete'}</button>
          </div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/* ---------- Modal & drawer ---------- */
export function Modal({ title, children, onClose, size = 'md', footer }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('modal', size)} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('field', className, error && 'has-error')}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-dot" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

export function TagsInput({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="tags-input">
      {value.map((t) => (
        <span key={t} className="tag">{t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X size={12} /></button></span>
      ))}
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} onBlur={add} />
    </div>
  );
}

/* ---------- Image upload (single or gallery) ---------- */
export function ImageUploader({ value, onChange, multiple = false, label = 'Upload image', aspect = 'wide' }) {
  const list = multiple ? value || [] : value ? [value] : [];
  const input = useRef();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [drag, setDrag] = useState(false);
  const toast = useToast();
  const dragIndex = useRef(null);

  const addFiles = async (files) => {
    setBusy(true);
    try {
      const urls = await Promise.all([...files].filter((f) => f.type.startsWith('image/')).map((f) => fileToDataUrl(f)));
      if (!urls.length) toast('Choose a JPG, PNG or WebP image.', 'error');
      else onChange(multiple ? [...list, ...urls] : urls[0]);
    } catch { toast('That image couldn’t be read. Try another file.', 'error'); }
    setBusy(false);
  };
  const addUrl = () => {
    if (!/^https?:\/\//.test(url) && !url.startsWith('data:')) return toast('Paste a full image link starting with https://', 'error');
    onChange(multiple ? [...list, url] : url);
    setUrl('');
  };
  const remove = (i) => onChange(multiple ? list.filter((_, j) => j !== i) : '');
  const move = (from, to) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div className="uploader">
      {list.length > 0 && (
        <div className={cx('thumbs', aspect)}>
          {list.map((src, i) => (
            <div key={i} className="thumb" draggable={multiple}
              onDragStart={() => (dragIndex.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => move(dragIndex.current, i)}>
              <img src={src} alt="" />
              {multiple && i === 0 && <span className="thumb-badge">Cover</span>}
              <div className="thumb-actions">
                {multiple && <button type="button" onClick={() => move(i, i - 1)} aria-label="Move left"><ChevronLeft size={14} /></button>}
                {multiple && <button type="button" onClick={() => move(i, i + 1)} aria-label="Move right"><ChevronRight size={14} /></button>}
                <button type="button" onClick={() => remove(i)} aria-label="Remove image"><Trash2 size={14} /></button>
              </div>
              {multiple && <GripVertical className="thumb-grip" size={14} />}
            </div>
          ))}
        </div>
      )}
      {(multiple || !list.length) && (
        <div className={cx('drop', drag && 'drag')} onClick={() => input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
          {busy ? <span>Processing…</span> : <>{multiple ? <ImagePlus size={22} /> : <Upload size={22} />}<span><strong>{label}</strong> or drag files here</span><small>JPG, PNG or WebP. Large photos are resized automatically.</small></>}
          <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>
      )}
      <div className="url-row">
        <Link2 size={16} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        <button type="button" className="btn sm ghost" onClick={addUrl} disabled={!url}>Add</button>
      </div>
    </div>
  );
}

/* ---------- Bits ---------- */
export function Stars({ value = 0, size = 16, onChange }) {
  return (
    <span className={cx('stars', onChange && 'editable')} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} onClick={onChange ? () => onChange(n) : undefined}
          fill={n <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.6} />
      ))}
    </span>
  );
}

export function Badge({ status, children, tone }) {
  return <span className={cx('badge', tone || `s-${status}`)}>{children || STATUS_LABEL[status] || status}</span>;
}

export function Avatar({ user, size = 36 }) {
  if (user?.avatar) return <img className="avatar" src={user.avatar} alt="" style={{ width: size, height: size }} />;
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(user?.name)}</span>;
}

export function Empty({ icon = 'Inbox', title, text, action }) {
  return (
    <div className="empty">
      <DynIcon name={icon} size={28} />
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Logo({ settings, light }) {
  // The shop photo is the brand mark (from JP Rent A Car's Facebook page).
  // An admin can replace it in Settings → Logo.
  const src = settings?.logo || shopLogo;
  return (
    <span className={cx('logo', light && 'light')}>
      <img src={src} alt="" className="logo-mark" width="44" height="44" />
      <span className="logo-words"><b>JP Rent A Car</b><small>Kandy, Sri Lanka</small></span>
    </span>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const id = typeof t === 'string' ? t : t.value;
        const lab = typeof t === 'string' ? t : t.label;
        return <button key={id} role="tab" aria-selected={value === id} className={cx('tab', value === id && 'on')} onClick={() => onChange(id)}>{lab}{t.count != null && <span className="tab-count">{t.count}</span>}</button>;
      })}
    </div>
  );
}

export function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="pager">
      <button className="btn sm ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button className="btn sm ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
