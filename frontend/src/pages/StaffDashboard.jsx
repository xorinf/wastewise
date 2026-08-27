import { useEffect, useState } from 'react';
import { staff as staffApi, requests as reqApi } from '../api/client';
import { fillLabel, requestLabel, statusLabel } from '../utils/lookups';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const refresh = async () => {
    try {
      const d = await staffApi.dashboard();
      setData(d);
    } catch (e) { setErr(e.response?.data?.error || 'Failed to load'); }
  };

  useEffect(() => { refresh(); }, []);

  const advance = async (id, status) => {
    try {
      await reqApi.setStatus(id, status);
      await refresh();
    } catch (e) { setErr(e.response?.data?.error || 'Failed'); }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff dashboard</h1>
        <button className="btn !text-sm" onClick={refresh}>Refresh</button>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.requestCountsByStatus.map(s => (
              <div key={s._id} className="card"><p className="text-xs text-gray-600">{statusLabel(s._id)}</p><p className="text-xl font-bold">{s.n}</p></div>
            ))}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-2">Open requests</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr><th>Location</th><th>Fill</th><th>Type</th><th>Qty</th><th>Raised</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {data.recentRequests.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2">{r.building} / {r.floor} / {r.binId}</td>
                    <td>{fillLabel(r.fillStatus)}</td>
                    <td>{requestLabel(r.requestType)}</td>
                    <td>{r.quantity}</td>
                    <td className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td><span className="chip">{statusLabel(r.status)}</span></td>
                    <td className="text-right space-x-1">
                      {r.status === 'pending' && <button className="btn !text-xs !py-1 !px-2" onClick={() => advance(r._id, 'assigned')}>Assign me</button>}
                      {r.status !== 'resolved' && <button className="btn !text-xs !py-1 !px-2" onClick={() => advance(r._id, 'resolved')}>Resolve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-2">Recent disposals</h2>
            <ul className="divide-y">
              {data.recentDisposals.map(l => (
                <li key={l._id} className="py-2 text-sm flex justify-between">
                  <span>{l.itemName} → {l.binColor} bin</span>
                  <span className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
