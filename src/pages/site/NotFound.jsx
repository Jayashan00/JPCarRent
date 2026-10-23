import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="wrap notfound">
      <div className="route-sign static"><span className="rs-plate"><span className="rs-from">Wrong turn</span><span className="rs-row"><b>Page not found</b><span className="rs-km">404</span></span></span></div>
      <p className="lead">This page doesn’t exist or has moved.</p>
      <div className="row-gap"><Link to="/" className="btn dark">Go to the home page</Link><Link to="/fleet" className="btn ghost">Browse cars</Link></div>
    </div>
  );
}
