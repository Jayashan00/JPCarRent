import ResourceManager from './ResourceManager';
import { db, useDB } from '../../lib/db';
import { Badge, Toggle, Avatar, Stars, DynIcon } from '../../components/ui';
import { money, fmtDate } from '../../lib/utils';
import { SafeImg } from '../../components/site';

const ActiveToggle = ({ col, r }) => (
  <span onClick={(e) => e.stopPropagation()}><Toggle checked={r.active} onChange={(x) => db.update(col, r.id, { active: x })} label={r.active ? 'On' : 'Off'} /></span>
);
const Thumb = ({ src }) => <SafeImg src={src} alt="" className="cell-thumb" />;

export function Categories() {
  const { vehicles } = useDB();
  return (
    <ResourceManager title="Categories" singular="category" collection="categories" prefix="cat" sortable
      intro="Vehicle types shown as filters on the website."
      fields={[{ key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea', rows: 2 }]}
      columns={[{ key: 'name', label: 'Name', render: (r) => <b>{r.name}</b> }, { key: 'description', label: 'Description' }, { label: 'Vehicles', render: (r) => vehicles.filter((v) => v.categoryId === r.id).length }]} />
  );
}

export function Extras() {
  return (
    <ResourceManager title="Extras & add-ons" singular="extra" collection="extras" prefix="ext" sortable defaults={{ per: 'day', active: true, price: 0 }}
      intro="Optional items customers can add at checkout."
      fields={[
        { key: 'name', label: 'Name', required: true }, { key: 'price', label: 'Price (LKR)', type: 'number', required: true, min: 0 },
        { key: 'per', label: 'Charged', type: 'select', options: [{ value: 'day', label: 'Per day' }, { value: 'trip', label: 'Once per rental' }] },
        { key: 'active', label: 'Show at checkout', type: 'toggle' }, { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
      ]}
      columns={[{ key: 'name', label: 'Name', render: (r) => <><b>{r.name}</b><div className="small muted">{r.description}</div></> }, { label: 'Price', render: (r) => `${money(r.price)} ${r.per === 'day' ? '/ day' : '/ rental'}` }, { label: 'Active', clickToEdit: false, render: (r) => <ActiveToggle col="extras" r={r} /> }]} />
  );
}

export function Locations() {
  return (
    <ResourceManager title="Pickup & return locations" singular="location" collection="locations" prefix="loc" sortable defaults={{ type: 'area', fee: 0, active: true }}
      intro="Places customers can choose for pickup and return, with any delivery fee."
      fields={[
        { key: 'name', label: 'Name', required: true }, { key: 'type', label: 'Type', type: 'select', options: ['office', 'hotel', 'station', 'airport', 'city', 'area'] },
        { key: 'fee', label: 'Delivery or collection fee (LKR)', type: 'number', min: 0 }, { key: 'active', label: 'Available', type: 'toggle' },
        { key: 'address', label: 'Address or notes', type: 'textarea', rows: 2 },
      ]}
      filters={[{ key: 'type', label: 'Type', options: ['office', 'hotel', 'station', 'airport', 'city', 'area'] }]}
      columns={[{ key: 'name', label: 'Name', render: (r) => <b>{r.name}</b> }, { key: 'type', label: 'Type', render: (r) => <Badge tone="s-read">{r.type}</Badge> }, { label: 'Fee', render: (r) => (r.fee ? money(r.fee) : 'Free') }, { label: 'Active', clickToEdit: false, render: (r) => <ActiveToggle col="locations" r={r} /> }]} />
  );
}

export function Promos() {
  return (
    <ResourceManager title="Promo codes" singular="promo code" collection="promos" prefix="promo" searchKeys={['code', 'description']} defaults={{ type: 'percent', value: 10, minDays: 1, active: true, uses: 0 }}
      intro="Discount codes customers can enter at checkout."
      onBeforeSave={(v) => ({ ...v, code: String(v.code).toUpperCase().replace(/\s/g, '') })}
      fields={[
        { key: 'code', label: 'Code', required: true, placeholder: 'SUMMER10', validate: (v, all) => db.all('promos').some((p) => p.code === String(v).toUpperCase() && p.id !== all.id) ? 'This code already exists.' : '' },
        { key: 'type', label: 'Discount type', type: 'select', options: [{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount (LKR)' }] },
        { key: 'value', label: 'Discount value', type: 'number', required: true, min: 0, validate: (v, all) => (all.type === 'percent' && v > 100 ? 'A percentage can’t be over 100.' : '') },
        { key: 'minDays', label: 'Minimum rental days', type: 'number', min: 1 },
        { key: 'expires', label: 'Expires on', type: 'date' }, { key: 'active', label: 'Active', type: 'toggle' },
        { key: 'description', label: 'Description (shown to customer)', full: true },
      ]}
      columns={[
        { key: 'code', label: 'Code', render: (r) => <code className="code">{r.code}</code> },
        { label: 'Discount', render: (r) => (r.type === 'percent' ? `${r.value}%` : money(r.value)) },
        { label: 'Min days', key: 'minDays' }, { label: 'Expires', render: (r) => (r.expires ? fmtDate(r.expires) : 'Never') },
        { label: 'Used', key: 'uses' }, { label: 'Active', clickToEdit: false, render: (r) => <ActiveToggle col="promos" r={r} /> },
      ]} />
  );
}

export function Maintenance() {
  const { vehicles } = useDB();
  const opts = () => db.all('vehicles').map((v) => ({ value: v.id, label: `${v.name} (${v.plate})` }));
  return (
    <ResourceManager title="Maintenance & renewals" singular="record" collection="maintenance" prefix="mnt" searchKeys={['type', 'description']}
      defaults={{ status: 'scheduled', type: 'Service', date: new Date().toISOString().slice(0, 10), cost: 0, vehicleId: vehicles[0]?.id }}
      intro="Servicing, repairs, insurance and licence renewals for every vehicle."
      filters={[{ key: 'vehicleId', label: 'Vehicle', options: opts }, { key: 'status', label: 'Status', options: ['scheduled', 'in-progress', 'done'] }]}
      fields={[
        { key: 'vehicleId', label: 'Vehicle', type: 'select', options: opts, required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['Service', 'Oil change', 'Tyres', 'Repair', 'Insurance renewal', 'Revenue licence', 'Emission test', 'Cleaning', 'Other'] },
        { key: 'date', label: 'Start date', type: 'date', required: true }, { key: 'endDate', label: 'End date', type: 'date', hint: 'Leave empty for a single day.' },
        { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'done'] },
        { key: 'blocks', label: 'Block bookings for these dates', type: 'toggle', hint: 'Customers can’t book the car while it’s in the workshop.' },
        { key: 'cost', label: 'Cost (LKR)', type: 'number', min: 0 }, { key: 'mileage', label: 'Odometer (km)', type: 'number', min: 0 },
        { key: 'nextDue', label: 'Next due', type: 'date' }, { key: 'description', label: 'Details', type: 'textarea', rows: 3 },
      ]}
      columns={[
        { label: 'Vehicle', render: (r) => <b>{vehicles.find((v) => v.id === r.vehicleId)?.name || 'Removed vehicle'}</b> },
        { key: 'type', label: 'Type' }, { label: 'Date', render: (r) => fmtDate(r.date) }, { label: 'Cost', render: (r) => money(r.cost) },
        { label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> }, { label: 'Next due', render: (r) => (r.nextDue ? fmtDate(r.nextDue) : '—') },
      ]} />
  );
}

export function Drivers() {
  return (
    <ResourceManager title="Drivers" singular="driver" collection="drivers" prefix="drv" searchKeys={['name', 'phone', 'languages']} defaults={{ status: 'available', rating: 5, experience: 1 }}
      intro="Chauffeurs you can assign to bookings. Shown on the About page."
      filters={[{ key: 'status', label: 'Status', options: ['available', 'on-trip', 'off'] }]}
      fields={[
        { key: 'photo', label: 'Photo', type: 'image', aspect: 'square' },
        { key: 'name', label: 'Full name', required: true }, { key: 'phone', label: 'Phone', required: true },
        { key: 'languages', label: 'Languages' }, { key: 'experience', label: 'Years of experience', type: 'number', min: 0 },
        { key: 'licenseNo', label: 'Licence number' }, { key: 'status', label: 'Status', type: 'select', options: ['available', 'on-trip', 'off'] },
        { key: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, step: 0.1 }, { key: 'bio', label: 'Short bio', type: 'textarea', rows: 2 },
      ]}
      columns={[
        { label: 'Driver', render: (r) => <div className="cell-user">{r.photo ? <img src={r.photo} alt="" className="avatar" style={{ width: 36, height: 36 }} /> : <Avatar user={r} />}<div><b>{r.name}</b><span>{r.phone}</span></div></div> },
        { key: 'languages', label: 'Languages' }, { label: 'Experience', render: (r) => `${r.experience} yrs` },
        { label: 'Rating', render: (r) => <Stars value={r.rating} size={13} /> }, { label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
      ]} />
  );
}

export function ServicesAdmin() {
  return (
    <ResourceManager title="Services" singular="service" collection="services" prefix="svc" searchKeys={['title', 'text']} sortable defaults={{ icon: 'Car', active: true }}
      intro="Shown on the Services page."
      fields={[
        { key: 'title', label: 'Title', required: true }, { key: 'unit', label: 'Price label', placeholder: 'per day' },
        { key: 'priceFrom', label: 'Price from (LKR)', type: 'number', min: 0 }, { key: 'active', label: 'Visible', type: 'toggle' },
        { key: 'text', label: 'Description', type: 'textarea', rows: 3 }, { key: 'icon', label: 'Icon', type: 'icon' },
      ]}
      columns={[{ label: 'Service', render: (r) => <div className="cell-user"><span className="cell-ic"><DynIcon name={r.icon} size={18} /></span><b>{r.title}</b></div> }, { label: 'From', render: (r) => `${money(r.priceFrom)} ${r.unit || ''}` }, { label: 'Visible', clickToEdit: false, render: (r) => <ActiveToggle col="services" r={r} /> }]} />
  );
}

export function Tours() {
  return (
    <ResourceManager title="Routes & transfers" singular="route" collection="tours" prefix="tour" searchKeys={['title', 'destination']} sortable defaults={{ from: 'Kandy', active: true, highlights: [] }}
      intro="Fixed-price drives shown on the home page and the Routes page."
      fields={[
        { key: 'title', label: 'Title', required: true, placeholder: 'Kandy to Ella' }, { key: 'from', label: 'From', required: true },
        { key: 'destination', label: 'Destination (on the sign)', required: true }, { key: 'distanceKm', label: 'Distance (km)', type: 'number', min: 0 },
        { key: 'duration', label: 'Drive time', placeholder: '4 h 30 min' }, { key: 'price', label: 'Price per car (LKR)', type: 'number', min: 0, required: true },
        { key: 'active', label: 'Visible', type: 'toggle' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { key: 'highlights', label: 'Highlights', type: 'tags' }, { key: 'image', label: 'Photo', type: 'image' },
      ]}
      columns={[{ label: 'Route', render: (r) => <div className="cell-user"><Thumb src={r.image} /><div><b>{r.title}</b><span>{r.distanceKm} km, {r.duration}</span></div></div> }, { label: 'Price', render: (r) => money(r.price) }, { label: 'Visible', clickToEdit: false, render: (r) => <ActiveToggle col="tours" r={r} /> }]} />
  );
}

export function WhyUs() {
  return (
    <ResourceManager title="Why choose us" singular="point" collection="whyUs" prefix="why" searchKeys={['title']} sortable defaults={{ icon: 'ShieldCheck' }}
      intro="The reasons listed on the home and About pages."
      fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'text', label: 'Text', type: 'textarea', rows: 3 }, { key: 'icon', label: 'Icon', type: 'icon' }]}
      columns={[{ label: 'Point', render: (r) => <div className="cell-user"><span className="cell-ic"><DynIcon name={r.icon} size={18} /></span><div><b>{r.title}</b><span>{r.text}</span></div></div> }]} />
  );
}

export function Steps() {
  return (
    <ResourceManager title="How it works" singular="step" collection="steps" prefix="step" searchKeys={['title']} sortable
      intro="The numbered booking steps on the home page. Use the arrows to change the order."
      fields={[{ key: 'title', label: 'Title', required: true, full: true }, { key: 'text', label: 'Text', type: 'textarea', rows: 3 }]}
      columns={[{ label: 'Step', render: (r) => <div><b>{r.title}</b><div className="small muted">{r.text}</div></div> }]} />
  );
}

export function Destinations() {
  return (
    <ResourceManager title="Destinations gallery" singular="destination" collection="destinations" prefix="dst" searchKeys={['title']} sortable
      intro="The photo mosaic on the home page. The first photo is shown largest."
      fields={[{ key: 'title', label: 'Title', required: true }, { key: 'text', label: 'Caption' }, { key: 'image', label: 'Photo', type: 'image' }]}
      columns={[{ label: 'Destination', render: (r) => <div className="cell-user"><Thumb src={r.image} /><div><b>{r.title}</b><span>{r.text}</span></div></div> }]} />
  );
}

export function Faqs() {
  const cats = () => [...new Set(db.all('faqs').map((f) => f.category).filter(Boolean))];
  return (
    <ResourceManager title="FAQ" singular="question" collection="faqs" prefix="faq" searchKeys={['question', 'answer']} sortable defaults={{ category: 'Booking' }}
      intro="Questions shown on the FAQ page. The first five also appear on the home page."
      filters={[{ key: 'category', label: 'Category', options: cats }]}
      fields={[{ key: 'question', label: 'Question', required: true, full: true }, { key: 'category', label: 'Category', placeholder: 'Booking, Licences, Payments…' }, { key: 'answer', label: 'Answer', type: 'textarea', required: true, rows: 5 }]}
      columns={[{ label: 'Question', render: (r) => <b>{r.question}</b> }, { key: 'category', label: 'Category' }]} />
  );
}

export function Pages() {
  return (
    <ResourceManager title="Pages" singular="page" collection="pages" searchKeys={['title', 'body']} canCreate={false} canDelete={false}
      intro="Text for About, Terms, Privacy and Cancellation. Leave a blank line between paragraphs."
      fields={[{ key: 'title', label: 'Page title', required: true, full: true }, { key: 'body', label: 'Content', type: 'textarea', rows: 16, required: true }]}
      columns={[{ label: 'Page', render: (r) => <b>{r.title}</b> }, { label: 'Address', render: (r) => <code className="code">/{r.id}</code> }, { label: 'Updated', render: (r) => fmtDate(r.updatedAt || r.createdAt) }]} />
  );
}

export function Seasons() {
  return (
    <ResourceManager title="Seasonal prices" singular="season" collection="seasons" prefix="sea" searchKeys={['name', 'note']}
      intro="Raise or lower daily rates for date ranges such as peak season or the Kandy Perahera. Use a negative number for a discount."
      defaults={{ percent: 15, active: true }}
      fields={[
        { key: 'name', label: 'Name', required: true, placeholder: 'Peak season' },
        { key: 'percent', label: 'Price change (%)', type: 'number', required: true, hint: 'e.g. 20 for +20%, −10 for a 10% discount', validate: (v) => (v < -90 || v > 300 ? 'Use a value between −90 and 300.' : '') },
        { key: 'start', label: 'From', type: 'date', required: true }, { key: 'end', label: 'To', type: 'date', required: true, validate: (v, all) => (all.start && v < all.start ? 'End must be after the start.' : '') },
        { key: 'active', label: 'Active', type: 'toggle' }, { key: 'note', label: 'Note', full: true },
      ]}
      columns={[
        { label: 'Season', render: (r) => <><b>{r.name}</b><div className="small muted">{r.note}</div></> },
        { label: 'Dates', render: (r) => `${fmtDate(r.start)} – ${fmtDate(r.end)}` },
        { label: 'Change', render: (r) => <Badge tone={r.percent >= 0 ? 's-pending' : 's-completed'}>{r.percent > 0 ? '+' : ''}{r.percent}%</Badge> },
        { label: 'Active', clickToEdit: false, render: (r) => <ActiveToggle col="seasons" r={r} /> },
      ]} />
  );
}
