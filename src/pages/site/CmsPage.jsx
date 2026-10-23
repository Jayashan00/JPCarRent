import { useDB } from '../../lib/db';
import { PageHero, Prose } from '../../components/site';
import NotFound from './NotFound';
export default function CmsPage({ id }) {
  const { pages } = useDB();
  const p = pages.find((x) => x.id === id);
  if (!p) return <NotFound />;
  return (<><PageHero title={p.title} /><div className="wrap narrow section-sm"><Prose text={p.body} /><p className="small muted" style={{ marginTop: 32 }}>Last updated {new Date(p.updatedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></>);
}
