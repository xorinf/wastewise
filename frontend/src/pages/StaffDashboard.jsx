import React, { useEffect, useState } from 'react';
import { staff as staffApi, requests as reqApi } from '../api/client';
import { fillLabel, requestLabel, statusLabel } from '../utils/lookups';
import { ShieldIcon, RefreshIcon, CheckCircleIcon, TruckIcon } from '../components/Icons';
import { StatCard } from '../components/UI';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const d = await staffApi.dashboard();
      setData(d);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load staff metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const advance = async (id, status) => {
    try {
      await reqApi.setStatus(id, status);
      await refresh();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update request status');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
            <ShieldIcon className="w-4 h-4 text-eco-emerald" />
            Campus Operational Staff Command
          </div>
          <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
            Staff Operations Hub 🛡️
          </h1>
          <p className="text-xs sm:text-sm text-eco-secondary">
            Manage bin pickup dispatches, assign tasks, and monitor real-time campus disposal streams.
          </p>
        </div>

        <button
          onClick={refresh}
          className="btn btn-eco-secondary self-start flex items-center gap-2"
        >
          <RefreshIcon className="w-4 h-4" />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {err && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
          ⚠️ {err}
        </div>
      )}

      {data && (
        <>
          {/* Status Metrics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.requestCountsByStatus.map(s => (
              <StatCard
                key={s._id}
                title={`${statusLabel(s._id)} Requests`}
                value={s.n}
                unit="requests"
                icon={TruckIcon}
                color={s._id === 'pending' ? 'amber' : s._id === 'assigned' ? 'blue' : 'emerald'}
              />
            ))}
          </div>

          {/* Open Pickup Requests Table */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-eco-border pb-3">
              <h2 className="font-extrabold text-lg text-eco-text flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-eco-emerald" />
                Active Campus Pickup Requests
              </h2>
              <span className="chip font-bold">{data.recentRequests.length} Active</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-eco-border text-eco-secondary uppercase font-extrabold text-[11px] tracking-wider">
                    <th className="py-3 px-2">Location</th>
                    <th className="py-3 px-2">Fill Condition</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Qty</th>
                    <th className="py-3 px-2">Raised At</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-border">
                  {data.recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-eco-secondary">
                        No pending pickup requests at this moment 🎉
                      </td>
                    </tr>
                  ) : (
                    data.recentRequests.map(r => (
                      <tr key={r._id} className="hover:bg-eco-mint/20 transition">
                        <td className="py-3.5 px-2 font-extrabold text-eco-text">
                          {r.building} / {r.floor} / <span className="text-eco-forest">Bin #{r.binId}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`chip text-xs font-bold ${r.fillStatus === 'overflowing' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {fillLabel(r.fillStatus)}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 font-semibold text-eco-text">{requestLabel(r.requestType)}</td>
                        <td className="py-3.5 px-2 font-bold">{r.quantity}</td>
                        <td className="py-3.5 px-2 text-xs text-eco-muted">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="py-3.5 px-2">
                          <span className="chip font-bold">{statusLabel(r.status)}</span>
                        </td>
                        <td className="py-3.5 px-2 text-right space-x-2">
                          {r.status === 'pending' && (
                            <button
                              className="btn btn-primary text-xs py-1 px-3"
                              onClick={() => advance(r._id, 'assigned')}
                            >
                              Assign Me
                            </button>
                          )}
                          {r.status !== 'resolved' && (
                            <button
                              className="btn text-xs py-1 px-3 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              onClick={() => advance(r._id, 'resolved')}
                            >
                              Resolve ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Campus Disposals Feed */}
          <div className="card space-y-3">
            <h2 className="font-extrabold text-base text-eco-text">Recent Student Disposals Log</h2>
            <div className="divide-y divide-eco-border max-h-80 overflow-auto">
              {data.recentDisposals.map(l => (
                <div key={l._id} className="py-2.5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-eco-text">{l.itemName}</span>
                    <span className="text-eco-secondary">→ {l.binColor} bin</span>
                  </div>
                  <span className="text-eco-muted">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </main>
  );
}
