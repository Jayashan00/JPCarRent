import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { useDB } from '../../lib/db';
import { Empty, Pager } from '../../components/ui';
import { customerOf } from './Bookings';
import { money, fmtDate, downloadCSV, PAY_METHOD } from '../../lib/utils';

export default function Payments() {
  const { bookings, users } = useDB();
  const [q, setQ] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const all = useMemo(() => bookings.flatMap((b) => (b.payments || []).map((p) => ({ ...p, booking: b, customer: customerOf(b, users).name })))
    .sort((a, b) => new Date(b.at) - new Date(a.at)), [bookings, users]);
  const list = all.filter((p) => (!method || p.method === method) && (!from || new Date(p.at) >= new Date(from)) && (!to || new Date(p.at) <= new Date(to + 'T23:59'))
    && (!q || `${p.booking.ref} ${p.customer} ${p.note}`.toLowerCase().includes(q.toLowerCase())));
  const inSum = list.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0);
  const outSum = list.filter((p) => p.amount < 0).reduce((s, p) => s - p.amount, 0);
  const byMethod = Object.keys(PAY_METHOD).map((m) => [m, list.filter((p) => p.method === m && p.amount > 0).reduce((s, p) => s + p.amount, 0)]);
  const outstanding = bookings.filter((b) => ['confirmed', 'active', 'completed'].includes(b.status)).reduce((s, b) => s + Math.max(0, (b.total || 0) - (b.amountPaid || 0)), 0);
  const deposits = bookings.filter((b) => b.depositStatus === 'held').reduce((s, b) => s + (b.deposit || 0), 0);
  const pages = Math.max(1, Math.ceil(list.length / 20));
  return (
    <div className="admin-page">
      <div className="admin-head">
        <div><h1>Payments</h1><p className="muted">Every payment and refund recorded against a booking.</p></div>
        <button className="btn ghost sm" onClick={() => downloadCSV('payments.csv', list.map((p) => ({ date: fmtDate(p.at, true), booking: p.booking.ref, customer: p.customer, method: PAY_METHOD[p.method] || p.method, amount: p.amount, note: p.note, recorded_by: p.by })))}><Download size={16} />Export</button>
      </div>
      <div className="kpis">
        <div className="kpi card"><span>Received</span><b>{money(inSum)}</b><small>{list.filter((p) => p.amount > 0).length} payments in this view</small></div>
        <div className="kpi card"><span>Refunded</span><b>{money(outSum)}</b><small>net {money(inSum - outSum)}</small></div>
        <div className="kpi card"><span>Still to collect</span><b>{money(outstanding)}</b><small>across confirmed and past bookings</small></div>
        <div className="kpi card"><span>Deposits held now</span><b>{money(deposits)}</b><small>to return when cars come back</small></div>
      </div>
      <div className="method-split card pad">
        {byMethod.map(([m, v]) => <div key={m}><span>{PAY_METHOD[m]}</span><b>{money(v)}</b><i style={{ width: `${inSum ? (v / inSum) * 100 : 0}%` }} /></div>)}
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search booking or customer" aria-label="Search payments" /></div>
        <select className="input slim" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Method"><option value="">Method: all</option>{Object.entries(PAY_METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="date-filter">From <input type="date" className="input slim" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="date-filter">To <input type="date" className="input slim" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <div className="table-wrap card">
        {list.length ? (
          <table className="table">
            <thead><tr><th>Date</th><th>Booking</th><th>Customer</th><th>Method</th><th>Note</th><th>Recorded by</th><th>Amount</th></tr></thead>
            <tbody>{list.slice((page - 1) * 20, page * 20).map((p) => (
              <tr key={p.id}>
                <td data-label="Date">{fmtDate(p.at, true)}</td>
                <td data-label="Booking"><Link to={`/admin/bookings?open=${p.booking.id}`}><b>{p.booking.ref}</b></Link></td>
                <td data-label="Customer">{p.customer}</td>
                <td data-label="Method">{PAY_METHOD[p.method] || p.method}</td>
                <td data-label="Note">{p.note}</td>
                <td data-label="Recorded by">{p.by}</td>
                <td data-label="Amount"><b className={p.amount < 0 ? 'err-text' : 'ok-text'}>{money(p.amount)}</b></td>
              </tr>))}</tbody>
          </table>
        ) : <Empty icon="Inbox" title="No payments found" text="Payments appear here when you record them on a booking." />}
        <Pager page={page} pages={pages} onPage={setPage} />
      </div>
    </div>
  );
}
