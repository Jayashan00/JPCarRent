import { Check, EyeOff } from 'lucide-react';
import ResourceManager from './ResourceManager';
import { db, useDB } from '../../lib/db';
import { Stars, Badge } from '../../components/ui';
import { fmtDate } from '../../lib/utils';

export default function Reviews() {
  const { vehicles } = useDB();
  const vOpts = () => [{ value: '', label: 'Not linked to a car' }, ...db.all('vehicles').map((v) => ({ value: v.id, label: v.name }))];
  return (
    <ResourceManager title="Reviews" singular="review" collection="reviews" prefix="rev" searchKeys={['name', 'text', 'trip']}
      intro="Approve customer reviews before they appear, and add reviews from Google or TripAdvisor."
      defaults={{ rating: 5, source: 'google', status: 'approved', vehicleId: '' }}
      filters={[{ key: 'status', label: 'Status', options: ['approved', 'pending', 'hidden'] }, { key: 'source', label: 'Source', options: ['google', 'site', 'tripadvisor'] }]}
      extraActions={(r) => r.status !== 'approved'
        ? <button className="icon-btn ok" title="Approve" aria-label="Approve" onClick={() => db.update('reviews', r.id, { status: 'approved' })}><Check size={16} /></button>
        : <button className="icon-btn" title="Hide" aria-label="Hide" onClick={() => db.update('reviews', r.id, { status: 'hidden' })}><EyeOff size={16} /></button>}
      fields={[
        { key: 'name', label: 'Reviewer name', required: true }, { key: 'trip', label: 'Trip or label', placeholder: '10-day island rental' },
        { key: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, step: 1, required: true, validate: (v) => (v < 1 || v > 5 ? 'Choose 1 to 5.' : '') },
        { key: 'source', label: 'Source', type: 'select', options: [{ value: 'google', label: 'Google' }, { value: 'tripadvisor', label: 'TripAdvisor' }, { value: 'site', label: 'This website' }] },
        { key: 'status', label: 'Status', type: 'select', options: ['approved', 'pending', 'hidden'] },
        { key: 'vehicleId', label: 'Vehicle', type: 'select', options: vOpts },
        { key: 'text', label: 'Review', type: 'textarea', required: true, rows: 4 },
      ]}
      columns={[
        { label: 'Review', render: (r) => <div className="cell-review"><b>{r.name}</b> <Stars value={r.rating} size={12} /><p>{r.text}</p></div> },
        { label: 'Car', render: (r) => vehicles.find((v) => v.id === r.vehicleId)?.name || '—' },
        { label: 'Source', render: (r) => r.source }, { label: 'Date', render: (r) => fmtDate(r.createdAt) },
        { label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
      ]} />
  );
}
