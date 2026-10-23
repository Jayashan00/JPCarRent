import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useDB } from '../../lib/db';
import { VehicleCard } from '../../components/site';
import { Empty } from '../../components/ui';
export default function Favorites() {
  const { user } = useAuth();
  const { vehicles } = useDB();
  const list = vehicles.filter((v) => user.favorites?.includes(v.id));
  return (
    <>
      <h1 className="acc-title">Saved cars</h1>
      {list.length ? <div className="fleet-grid two">{list.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</div>
        : <div className="card"><Empty icon="Heart" title="No saved cars yet" text="Tap the heart on any car to keep it here for later." action={<Link to="/fleet" className="btn primary">Browse the fleet</Link>} /></div>}
    </>
  );
}
