import { useEffect, useState } from 'react';
import { items } from '../api/client';
import { BIN } from '../utils/lookups';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ itemsLogged: 0, estimatedKgDiverted: 0, points: 0 });
  const [err, setErr] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const refresh = async () => {
    try {
      const [h, s] = await Promise.all([items.history(), items.stats()]);
      setLogs(h.logs); setStats(s);
    } catch (e) { setErr(e.response?.data?.error || 'Failed to load'); }
  };
  useEffect(() => { refresh(); }, []);

  const verify = async (id) => {
    setPendingId(id);
    try {
      await items.verify(id);
      await refresh();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to verify');
    } finally {
      setPendingId(null);
    }
  };

  const pendingCount = logs.filter(l => l.status === 'pending').length;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My impact</h1>
        <button className="btn !py-1 !px-3 !text-sm" onClick={refresh}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Items verified</p>
          <p className="text-2xl font-bold">{stats.itemsLogged}</p>
          {pendingCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">{pendingCount} pending · tap to verify</p>
          )}
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Estimated kg diverted</p>
          <p className="text-2xl font-bold">{stats.estimatedKgDiverted.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">counted from verified items only</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Points</p>
          <p className="text-2xl font-bold">{stats.points}</p>
        </div>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      <div className="card">
        <h2 className="font-semibold mb-3">History</h2>
        {logs.length === 0 && <p className="text-sm text-gray-600">No items logged yet.</p>}
        <ul className="divide-y">
          {logs.map((l) => {
            const bin = BIN[l.category] || { color: l.binColor };
            const isPending = l.status === 'pending';
            return (
              <li key={l._id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{l.itemName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {new Date(l.createdAt).toLocaleString()} · {bin.color} bin · {l.source}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isPending ? (
                    <>
                      <span className="chip border-amber-600 text-amber-700">pending</span>
                      <button
                        className="btn !text-xs !py-1 !px-2 btn-primary"
                        disabled={pendingId === l._id}
                        onClick={() => verify(l._id)}
                      >
                        {pendingId === l._id ? '...' : 'In the bin ✓'}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="chip">+{l.pointsEarned} pts</span>
                      <span className="chip">verified</span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
