import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import ResourceManager from './ResourceManager';
import { db, useDB } from '../../lib/db';
import { VehiclePhoto } from '../../components/VehiclePhoto';
import { money } from '../../lib/utils';

export default function Vehicles() {
  const { categories, bookings } = useDB();
  const [params] = useSearchParams();
  const catOpts = () => db.all('categories').map((c) => ({ value: c.id, label: c.name }));
  const trips = (id) => bookings.filter((b) => b.vehicleId === id && b.status !== 'cancelled').length;

  const fields = [
    { key: 'images', label: 'Photos', type: 'images', hint: 'Upload photos of this exact car. The first photo is the cover; drag or use the arrows to reorder. The sample photos are of the same model from Wikimedia Commons — replace them with your own when you can.' },
    { key: 'photoCredit', label: 'Photo credit', full: true, hint: 'Needed only for photos you didn’t take. Clear it when you upload your own.' },
    { key: 'name', label: 'Display name', required: true, placeholder: 'Toyota Prius' },
    { key: 'categoryId', label: 'Category', type: 'select', options: catOpts, required: true },
    { key: 'make', label: 'Make', placeholder: 'Toyota' }, { key: 'model', label: 'Model / grade', placeholder: 'Prius S' },
    { key: 'year', label: 'Year', type: 'number', min: 1990 }, { key: 'plate', label: 'Number plate', required: true, validate: (v, all) => db.all('vehicles').some((x) => x.plate === v && x.id !== all.id) ? 'Another vehicle has this plate.' : '' },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'available', label: 'Available' }, { value: 'maintenance', label: 'In maintenance' }, { value: 'unavailable', label: 'Unavailable (hidden from booking)' }] },
    { key: 'featured', label: 'Featured on home page', type: 'toggle' },
    { key: 'seats', label: 'Seats', type: 'number', min: 1, required: true }, { key: 'doors', label: 'Doors', type: 'number', min: 2 },
    { key: 'bags', label: 'Large bags', type: 'number', min: 0 }, { key: 'transmission', label: 'Gearbox', type: 'select', options: ['Automatic', 'Manual'] },
    { key: 'fuel', label: 'Fuel', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] }, { key: 'mileage', label: 'Odometer (km)', type: 'number', min: 0 },
    { key: 'dailyRate', label: 'Daily rate (LKR)', type: 'number', min: 0, required: true }, { key: 'weeklyRate', label: 'Weekly rate (LKR, 7+ days)', type: 'number', min: 0, hint: 'Leave 0 to use the daily rate.' },
    { key: 'monthlyRate', label: 'Monthly rate (LKR, 30+ days)', type: 'number', min: 0 }, { key: 'driverRate', label: 'Driver fee per day (LKR)', type: 'number', min: 0 },
    { key: 'deposit', label: 'Security deposit (LKR)', type: 'number', min: 0 }, { key: 'kmPerDay', label: 'Free km per day', type: 'number', min: 0 },
    { key: 'extraKmRate', label: 'Extra km rate (LKR)', type: 'number', min: 0 },
    { key: 'selfDrive', label: 'Offer as self-drive', type: 'toggle' }, { key: 'withDriver', label: 'Offer with a driver', type: 'toggle' },
    { key: 'colour', label: 'Colour', placeholder: 'e.g. Pearl white' },
    { key: 'description', label: 'Description', type: 'textarea', rows: 3, required: true },
    { key: 'features', label: 'Features', type: 'tags', placeholder: 'e.g. Reverse camera, then press Enter' },
  ];

  return (
    <ResourceManager title="Vehicles" singular="vehicle" collection="vehicles" prefix="veh" searchKeys={['name', 'plate', 'make', 'model']} modalSize="xl" startNew={params.get('new') === '1'}
      intro="Add, edit and price every car in the fleet. Changes appear on the website straight away."
      defaults={{ status: 'available', featured: false, seats: 5, doors: 5, bags: 2, transmission: 'Automatic', fuel: 'Petrol', dailyRate: 10000, weeklyRate: 0, monthlyRate: 0, driverRate: 4000, deposit: 30000, kmPerDay: 150, extraKmRate: 40, selfDrive: true, withDriver: true, images: [], photoCredit: '', features: ['Air conditioning', 'Bluetooth audio'], year: new Date().getFullYear() - 5, categoryId: categories[0]?.id }}
      filters={[{ key: 'categoryId', label: 'Category', options: catOpts }, { key: 'status', label: 'Status', options: ['available', 'maintenance', 'unavailable'] }]}
      extraActions={(r) => <Link to={`/fleet/${r.id}`} target="_blank" className="icon-btn" aria-label="View on website" onClick={(e) => e.stopPropagation()}><ExternalLink size={16} /></Link>}
      fields={fields}
      columns={[
        { label: 'Vehicle', render: (r) => <div className="cell-user"><div className="cell-car"><VehiclePhoto vehicle={r} /></div><div><b>{r.name}</b><span>{r.plate}, {r.year}</span></div></div> },
        { label: 'Category', render: (r) => categories.find((c) => c.id === r.categoryId)?.name || '—' },
        { label: 'Daily rate', render: (r) => money(r.dailyRate) },
        { label: 'Photos', render: (r) => r.images?.length || 0 },
        { label: 'Bookings', render: (r) => trips(r.id) },
        { label: 'Status', clickToEdit: false, render: (r) => (
          <select className={`input slim status-select s-${r.status}`} value={r.status} onChange={(e) => db.update('vehicles', r.id, { status: e.target.value })} onClick={(e) => e.stopPropagation()} aria-label="Status">
            <option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option>
          </select>) },
        { label: 'Featured', render: (r) => (r.featured ? 'Yes' : '—') },
      ]} />
  );
}
