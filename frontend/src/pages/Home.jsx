import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { items } from '../api/client';
import { StatCard, LevelProgress, BinBadge } from '../components/UI';
import { CameraIcon, TruckIcon, MapPinIcon, TrophyIcon, SparklesIcon, ArrowRightIcon, LeafIcon, RecycleIcon, CheckCircleIcon } from '../components/Icons';

export default function Home() {
  const user = useAuthStore(s => s.user);
  const nav = useNavigate();
  const [stats, setStats] = useState({ itemsLogged: 0, estimatedKgDiverted: 0, points: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      items.stats().catch(() => ({ itemsLogged: 0, estimatedKgDiverted: 0, points: 0 })),
      items.history().catch(() => ({ logs: [] })),
    ]).then(([s, h]) => {
      setStats(s || { itemsLogged: 0, estimatedKgDiverted: 0, points: 0 });
      setRecentLogs((h?.logs || []).slice(0, 3));
      setLoading(false);
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl eco-hero-gradient p-8 sm:p-10 shadow-eco-lg overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-eco-lime">
            <SparklesIcon className="w-4 h-4" />
            WasteWise Sustainability Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {getGreeting()}, <span className="text-eco-lime">{user?.name || 'Recycler'}</span> 👋
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Ready to make a difference today? Scan your waste with Gemini AI and discover the correct bin in seconds.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => nav('/identify')}
              className="px-6 py-3 rounded-2xl bg-eco-lime text-eco-forest font-extrabold text-sm hover:bg-lime-300 shadow-eco-glow flex items-center gap-2 transition duration-200"
            >
              <CameraIcon className="w-5 h-5 text-eco-forest" />
              <span>Identify Waste Now</span>
            </button>

            <button
              onClick={() => nav('/history')}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/20 flex items-center gap-2 transition duration-200"
            >
              <TrophyIcon className="w-5 h-5 text-eco-lime" />
              <span>My Impact Dashboard</span>
            </button>
          </div>
        </div>

        {/* Decorative Floating Card (Right) */}
        <div className="relative z-10 w-full md:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-eco-lime uppercase tracking-wider">Today's Goal</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Active</span>
          </div>
          <p className="text-sm font-semibold leading-snug">Sort 3 items to earn +30 bonus XP towards your eco rank!</p>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-eco-lime h-full rounded-full w-2/3" />
          </div>
        </div>

        {/* Subtle Background Orbs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-eco-lime/10 blur-3xl" />
      </div>

      {/* Gamification Rank & Level Progress */}
      <LevelProgress points={stats.points || 0} />

      {/* Real Backend Statistics Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-eco-text flex items-center gap-2">
            <LeafIcon className="w-5 h-5 text-eco-emerald" />
            Your Environmental Impact
          </h2>
          <span className="text-xs font-semibold text-eco-secondary">Real-time backend metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Items Logged & Verified"
            value={stats.itemsLogged || 0}
            unit="items"
            subtitle="Verified at campus bins"
            icon={RecycleIcon}
            color="emerald"
          />
          <StatCard
            title="Estimated Waste Diverted"
            value={Number(stats.estimatedKgDiverted || 0).toFixed(2)}
            unit="kg"
            subtitle="Landfill diversion total"
            icon={LeafIcon}
            color="teal"
          />
          <StatCard
            title="Eco Reward Points"
            value={stats.points || 0}
            unit="XP"
            subtitle="Earned from correct disposal"
            icon={TrophyIcon}
            color="amber"
          />
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <h2 className="text-xl font-extrabold text-eco-text">Quick Launch Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <button
            onClick={() => nav('/identify')}
            className="card text-left group hover:border-eco-emerald/50 hover:shadow-eco-md transition duration-200 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-eco-emerald group-hover:scale-110 transition duration-200">
                <CameraIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-eco-text group-hover:text-eco-forest transition">Identify Waste</h3>
                <p className="text-xs text-eco-secondary mt-1 leading-relaxed">
                  Upload photos or select items to determine the exact recycling bin.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-eco-forest gap-1 group-hover:gap-2 transition-all">
              <span>Start Scanning</span>
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => nav('/pickup')}
            className="card text-left group hover:border-eco-emerald/50 hover:shadow-eco-md transition duration-200 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-eco-teal group-hover:scale-110 transition duration-200">
                <TruckIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-eco-text group-hover:text-eco-forest transition">Report Pickup</h3>
                <p className="text-xs text-eco-secondary mt-1 leading-relaxed">
                  Flag full bins or request waste bags and supplies from campus staff.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-eco-forest gap-1 group-hover:gap-2 transition-all">
              <span>Raise Request</span>
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => nav('/campus')}
            className="card text-left group hover:border-eco-emerald/50 hover:shadow-eco-md transition duration-200 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition duration-200">
                <MapPinIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-eco-text group-hover:text-eco-forest transition">Campus Bin Map</h3>
                <p className="text-xs text-eco-secondary mt-1 leading-relaxed">
                  Locate nearby recycling bins across campus buildings and floors.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-eco-forest gap-1 group-hover:gap-2 transition-all">
              <span>View Interactive Map</span>
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => nav('/history')}
            className="card text-left group hover:border-eco-emerald/50 hover:shadow-eco-md transition duration-200 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition duration-200">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-eco-text group-hover:text-eco-forest transition">Impact & Ranks</h3>
                <p className="text-xs text-eco-secondary mt-1 leading-relaxed">
                  View your complete disposal history, verified points, and badges.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-eco-forest gap-1 group-hover:gap-2 transition-all">
              <span>Open My Impact</span>
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>

      {/* Recent Activity Feed & Eco Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Sorts */}
        <div className="lg:col-span-8 card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-eco-text flex items-center gap-2">
              <RecycleIcon className="w-5 h-5 text-eco-emerald" />
              Recent Sorting Activity
            </h3>
            <Link to="/history" className="text-xs font-bold text-eco-forest hover:underline">
              View All
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center py-6 text-eco-secondary space-y-2">
              <p className="text-sm font-semibold">No waste items logged yet.</p>
              <p className="text-xs">Scan an item to begin your eco contribution!</p>
            </div>
          ) : (
            <div className="divide-y divide-eco-border">
              {recentLogs.map(log => (
                <div key={log._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-eco-mint text-eco-forest flex items-center justify-center font-bold text-sm">
                      ♻️
                    </div>
                    <div>
                      <p className="font-bold text-sm text-eco-text">{log.itemName}</p>
                      <p className="text-xs text-eco-secondary">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BinBadge category={log.category} binColor={log.binColor} />
                    {log.status === 'verified' ? (
                      <span className="chip font-bold text-eco-forest">+10 pts ✓</span>
                    ) : (
                      <span className="chip border-amber-200 bg-amber-50 text-amber-800 font-semibold">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eco Sustainability Tip */}
        <div className="lg:col-span-4 eco-card-gradient space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-eco-forest">
              <SparklesIcon className="w-5 h-5 text-eco-emerald" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Campus Eco Tip</span>
            </div>
            <h4 className="font-bold text-base text-eco-text">Why Separate Wet & Dry Waste?</h4>
            <p className="text-xs text-eco-secondary leading-relaxed">
              Organics in landfills create harmful methane gas. By placing wet waste in Green bins, it gets composted into nutrient-rich soil food instead!
            </p>
          </div>

          <div className="pt-3 border-t border-eco-emerald/20 flex items-center justify-between text-xs font-bold text-eco-forest">
            <span>#EcoWasteWise</span>
            <span className="text-eco-emerald">Keep Campus Green 🌿</span>
          </div>
        </div>

      </div>

    </main>
  );
}
