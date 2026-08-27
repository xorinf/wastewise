import React, { useEffect, useState } from 'react';
import { items } from '../api/client';
import { BIN } from '../utils/lookups';
import { StatCard, LevelProgress, BinBadge, EmptyState } from '../components/UI';
import { TrophyIcon, LeafIcon, RecycleIcon, CheckCircleIcon, RefreshIcon, SparklesIcon } from '../components/Icons';

export default function History() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ itemsLogged: 0, estimatedKgDiverted: 0, points: 0 });
  const [err, setErr] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [h, s] = await Promise.all([items.history(), items.stats()]);
      setLogs(h.logs || []);
      setStats(s || { itemsLogged: 0, estimatedKgDiverted: 0, points: 0 });
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load impact analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const verify = async (id) => {
    setPendingId(id);
    try {
      await items.verify(id);
      await refresh();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to verify disposal');
    } finally {
      setPendingId(null);
    }
  };

  const pendingCount = logs.filter(l => l.status === 'pending').length;

  // Calculate category metrics breakdown from backend logs
  const categoryCounts = logs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});

  const totalCategoryLogs = logs.length || 1;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
            <TrophyIcon className="w-4 h-4 text-eco-emerald" />
            Sustainability Performance Dashboard
          </div>
          <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
            My Environmental Impact 🌱
          </h1>
          <p className="text-xs sm:text-sm text-eco-secondary">
            Every item you sort diverts waste from landfills and earns eco points for your campus.
          </p>
        </div>

        <button
          onClick={refresh}
          className="btn btn-eco-secondary self-start flex items-center gap-2"
        >
          <RefreshIcon className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Gamification Level & XP Progress Card */}
      <LevelProgress points={stats.points || 0} />

      {/* Achievements Badges */}
      <div className="card space-y-3">
        <h2 className="font-extrabold text-base text-eco-text flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-eco-emerald" />
          Eco Milestones & Badges
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
            (stats.itemsLogged || 0) >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-eco-bg border-eco-border text-eco-muted opacity-60'
          }`}>
            <span className="text-2xl">♻️</span>
            <div>
              <p className="font-extrabold">First Sort</p>
              <p className="text-[10px] font-medium">Logged 1+ waste item</p>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
            (stats.points || 0) >= 50 ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-eco-bg border-eco-border text-eco-muted opacity-60'
          }`}>
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-extrabold">Eco Warrior</p>
              <p className="text-[10px] font-medium">Reached 50+ XP</p>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
            (stats.estimatedKgDiverted || 0) >= 1 ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold' : 'bg-eco-bg border-eco-border text-eco-muted opacity-60'
          }`}>
            <span className="text-2xl">🌱</span>
            <div>
              <p className="font-extrabold">1kg Diverted</p>
              <p className="text-[10px] font-medium">1.0 kg waste saved</p>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
            (stats.itemsLogged || 0) >= 10 ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-eco-bg border-eco-border text-eco-muted opacity-60'
          }`}>
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-extrabold">Top Recycler</p>
              <p className="text-[10px] font-medium">Logged 10+ items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Items Logged & Verified"
          value={stats.itemsLogged || 0}
          unit="items"
          subtitle={pendingCount > 0 ? `${pendingCount} items pending bin verification` : 'All items verified'}
          icon={RecycleIcon}
          color="emerald"
        />
        <StatCard
          title="Estimated Waste Diverted"
          value={Number(stats.estimatedKgDiverted || 0).toFixed(2)}
          unit="kg"
          subtitle="Counted from verified bin logs"
          icon={LeafIcon}
          color="teal"
        />
        <StatCard
          title="Total Eco Points"
          value={stats.points || 0}
          unit="XP"
          subtitle="Earned from verified disposals"
          icon={TrophyIcon}
          color="amber"
        />
      </div>

      {/* Waste Category Breakdown Chart */}
      {logs.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-extrabold text-base text-eco-text">Waste Category Distribution</h2>
          
          <div className="w-full bg-eco-border/40 h-4 rounded-full overflow-hidden flex shadow-inner">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${((categoryCounts['wet_organic'] || 0) / totalCategoryLogs) * 100}%` }} title="Wet Organic" />
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${((categoryCounts['dry_recyclable'] || 0) / totalCategoryLogs) * 100}%` }} title="Dry Recyclable" />
            <div className="bg-red-500 h-full transition-all" style={{ width: `${((categoryCounts['hazardous_ewaste'] || 0) / totalCategoryLogs) * 100}%` }} title="Hazardous / E-Waste" />
            <div className="bg-gray-900 h-full transition-all" style={{ width: `${((categoryCounts['reject_other'] || 0) / totalCategoryLogs) * 100}%` }} title="General / Reject" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-bold text-eco-text">Wet Organic ({categoryCounts['wet_organic'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="font-bold text-eco-text">Dry Recyclable ({categoryCounts['dry_recyclable'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-bold text-eco-text">Hazardous ({categoryCounts['hazardous_ewaste'] || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-900" />
              <span className="font-bold text-eco-text">General ({categoryCounts['reject_other'] || 0})</span>
            </div>
          </div>
        </div>
      )}

      {/* History Timeline */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-eco-border pb-3">
          <h2 className="font-extrabold text-base text-eco-text">Disposal History Log</h2>
          <span className="chip font-bold">{logs.length} Total Entries</span>
        </div>

        {err && <p className="text-xs text-red-600 font-semibold">{err}</p>}

        {logs.length === 0 ? (
          <EmptyState
            icon={RecycleIcon}
            title="No Waste Items Logged Yet"
            description="Start identifying waste with AI or select common items to build your environmental impact record!"
          />
        ) : (
          <div className="divide-y divide-eco-border">
            {logs.map((l) => {
              const isPending = l.status === 'pending';
              return (
                <div key={l._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-eco-mint/20 px-2 rounded-xl transition">
                  <div className="flex items-start gap-3.5">
                    {l.imageUrl ? (
                      <img src={l.imageUrl} alt={l.itemName} className="w-12 h-12 rounded-xl object-cover border border-eco-border shrink-0 shadow-xs" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-eco-mint text-eco-forest flex items-center justify-center font-bold text-lg shrink-0">
                        ♻️
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm text-eco-text">{l.itemName}</p>
                        <BinBadge category={l.category} binColor={l.binColor} />
                      </div>
                      <p className="text-xs text-eco-secondary">
                        {new Date(l.createdAt).toLocaleString()} · Source: <span className="font-semibold">{l.source}</span>
                      </p>
                    </div>
                  </div>

                  {/* Verification Status Action */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <span className="chip border-amber-300 bg-amber-50 text-amber-800 font-bold">
                          Pending Bin Verification
                        </span>
                        <button
                          className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          disabled={pendingId === l._id}
                          onClick={() => verify(l._id)}
                        >
                          <CheckCircleIcon className="w-4 h-4 text-eco-lime" />
                          <span>{pendingId === l._id ? 'Verifying...' : 'In the bin ✓'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="chip bg-emerald-50 text-emerald-800 border-emerald-200 font-bold flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                        <span className="chip font-extrabold text-eco-forest bg-eco-lime/30 border-eco-lime">
                          +{l.pointsEarned || 10} XP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}
