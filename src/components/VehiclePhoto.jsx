import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

/** Shows a vehicle's photos in order; if one fails to load it tries the next. */
export function VehiclePhoto({ vehicle, index = 0, className = '' }) {
  const list = (vehicle?.images || []).slice(index).concat((vehicle?.images || []).slice(0, index));
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [vehicle?.id, index, list.length]);
  const src = list[i];
  if (!src) {
    return (
      <div className={`photo-missing ${className}`} role="img" aria-label={`${vehicle?.name || 'Vehicle'} photo coming soon`}>
        <Camera size={26} />
        <span>{vehicle?.name}</span>
      </div>
    );
  }
  return <img className={`vphoto ${className}`} src={src} alt={vehicle.name} loading="lazy" onError={() => setI((x) => x + 1)} />;
}

export default VehiclePhoto;
