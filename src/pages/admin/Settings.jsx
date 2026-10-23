import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { Field, Toggle, ImageUploader, useConfirm, useToast } from '../../components/ui';

export default function Settings() {
  const { settings } = useDB();
  const [s, setS] = useState(settings);
  const toast = useToast();
  const confirm = useConfirm();
  const file = useRef();
  const set = (k) => (e) => setS({ ...s, [k]: e.target.type === 'number' ? +e.target.value : e.target.value });
  const save = () => { db.setObject('settings', s); toast('Settings saved'); };

  const backup = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([db.exportJSON()], { type: 'application/json' }));
    a.download = `jp-rentacar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const restore = async (f) => {
    try { db.importJSON(await f.text()); setS(db.snapshot().settings); toast('Backup restored'); }
    catch (e) { toast(e.message || 'That file couldn’t be read.', 'error'); }
  };
  const reset = async () => {
    if (!(await confirm({ title: 'Reset all demo data?', text: 'Every vehicle, booking, user and page goes back to the original sample content. You’ll stay signed in only if your account exists in the sample data.', confirmText: 'Reset everything' }))) return;
    db.reset();
    setS(db.snapshot().settings);
    toast('Demo data restored');
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Settings</h1><p className="muted">Business details used across the website, emails and invoices.</p></div>
        <button className="btn primary sm" onClick={save}>Save settings</button>
      </div>
      <div className="settings-grid">
        <section className="card pad">
          <h3>Business</h3>
          <div className="form-grid">
            <Field label="Business name" className="full"><input value={s.businessName} onChange={set('businessName')} /></Field>
            <Field label="Tagline" className="full"><input value={s.tagline} onChange={set('tagline')} /></Field>
            <Field label="Phone"><input value={s.phone} onChange={set('phone')} /></Field>
            <Field label="WhatsApp number" hint="Country code, no + or spaces. e.g. 94777623101"><input value={s.whatsapp} onChange={set('whatsapp')} /></Field>
            <Field label="Email" className="full" hint="Leave empty to hide email on the website."><input type="email" value={s.email} onChange={set('email')} /></Field>
            <Field label="Address" className="full"><input value={s.address} onChange={set('address')} /></Field>
            <Field label="Delivery note (under the address)" className="full"><input value={s.deliveryNote || ''} onChange={set('deliveryNote')} /></Field>
            <Field label="Map search text" className="full" hint="What Google Maps should look up for the map on the site."><input value={s.mapQuery} onChange={set('mapQuery')} /></Field>
            <Field label="Opening hours"><input value={s.hours} onChange={set('hours')} /></Field>
            <Field label="WhatsApp hours"><input value={s.whatsappHours} onChange={set('whatsappHours')} /></Field>
            <Field label="WhatsApp note" className="full" hint="Shown after the WhatsApp number."><input value={s.whatsappNote || ''} onChange={set('whatsappNote')} /></Field>
          </div>
          <h3 style={{ marginTop: 22 }}>Logo</h3>
          <p className="muted small" style={{ marginBottom: 8 }}>Leave empty to use the built-in JP badge.</p>
          <ImageUploader value={s.logo} onChange={(x) => setS({ ...s, logo: x })} label="Upload logo" />
        </section>
        <section className="card pad">
          <h3>Bookings & pricing</h3>
          <div className="form-grid">
            <Field label="Online bookings" className="full">
              <select value={s.bookingMode} onChange={set('bookingMode')}>
                <option value="instant">Confirm automatically</option>
                <option value="request">Send as a request for us to confirm</option>
              </select>
            </Field>
            <Field label="Currency code"><input value={s.currency} onChange={set('currency')} /></Field>
            <Field label="Tax (%)"><input type="number" min={0} value={s.taxPercent} onChange={set('taxPercent')} /></Field>
            <Field label="LKR per US dollar" hint="For the approximate USD price shown to tourists."><input type="number" min={1} value={s.usdRate} onChange={set('usdRate')} /></Field>
            <Field label="LKR per euro"><input type="number" min={1} value={s.eurRate} onChange={set('eurRate')} /></Field>
            <Field label="Minimum driver age"><input type="number" min={18} value={s.minDriverAge} onChange={set('minDriverAge')} /></Field>
            <Field label="Late return fee per hour (LKR)"><input type="number" min={0} value={s.lateFeePerHour} onChange={set('lateFeePerHour')} /></Field>
            <Field label="Fuel charge per quarter tank (LKR)"><input type="number" min={0} value={s.fuelChargePerQuarter} onChange={set('fuelChargePerQuarter')} /></Field>
            <Field label="Cleaning fee (LKR)"><input type="number" min={0} value={s.cleaningFee} onChange={set('cleaningFee')} /></Field>
            <div className="field full"><Toggle checked={s.showUsd} onChange={(x) => setS({ ...s, showUsd: x })} label="Show approximate US dollar prices" /></div>
            <Field label="Bank transfer details" className="full"><textarea rows={4} value={s.bankDetails} onChange={set('bankDetails')} /></Field>
          </div>
          <h3 style={{ marginTop: 22 }}>Social & reviews</h3>
          <div className="form-grid">
            <Field label="Facebook link"><input value={s.facebook} onChange={set('facebook')} /></Field>
            <Field label="Instagram link"><input value={s.instagram} onChange={set('instagram')} /></Field>
            <Field label="TripAdvisor link"><input value={s.tripadvisor} onChange={set('tripadvisor')} /></Field>
            <Field label="Google rating"><input type="number" step={0.1} min={0} max={5} value={s.googleRating} onChange={set('googleRating')} /></Field>
            <Field label="Google review count"><input type="number" min={0} value={s.googleReviewCount} onChange={set('googleReviewCount')} /></Field>
          </div>
        </section>
      </div>
      <section className="card pad" style={{ marginTop: 20 }}>
        <h3>Data</h3>
        <p className="muted small" style={{ marginBottom: 12 }}>In this preview, data is saved in this browser ({db.storageUsedKB()} KB used). Download a backup before clearing your browser.</p>
        <div className="row-gap">
          <button className="btn ghost sm" onClick={backup}><Download size={16} />Download backup</button>
          <button className="btn ghost sm" onClick={() => file.current.click()}><Upload size={16} />Restore backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && restore(e.target.files[0])} />
          <button className="btn danger sm" onClick={reset}><RotateCcw size={16} />Reset demo data</button>
        </div>
      </section>
    </div>
  );
}