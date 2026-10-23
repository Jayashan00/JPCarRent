import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, Tag, Banknote, CreditCard, Landmark, Lock } from 'lucide-react';
import { db, useDB } from '../../lib/db';
import { useAuth } from '../../lib/auth';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { Field, ImageUploader, useToast } from '../../components/ui';
import { money, moneyBase, fx, usd, quote, defaultDates, isVehicleFree, fmtDate, promoError, rentalDays, cx, uid, resolvePlace } from '../../lib/utils';
import PlaceInput from '../../components/PlaceInput';
import NotFound from './NotFound';

const STEPS = ['Trip', 'Extras', 'Your details', 'Confirm'];

export default function Checkout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { vehicles, extras, locations, bookings, settings, promos, maintenance, seasons } = useDB();
  const { user, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const v = vehicles.find((x) => x.id === id);
  const d = defaultDates();

  const [step, setStep] = useState(0);
  const [trip, setTrip] = useState({
    pickupAt: params.get('pickupAt') || d.pickupAt, dropoffAt: params.get('dropoffAt') || d.dropoffAt,
    pickup: resolvePlace(params.get('pickup'), locations)?.name || 'JP Rent A Car office, Kandy', dropoff: resolvePlace(params.get('dropoff') || params.get('pickup'), locations)?.name || 'JP Rent A Car office, Kandy',
    mode: params.get('mode') || (v && !v.selfDrive ? 'driver' : 'self'), flightNo: '', passengers: 2,
  });
  const [chosen, setChosen] = useState([]);
  const [me, setMe] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '', country: user?.country || '',
    licenseNo: user?.licenseNo || '', passportNo: user?.passportNo || '', licenseImage: '', notes: '', createAccount: !user, password: '',
  });
  const [pay, setPay] = useState({ method: 'pickup', promo: '', promoApplied: null, terms: false });
  const [promoMsg, setPromoMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const q = useMemo(() => v && quote({
    vehicle: v, pickupAt: trip.pickupAt, dropoffAt: trip.dropoffAt, mode: trip.mode, extras: chosen, allExtras: extras,
    pickupLocation: resolvePlace(trip.pickup, locations), dropoffLocation: resolvePlace(trip.dropoff, locations),
    promo: pay.promoApplied, taxPercent: settings.taxPercent, seasons,
  }), [v, trip, chosen, extras, locations, pay.promoApplied, settings, seasons]);

  if (!v) return <NotFound />;

  const pickupLoc = resolvePlace(trip.pickup, locations);
  const dropLoc = resolvePlace(trip.dropoff, locations);
  const free = isVehicleFree(v.id, trip.pickupAt, trip.dropoffAt, bookings, null, maintenance);
  const setT = (k) => (e) => setTrip({ ...trip, [k]: e.target.value });
  const setM = (k) => (e) => setMe({ ...me, [k]: e.target.value });

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (new Date(trip.dropoffAt) <= new Date(trip.pickupAt)) e.dropoffAt = 'Return must be after pickup.';
      if (new Date(trip.pickupAt) < new Date(Date.now() - 3600000)) e.pickupAt = 'Pickup can’t be in the past.';
      if (!free) e.dropoffAt = 'This car is already booked for part of these dates.';
      if (!trip.pickup.trim()) e.pickup = 'Enter where you’d like to collect the car.';
      if (!trip.dropoff.trim()) e.dropoff = 'Enter where you’ll return the car.';
    }
    if (s === 2) {
      if (!me.name.trim()) e.name = 'Enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(me.email)) e.email = 'Enter a valid email address.';
      if (me.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a phone or WhatsApp number.';
      if (!me.country.trim()) e.country = 'Enter your country.';
      if (trip.mode === 'self' && !me.licenseNo.trim()) e.licenseNo = 'Enter your driving licence number.';
      if (!user && me.createAccount && me.password.length < 6) e.password = 'Use at least 6 characters.';
    }
    if (s === 3 && !pay.terms) e.terms = 'Please accept the rental terms to continue.';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const next = () => { if (validate(step)) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };

  const applyPromo = () => {
    const p = promos.find((x) => x.code.toUpperCase() === pay.promo.trim().toUpperCase());
    const err = promoError(p, rentalDays(trip.pickupAt, trip.dropoffAt));
    if (err) { setPromoMsg(err); setPay({ ...pay, promoApplied: null }); }
    else { setPromoMsg(`${p.code} applied: ${p.description}`); setPay({ ...pay, promoApplied: p }); }
  };

  const submit = async () => {
    if (!validate(3) || !validate(0)) return;
    setBusy(true);
    try {
      let owner = user;
      if (!user && me.createAccount) {
        try { owner = register({ name: me.name, email: me.email, phone: me.phone, country: me.country, password: me.password }); }
        catch (err) { setErrors({ email: err.message }); setStep(2); setBusy(false); return; }
      }
      if (owner) db.update('users', owner.id, {
        licenseNo: me.licenseNo || owner.licenseNo, passportNo: me.passportNo || owner.passportNo, phone: me.phone || owner.phone,
        documents: me.licenseImage ? [...(owner.documents || []), { id: uid('doc'), type: 'Driving licence', name: 'licence.jpg', url: me.licenseImage, status: 'pending', uploadedAt: new Date().toISOString() }] : owner.documents,
      });
      const status = settings.bookingMode === 'instant' ? 'confirmed' : 'pending';
      const ref = db.nextBookingRef();
      const b = db.create('bookings', {
        ref, userId: owner?.id || null, vehicleId: v.id, pickupAt: new Date(trip.pickupAt).toISOString(), dropoffAt: new Date(trip.dropoffAt).toISOString(),
        pickupLocationId: pickupLoc?.id || null, dropoffLocationId: dropLoc?.id || null, pickupPlace: trip.pickup.trim(), dropoffPlace: trip.dropoff.trim(), mode: trip.mode, driverId: null, status,
        paymentStatus: 'unpaid', paymentMethod: pay.method, extras: chosen, promoCode: pay.promoApplied?.code || '',
        guest: owner ? null : { name: me.name, email: me.email, phone: me.phone, country: me.country },
        contact: { name: me.name, email: me.email, phone: me.phone, country: me.country, licenseNo: me.licenseNo, passportNo: me.passportNo },
        flightNo: trip.flightNo, passengers: +trip.passengers, notes: me.notes,
        total: q.total, deposit: q.deposit, lines: q.lines, discount: q.discount, tax: q.tax, days: q.days, amountPaid: 0,
        history: [{ at: new Date().toISOString(), text: status === 'confirmed' ? 'Booked online and confirmed automatically' : 'Booking request sent online' }],
      }, 'bk');
      if (pay.promoApplied) db.update('promos', pay.promoApplied.id, (p) => ({ uses: (p.uses || 0) + 1 }));
      db.notify('admin', 'New online booking', `${me.name} booked the ${v.name} (${ref}).`, '/admin/bookings');
      if (owner) db.notify(owner.id, status === 'confirmed' ? 'Booking confirmed' : 'Booking request received', `${v.name}, ${fmtDate(trip.pickupAt)} to ${fmtDate(trip.dropoffAt)} (${ref}).`, '/account/bookings');
      nav(`/booking/${b.ref}`);
    } catch (e) {
      toast(e.message || 'Something went wrong. Please try again.', 'error');
    }
    setBusy(false);
  };


  return (
    <div className="wrap checkout">
      <Link to={`/fleet/${v.id}`} className="back"><ChevronLeft size={18} />Back to {v.name}</Link>
      <h1 className="checkout-title">Book the {v.name}</h1>
      <ol className="stepper" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} className={cx(i === step && 'now', i < step && 'done')}>
            <button disabled={i > step} onClick={() => setStep(i)}><span>{i < step ? <Check size={14} /> : i + 1}</span>{s}</button>
          </li>
        ))}
      </ol>

      <div className="checkout-grid">
        <div className="card pad checkout-main">
          {step === 0 && (
            <>
              <h2 className="step-title">When and where</h2>
              {v.selfDrive && v.withDriver && (
                <div className="choice-row">
                  {[['self', 'Self-drive', 'You drive. Deposit applies.'], ['driver', 'With a driver', `+${money(v.driverRate)} per day, no deposit.`]].map(([k, t, s]) => (
                    <button key={k} type="button" className={cx('choice', trip.mode === k && 'on')} onClick={() => setTrip({ ...trip, mode: k })}><b>{t}</b><span>{s}</span></button>
                  ))}
                </div>
              )}
              <div className="form-grid">
                <Field label="Pickup date and time" error={errors.pickupAt}><input type="datetime-local" value={trip.pickupAt} onChange={setT('pickupAt')} /></Field>
                <Field label="Return date and time" error={errors.dropoffAt}><input type="datetime-local" value={trip.dropoffAt} onChange={setT('dropoffAt')} /></Field>
                <div className="field"><span className="field-label">Pickup location</span><PlaceInput value={trip.pickup} onChange={(v) => setTrip({ ...trip, pickup: v })} ariaLabel="Pickup location" invalid={errors.pickup} />{errors.pickup && <span className="field-error">{errors.pickup}</span>}<span className="field-hint">Any place in Sri Lanka: a hotel, address, station or airport.</span></div>
                <div className="field"><span className="field-label">Return location</span><PlaceInput value={trip.dropoff} onChange={(v) => setTrip({ ...trip, dropoff: v })} ariaLabel="Return location" invalid={errors.dropoff} />{errors.dropoff && <span className="field-error">{errors.dropoff}</span>}</div>
                {(pickupLoc?.custom || dropLoc?.custom) && <p className="notice info full">We’ll confirm any delivery charge for {[pickupLoc?.custom && pickupLoc.name, dropLoc?.custom && dropLoc.name].filter(Boolean).join(' and ')} by WhatsApp or email before you pay.</p>}
                {(pickupLoc?.type === 'airport' || dropLoc?.type === 'airport' || /airport|katunayake/i.test(trip.pickup + trip.dropoff)) && (
                  <Field label="Flight number" hint="We track your flight and wait if it’s delayed."><input value={trip.flightNo} onChange={setT('flightNo')} placeholder="e.g. UL 504" /></Field>
                )}
                <Field label="Number of passengers"><input type="number" min={1} max={v.seats} value={trip.passengers} onChange={setT('passengers')} /></Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="step-title">Add extras</h2>
              <p className="muted">Optional. You can also add these later on WhatsApp.</p>
              <div className="extras-list">
                {extras.filter((e) => e.active).map((e) => {
                  const on = chosen.includes(e.id);
                  return (
                    <label key={e.id} className={cx('extra', on && 'on')}>
                      <input type="checkbox" checked={on} onChange={() => setChosen(on ? chosen.filter((x) => x !== e.id) : [...chosen, e.id])} />
                      <div><b>{e.name}</b><span>{e.description}</span></div>
                      <span className="extra-price">{money(e.price)}<small>{e.per === 'day' ? 'per day' : 'per rental'}</small></span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="step-title">Your details</h2>
              {!user && <p className="muted">Already have an account? <Link to={`/login?next=${encodeURIComponent(`/book/${v.id}`)}`}>Sign in</Link> to fill this in automatically.</p>}
              <div className="form-grid">
                <Field label="Full name (as on licence)" error={errors.name}><input value={me.name} onChange={setM('name')} autoComplete="name" /></Field>
                <Field label="Email" error={errors.email}><input type="email" value={me.email} onChange={setM('email')} autoComplete="email" /></Field>
                <Field label="Phone or WhatsApp" error={errors.phone}><input type="tel" value={me.phone} onChange={setM('phone')} autoComplete="tel" placeholder="+44 7700 900123" /></Field>
                <Field label="Country of residence" error={errors.country}><input value={me.country} onChange={setM('country')} autoComplete="country-name" /></Field>
                {trip.mode === 'self' && <Field label="Driving licence number" error={errors.licenseNo}><input value={me.licenseNo} onChange={setM('licenseNo')} /></Field>}
                <Field label="Passport or NIC number" hint="Optional now, needed at pickup."><input value={me.passportNo} onChange={setM('passportNo')} /></Field>
                {trip.mode === 'self' && (
                  <div className="full">
                    <span className="field-label">Photo of your licence (optional)</span>
                    <p className="field-hint" style={{ margin: '4px 0 8px' }}>Uploading now speeds up the handover.</p>
                    <ImageUploader value={me.licenseImage} onChange={(x) => setMe({ ...me, licenseImage: x })} label="Upload licence photo" />
                  </div>
                )}
                <Field label="Anything we should know?" className="full"><textarea value={me.notes} onChange={setM('notes')} placeholder="Hotel name for delivery, child ages, route plans…" /></Field>
                {!user && (
                  <div className="full create-acc">
                    <label className="check"><input type="checkbox" checked={me.createAccount} onChange={(e) => setMe({ ...me, createAccount: e.target.checked })} />Create an account to manage this booking online</label>
                    {me.createAccount && <Field label="Choose a password" error={errors.password}><input type="password" value={me.password} onChange={setM('password')} autoComplete="new-password" /></Field>}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="step-title">How would you like to pay?</h2>
              <div className="pay-options">
                {[
                  ['pickup', Banknote, 'Pay on pickup', 'Cash (LKR, USD or EUR) or card when you collect the car.'],
                  ['bank', Landmark, 'Bank transfer', 'We’ll send bank details. Pay any time before pickup.'],
                  ['card', CreditCard, 'Card online', 'Secure card payment link sent after confirmation.'],
                ].map(([k, Ic, t, s]) => (
                  <label key={k} className={cx('choice pay', pay.method === k && 'on')}>
                    <input type="radio" name="pay" checked={pay.method === k} onChange={() => setPay({ ...pay, method: k })} />
                    <Ic size={22} /><b>{t}</b><span>{s}</span>
                  </label>
                ))}
              </div>
              {pay.method === 'bank' && <pre className="bank-box">{settings.bankDetails}</pre>}

              <div className="promo-row">
                <Field label="Promo code">
                  <div className="inline-input">
                    <input value={pay.promo} onChange={(e) => setPay({ ...pay, promo: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" />
                    <button className="btn ghost" type="button" onClick={applyPromo} disabled={!pay.promo}><Tag size={16} />Apply</button>
                  </div>
                </Field>
                {promoMsg && <p className={cx('small', pay.promoApplied ? 'ok-text' : 'err-text')}>{promoMsg}</p>}
              </div>

              <div className="review-box">
                <h3>Check your booking</h3>
                <dl className="kv">
                  <dt>Vehicle</dt><dd>{v.name} ({trip.mode === 'driver' ? 'with driver' : 'self-drive'})</dd>
                  <dt>Pickup</dt><dd>{fmtDate(trip.pickupAt, true)}, {pickupLoc?.name}</dd>
                  <dt>Return</dt><dd>{fmtDate(trip.dropoffAt, true)}, {dropLoc?.name}</dd>
                  <dt>Driver details</dt><dd>{me.name}, {me.email}, {me.phone}</dd>
                  {trip.flightNo && <><dt>Flight</dt><dd>{trip.flightNo}</dd></>}
                </dl>
              </div>
              <label className={cx('check terms', errors.terms && 'err')}>
                <input type="checkbox" checked={pay.terms} onChange={(e) => setPay({ ...pay, terms: e.target.checked })} />
                <span>I accept the <Link to="/terms" target="_blank">rental terms</Link> and <Link to="/cancellation" target="_blank">cancellation policy</Link>.</span>
              </label>
              {errors.terms && <p className="field-error">{errors.terms}</p>}
            </>
          )}

          <div className="step-nav">
            {step > 0 ? <button className="btn ghost" onClick={() => setStep(step - 1)}>Back</button> : <span />}
            {step < 3 ? <button className="btn dark lg" onClick={next}>Continue</button>
              : <button className="btn primary lg" onClick={submit} disabled={busy}><Lock size={16} />{settings.bookingMode === 'instant' ? 'Confirm booking' : 'Send booking request'}</button>}
          </div>
        </div>

        <aside className="card summary">
          <div className="summary-car">
            <VehiclePhoto vehicle={v} />
            <div><b>{v.name}</b><span className="muted small">{v.seats} seats, {v.transmission.toLowerCase()}</span></div>
          </div>
          <div className="summary-dates">
            <div><span>Pickup</span><b>{fmtDate(trip.pickupAt, true)}</b><small>{pickupLoc?.name}</small></div>
            <div><span>Return</span><b>{fmtDate(trip.dropoffAt, true)}</b><small>{dropLoc?.name}</small></div>
          </div>
          {q && q.days > 0 && (
            <div className="quote">
              {q.lines.map((l, i) => <div key={i} className="q-line"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
              {q.discount > 0 && <div className="q-line ok-text"><span>Discount ({pay.promoApplied.code})</span><span>− {money(q.discount)}</span></div>}
              {q.tax > 0 && <div className="q-line"><span>Tax ({settings.taxPercent}%)</span><span>{money(q.tax)}</span></div>}
              <div className="q-total"><span>Total</span><span>{money(q.total, settings.currency)}</span></div>
              {settings.showUsd && <div className="q-usd">{usd(q.total, settings.usdRate)}</div>}
              {q.deposit > 0 && <p className="small muted">Refundable deposit at pickup: {money(q.deposit)}</p>}
              {fx.display !== fx.base && <p className="small muted">Prices in {fx.display} are approximate. You pay {moneyBase(q.total)}.</p>}
            </div>
          )}
          {!free && <p className="notice warn">These dates clash with another booking.</p>}
        </aside>
      </div>
    </div>
  );
}
