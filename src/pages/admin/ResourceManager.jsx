import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Search, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { db, useCollection } from '../../lib/db';
import { Modal, Field, Toggle, ImageUploader, TagsInput, Empty, Pager, useConfirm, useToast, ICON_SET, DynIcon } from '../../components/ui';
import { cx, downloadCSV } from '../../lib/utils';

export function FormFields({ fields, value, onChange, errors = {} }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="form-grid">
      {fields.map((f) => {
        if (f.show && !f.show(value)) return null;
        const v = value[f.key];
        const common = { className: f.full || ['textarea', 'image', 'images', 'tags'].includes(f.type) ? 'full' : '', label: f.label + (f.required ? ' *' : ''), hint: f.hint, error: errors[f.key] };
        switch (f.type) {
          case 'textarea':
            return <Field key={f.key} {...common}><textarea rows={f.rows || 4} value={v ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} /></Field>;
          case 'number':
            return <Field key={f.key} {...common}><input type="number" min={f.min} step={f.step || 'any'} value={v ?? ''} onChange={(e) => set(f.key, e.target.value === '' ? '' : +e.target.value)} placeholder={f.placeholder} /></Field>;
          case 'select': {
            const opts = typeof f.options === 'function' ? f.options() : f.options;
            return <Field key={f.key} {...common}><select value={v ?? ''} onChange={(e) => set(f.key, e.target.value)}>{f.allowEmpty && <option value="">{f.allowEmpty}</option>}{opts.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
          }
          case 'toggle':
            return <div key={f.key} className={cx('field', 'toggle-field')}><span className="field-label">{f.label}</span><Toggle checked={v} onChange={(x) => set(f.key, x)} label={v ? f.on || 'Yes' : f.off || 'No'} />{f.hint && <span className="field-hint">{f.hint}</span>}</div>;
          case 'image':
            return <div key={f.key} className="field full"><span className="field-label">{f.label}</span><ImageUploader value={v} onChange={(x) => set(f.key, x)} aspect={f.aspect} />{f.hint && <span className="field-hint">{f.hint}</span>}</div>;
          case 'images':
            return <div key={f.key} className="field full"><span className="field-label">{f.label}</span><ImageUploader multiple value={v || []} onChange={(x) => set(f.key, x)} label="Add photos" />{f.hint && <span className="field-hint">{f.hint}</span>}</div>;
          case 'tags':
            return <div key={f.key} className="field full"><span className="field-label">{f.label}</span><TagsInput value={v || []} onChange={(x) => set(f.key, x)} placeholder={f.placeholder} />{f.hint && <span className="field-hint">{f.hint}</span>}</div>;
          case 'color':
            return <Field key={f.key} {...common}><div className="color-row"><input type="color" value={v || '#cccccc'} onChange={(e) => set(f.key, e.target.value)} /><input value={v || ''} onChange={(e) => set(f.key, e.target.value)} /></div></Field>;
          case 'icon':
            return (
              <div key={f.key} className="field full"><span className="field-label">{f.label}</span>
                <div className="icon-pick">{Object.keys(ICON_SET).map((n) => <button type="button" key={n} className={cx(v === n && 'on')} onClick={() => set(f.key, n)} title={n} aria-label={n}><DynIcon name={n} size={18} /></button>)}</div>
              </div>
            );
          default:
            return <Field key={f.key} {...common}><input type={f.type || 'text'} value={v ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} /></Field>;
        }
      })}
    </div>
  );
}

export function validateFields(fields, value) {
  const e = {};
  for (const f of fields) {
    if (f.show && !f.show(value)) continue;
    const v = value[f.key];
    if (f.required && (v === '' || v == null || (Array.isArray(v) && !v.length))) e[f.key] = `${f.label} is required.`;
    if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) e[f.key] = 'Enter a valid email.';
    if (f.validate) { const m = f.validate(v, value); if (m) e[f.key] = m; }
  }
  return e;
}

export function EditModal({ title, fields, initial, onSave, onClose, size = 'lg', saveLabel = 'Save' }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState({});
  const save = () => {
    const e = validateFields(fields, value);
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave(value);
  };
  return (
    <Modal title={title} onClose={onClose} size={size} footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn dark" onClick={save}>{saveLabel}</button></>}>
      <FormFields fields={fields} value={value} onChange={setValue} errors={errors} />
    </Modal>
  );
}

export default function ResourceManager({
  title, intro, collection, fields, columns, searchKeys = ['name'], singular = 'item', defaults = {}, prefix,
  sortable = false, filters = [], extraActions, headerExtra, canCreate = true, canDelete = true, pageSize = 12, onBeforeSave, rowClass, startNew = false, modalSize = 'lg',
}) {
  const rows = useCollection(collection);
  const confirm = useConfirm();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState({});
  const [edit, setEdit] = useState(startNew ? { ...defaults } : null);
  const [sel, setSel] = useState([]);
  const [page, setPage] = useState(1);

  const list = useMemo(() => rows.filter((r) =>
    (!q || searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))) &&
    filters.every((f) => !flt[f.key] || String(f.get ? f.get(r) : r[f.key]) === flt[f.key])), [rows, q, flt, searchKeys, filters]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const shown = sortable ? list : list.slice((page - 1) * pageSize, page * pageSize);

  const save = (value) => {
    const data = onBeforeSave ? onBeforeSave(value) : value;
    if (edit.id) { db.update(collection, edit.id, data); toast(`${cap(singular)} updated`); }
    else { db.create(collection, data, prefix); toast(`${cap(singular)} added`); }
    setEdit(null);
  };
  const del = async (r) => {
    if (!(await confirm({ title: `Delete this ${singular}?`, text: `“${r.name || r.title || r.code || r.question || r.id}” will be removed permanently.` }))) return;
    db.remove(collection, r.id);
    toast(`${cap(singular)} deleted`);
  };
  const bulkDel = async () => {
    if (!(await confirm({ title: `Delete ${sel.length} ${singular}s?`, text: 'This can’t be undone.' }))) return;
    sel.forEach((id) => db.remove(collection, id));
    setSel([]);
    toast(`${sel.length} deleted`);
  };
  const move = (i, d) => {
    const ids = rows.map((r) => r.id);
    const j = ids.indexOf(list[i].id);
    const k = ids.indexOf(list[i + d]?.id);
    if (k < 0) return;
    [ids[j], ids[k]] = [ids[k], ids[j]];
    db.reorder(collection, ids);
  };
  const dup = (r) => {
    const { id, createdAt, updatedAt, ...rest } = r;
    db.create(collection, { ...rest, name: rest.name ? `${rest.name} (copy)` : rest.name, title: rest.title ? `${rest.title} (copy)` : rest.title, code: rest.code ? `${rest.code}COPY` : rest.code }, prefix);
    toast(`${cap(singular)} duplicated`);
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>{title}</h1>{intro && <p className="muted">{intro}</p>}</div>
        <div className="row-gap">
          {headerExtra}
          <button className="btn ghost sm" onClick={() => downloadCSV(`${collection}.csv`, list.map(flatten))}><Download size={16} />Export</button>
          {canCreate && <button className="btn primary sm" onClick={() => setEdit({ ...defaults })}><Plus size={16} />Add {singular}</button>}
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box"><Search size={16} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} aria-label="Search" /></div>
        {filters.map((f) => (
          <select key={f.key} className="input slim" value={flt[f.key] || ''} onChange={(e) => { setFlt({ ...flt, [f.key]: e.target.value }); setPage(1); }} aria-label={f.label}>
            <option value="">{f.label}: all</option>
            {(typeof f.options === 'function' ? f.options() : f.options).map((o) => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {sel.length > 0 && <button className="btn danger sm" onClick={bulkDel}><Trash2 size={15} />Delete {sel.length}</button>}
        <span className="muted small push">{list.length} {list.length === 1 ? singular : `${singular}s`}</span>
      </div>

      <div className="table-wrap card">
        {list.length ? (
          <table className="table">
            <thead>
              <tr>
                <th className="w-check"><input type="checkbox" aria-label="Select all" checked={sel.length > 0 && sel.length === shown.length} onChange={(e) => setSel(e.target.checked ? shown.map((r) => r.id) : [])} /></th>
                {columns.map((c) => <th key={c.key || c.label}>{c.label}</th>)}
                <th className="w-actions"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id} className={rowClass?.(r)}>
                  <td className="w-check"><input type="checkbox" aria-label="Select row" checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></td>
                  {columns.map((c) => <td key={c.key || c.label} data-label={c.label} onClick={c.clickToEdit !== false ? () => setEdit(r) : undefined} className={c.className}>{c.render ? c.render(r) : r[c.key]}</td>)}
                  <td className="w-actions">
                    <div className="row-actions">
                      {sortable && <><button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={16} /></button><button className="icon-btn" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down"><ArrowDown size={16} /></button></>}
                      {extraActions?.(r)}
                      <button className="icon-btn" onClick={() => setEdit(r)} aria-label="Edit"><Pencil size={16} /></button>
                      {canDelete && <button className="icon-btn" onClick={() => dup(r)} aria-label="Duplicate"><Copy size={16} /></button>}
                      {canDelete && <button className="icon-btn del" onClick={() => del(r)} aria-label="Delete"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title={q || Object.values(flt).some(Boolean) ? 'Nothing matches your search' : `No ${singular}s yet`} text={canCreate ? `Add your first ${singular} to get started.` : ''}
            action={canCreate && !q && <button className="btn primary" onClick={() => setEdit({ ...defaults })}><Plus size={16} />Add {singular}</button>} />
        )}
        {!sortable && <Pager page={page} pages={pages} onPage={setPage} />}
      </div>

      {edit && <EditModal size={modalSize} title={edit.id ? `Edit ${singular}` : `Add ${singular}`} fields={fields} initial={edit} onSave={save} onClose={() => setEdit(null)} saveLabel={edit.id ? 'Save changes' : `Add ${singular}`} />}
    </div>
  );
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);
function flatten(r) {
  const o = {};
  for (const [k, v] of Object.entries(r)) {
    if (typeof v === 'string' && v.startsWith('data:')) o[k] = '[image]';
    else if (Array.isArray(v)) o[k] = v.map((x) => (typeof x === 'string' && x.startsWith('data:') ? '[image]' : typeof x === 'object' ? JSON.stringify(x) : x)).join(' | ');
    else if (v && typeof v === 'object') o[k] = JSON.stringify(v);
    else o[k] = v;
  }
  return o;
}
