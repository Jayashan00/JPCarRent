import { useMemo, useState } from 'react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { Modal, Field, ImageUploader, useToast } from '../../components/ui';
import { money, toLocalInput, fmtDate } from '../../lib/utils';

export const FUEL = ['Empty', '1/4', '1/2', '3/4', 'Full'];
const CHECKS = [
  ['spare', 'Spare wheel and jack'], ['docs', 'Revenue licence, insurance and registration in the car'], ['clean', 'Interior and exterior clean'],
  ['tyres', 'Tyres and lights checked'], ['ac', 'Air conditioning working'], ['kit', 'First-aid kit and warning triangle'],
];

function FuelPicker({ value, onChange }) {
  return (
    <div className="seg fuel-seg" role="radiogroup" aria-label="Fuel level">
      {FUEL.map((f, i) => <button type="button" key={f} className={value === i ? 'on' : ''} onClick={() => onChange(i)} aria-pressed={value === i}>{f}</button>)}
    </div>
  );
}

/** Check-out: record the car's condition when the customer collects it. */
export function HandoverModal({ booking, onClose }) {
  const { vehicles } = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const v = vehicles.find((x) => x.id === booking.vehicleId);
  const [f, setF] = useState({ at: toLocalInput(new Date()), odometer: v?.mileage || '', fuel: 4, checks: Object.fromEntries(CHECKS.map(([k]) => [k, true])), damage: '', photos: [], depositTaken: booking.deposit > 0, idChecked: false });
  const save = () => {
    if (!f.odometer) return toast('Enter the odometer reading.', 'error');
    if (booking.mode === 'self' && !f.idChecked) return toast('Confirm you checked the licence and passport.', 'error');
    const checkout = { ...f, at: new Date(f.at).toISOString(), odometer: +f.odometer, by: user.name };
    db.update('bookings', booking.id, (b) => ({
      status: 'active', checkout,
      depositStatus: f.depositTaken && b.deposit > 0 ? 'held' : b.depositStatus || 'none',
      history: [...(b.history || []), { at: new Date().toISOString(), text: `Car handed over at ${checkout.odometer.toLocaleString()} km, fuel ${FUEL[f.fuel]} (${user.name})` }],
    }));
    if (v) db.update('vehicles', v.id, { mileage: +f.odometer });
    if (booking.userId) db.notify(booking.userId, 'Enjoy your trip', `Your ${v?.name} has been handed over. Message us any time on WhatsApp.`, '/account/bookings');
    toast('Car handed over. Booking is now on trip.');
    onClose();
  };
  return (
    <Modal title={`Hand over ${v?.name} (${booking.ref})`} onClose={onClose} size="lg"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn dark" onClick={save}>Complete handover</button></>}>
      <div className="form-grid">
        <Field label="Handover time"><input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></Field>
        <Field label="Odometer (km)"><input type="number" min={0} value={f.odometer} onChange={(e) => setF({ ...f, odometer: e.target.value })} /></Field>
        <div className="field full"><span className="field-label">Fuel level</span><FuelPicker value={f.fuel} onChange={(x) => setF({ ...f, fuel: x })} /></div>
        <div className="field full"><span className="field-label">Checklist</span>
          <div className="check-grid">{CHECKS.map(([k, l]) => <label key={k} className="check"><input type="checkbox" checked={f.checks[k]} onChange={(e) => setF({ ...f, checks: { ...f.checks, [k]: e.target.checked } })} />{l}</label>)}</div>
        </div>
        <Field label="Existing scratches or damage" className="full"><textarea rows={3} value={f.damage} onChange={(e) => setF({ ...f, damage: e.target.value })} placeholder="e.g. Small scratch on rear bumper, left side" /></Field>
        <div className="field full"><span className="field-label">Condition photos</span><ImageUploader multiple value={f.photos} onChange={(x) => setF({ ...f, photos: x })} label="Add photos of all sides" /></div>
        {booking.mode === 'self' && <label className="check full"><input type="checkbox" checked={f.idChecked} onChange={(e) => setF({ ...f, idChecked: e.target.checked })} />I checked the driving licence, IDP or recognition permit, and passport</label>}
        {booking.deposit > 0 && <label className="check full"><input type="checkbox" checked={f.depositTaken} onChange={(e) => setF({ ...f, depositTaken: e.target.checked })} />Security deposit of {money(booking.deposit)} collected</label>}
      </div>
    </Modal>
  );
}

/** Check-in: record the car's condition on return and work out any extra charges. */
export function ReturnModal({ booking, onClose }) {
  const { vehicles, settings } = useDB();
  const { user } = useAuth();
  const toast = useToast();
  const v = vehicles.find((x) => x.id === booking.vehicleId);
  const out = booking.checkout || {};
  const [f, setF] = useState({ at: toLocalInput(new Date()), odometer: '', fuel: out.fuel ?? 4, damage: '', damageCharge: 0, cleaning: false, photos: [], other: 0, otherLabel: '' });

  const calc = useMemo(() => {
    const lines = [];
    const driven = f.odometer && out.odometer ? +f.odometer - out.odometer : 0;
    const allowance = (v?.kmPerDay || 0) * (booking.days || 1);
    if (booking.mode === 'self' && driven > allowance) lines.push({ label: `Extra kilometres: ${driven - allowance} km × ${v.extraKmRate}`, amount: (driven - allowance) * v.extraKmRate });
    const lateH = Math.ceil((new Date(f.at) - new Date(booking.dropoffAt)) / 3600000);
    if (lateH > 1) lines.push({ label: `Late return: ${lateH} hours`, amount: Math.min(lateH * (settings.lateFeePerHour || 0), Math.ceil(lateH / 24) * (v?.dailyRate || 0)) });
    if (booking.mode === 'self' && out.fuel != null && f.fuel < out.fuel) lines.push({ label: `Fuel: returned ${FUEL[f.fuel]}, collected ${FUEL[out.fuel]}`, amount: (out.fuel - f.fuel) * (settings.fuelChargePerQuarter || 0) });
    if (f.cleaning) lines.push({ label: 'Cleaning fee', amount: settings.cleaningFee || 0 });
    if (+f.damageCharge > 0) lines.push({ label: `Damage: ${f.damage || 'see notes'}`, amount: +f.damageCharge });
    if (+f.other > 0) lines.push({ label: f.otherLabel || 'Other charge (e.g. traffic fine)', amount: +f.other });
    return { lines, driven, allowance, extra: lines.reduce((s, l) => s + l.amount, 0) };
  }, [f, out, v, booking, settings]);

  const newTotal = (booking.total || 0) + calc.extra;
  const balance = newTotal - (booking.amountPaid || 0);
  const depositUse = booking.depositStatus === 'held' ? Math.min(booking.deposit, Math.max(0, balance)) : 0;

  const save = () => {
    if (!f.odometer) return toast('Enter the odometer reading.', 'error');
    if (out.odometer && +f.odometer < out.odometer) return toast('Return odometer is lower than at handover.', 'error');
    const checkin = { ...f, at: new Date(f.at).toISOString(), odometer: +f.odometer, driven: calc.driven, by: user.name };
    db.update('bookings', booking.id, (b) => {
      const payments = [...(b.payments || [])];
      let paid = b.amountPaid || 0;
      if (depositUse > 0) { payments.push({ id: `pay-${Date.now()}`, at: new Date().toISOString(), amount: depositUse, method: 'pickup', by: user.name, note: 'Taken from security deposit' }); paid += depositUse; }
      return {
        status: 'completed', checkin, charges: calc.lines,
        lines: [...(b.lines || []), ...calc.lines], total: newTotal, amountPaid: paid, payments,
        paymentStatus: paid >= newTotal ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
        depositStatus: b.depositStatus === 'held' ? (depositUse > 0 ? (depositUse >= b.deposit ? 'kept' : 'part-returned') : 'returned') : b.depositStatus,
        depositDeducted: depositUse,
        history: [...(b.history || []), { at: new Date().toISOString(), text: `Car returned at ${(+f.odometer).toLocaleString()} km (${calc.driven} km driven)${calc.extra ? `, extra charges ${money(calc.extra)}` : ''}${depositUse ? `, ${money(depositUse)} kept from deposit` : ''} (${user.name})` }],
      };
    });
    if (v) db.update('vehicles', v.id, { mileage: +f.odometer });
    if (booking.userId) db.notify(booking.userId, 'Thanks for renting with us', 'Your rental is complete. We’d love a review of the car.', '/account/bookings');
    toast('Car received. Booking completed.');
    onClose();
  };

  return (
    <Modal title={`Receive ${v?.name} back (${booking.ref})`} onClose={onClose} size="lg"
      footer={<><span className="push small muted">Extra charges: <b>{money(calc.extra)}</b></span><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn dark" onClick={save}>Complete return</button></>}>
      {booking.checkout ? <p className="notice info">Handed over {fmtDate(out.at, true)} at {out.odometer?.toLocaleString()} km with fuel {FUEL[out.fuel]}.{out.damage ? ` Noted: ${out.damage}` : ''}</p>
        : <p className="notice warn">No handover record for this booking, so extra km and fuel can’t be worked out automatically.</p>}
      <div className="form-grid">
        <Field label="Return time" hint={`Due ${fmtDate(booking.dropoffAt, true)}`}><input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></Field>
        <Field label="Odometer (km)" hint={calc.driven ? `${calc.driven} km driven, ${calc.allowance} km included` : ''}><input type="number" min={0} value={f.odometer} onChange={(e) => setF({ ...f, odometer: e.target.value })} /></Field>
        <div className="field full"><span className="field-label">Fuel level</span><FuelPicker value={f.fuel} onChange={(x) => setF({ ...f, fuel: x })} /></div>
        <Field label="New damage found" className="full"><textarea rows={2} value={f.damage} onChange={(e) => setF({ ...f, damage: e.target.value })} placeholder="Leave empty if none" /></Field>
        <Field label="Damage charge (LKR)"><input type="number" min={0} value={f.damageCharge} onChange={(e) => setF({ ...f, damageCharge: e.target.value })} /></Field>
        <div className="field"><span className="field-label">Cleaning</span><label className="check"><input type="checkbox" checked={f.cleaning} onChange={(e) => setF({ ...f, cleaning: e.target.checked })} />Charge cleaning fee ({money(settings.cleaningFee)})</label></div>
        <Field label="Other charge label"><input value={f.otherLabel} onChange={(e) => setF({ ...f, otherLabel: e.target.value })} placeholder="Traffic fine, lost key…" /></Field>
        <Field label="Other charge (LKR)"><input type="number" min={0} value={f.other} onChange={(e) => setF({ ...f, other: e.target.value })} /></Field>
        <div className="field full"><span className="field-label">Return photos</span><ImageUploader multiple value={f.photos} onChange={(x) => setF({ ...f, photos: x })} label="Add photos" /></div>
      </div>
      <div className="quote" style={{ marginTop: 16 }}>
        {calc.lines.length ? calc.lines.map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>) : <div className="q-line"><span>No extra charges</span><span>—</span></div>}
        <div className="q-total"><span>New total</span><span>{money(newTotal)}</span></div>
        <div className="q-line"><span>Already paid</span><span>{money(booking.amountPaid || 0)}</span></div>
        {booking.depositStatus === 'held' && <div className="q-line"><span>Deposit held</span><span>{money(booking.deposit)}</span></div>}
        {depositUse > 0 && <div className="q-line"><span>Kept from deposit</span><span>{money(depositUse)}</span></div>}
        {booking.depositStatus === 'held' && <div className="q-line"><b>Return to customer</b><b>{money(booking.deposit - depositUse)}</b></div>}
        <div className="q-line"><b>Still to collect</b><b>{money(Math.max(0, balance - depositUse))}</b></div>
      </div>
    </Modal>
  );
}
