import { useDB } from '../../lib/db';
import { PageHero } from '../../components/site';
import { PLACE_PHOTOS, commons, commonsPage } from '../../data/seed';

/** Photo credits — the sample photos come from Wikimedia Commons under free licences. */
export default function Credits() {
  const { vehicles } = useDB();
  const cars = vehicles.filter((v) => v.photoCredit);
  return (
    <>
      <PageHero title="Photo credits" text="Place photos and sample car photos are from Wikimedia Commons, used under their free licences. Click a photo to see its author and licence." />
      <div className="wrap section-sm">
        <h2 className="credits-h">Places</h2>
        <div className="credits">
          {Object.values(PLACE_PHOTOS).map((p) => (
            <a key={p.file} className="credit" href={commonsPage(p.file)} target="_blank" rel="noreferrer">
              <img src={commons(p.file, 500)} alt={p.title} loading="lazy" />
              <span><b>{p.title}</b><small>{p.by ? `${p.by}, ` : ''}Wikimedia Commons</small></span>
            </a>
          ))}
        </div>
        {cars.length > 0 && <>
          <h2 className="credits-h">Vehicles</h2>
          <div className="credits">
            {cars.map((v) => (
              <a key={v.id} className="credit" href={v.photoCreditUrl || '#'} target="_blank" rel="noreferrer">
                <img src={v.images?.[0]} alt={v.name} loading="lazy" />
                <span><b>{v.name}</b><small>{v.photoCredit}</small></span>
              </a>
            ))}
          </div>
        </>}
      </div>
    </>
  );
}
