import React, { useEffect, useState } from 'react';
import { campuses as campusApi, staff as staffApi } from '../api/client';
import { BuildingIcon, RefreshIcon, CheckCircleIcon, SparklesIcon } from '../components/Icons';

export default function Admin() {
  const [campuses, setCampuses] = useState([]);
  const [cross, setCross] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [msg, setMsg] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [campusDetail, setCampusDetail] = useState(null);

  const refresh = async () => {
    const [a, b] = await Promise.all([campusApi.list(), staffApi.crossCampus()]);
    setCampuses(a.campuses || []);
    setCross(b);
    if (selectedId) {
      const detail = await campusApi.get(selectedId);
      setCampusDetail(detail.campus);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    campusApi.get(selectedId).then(d => setCampusDetail(d.campus)).catch(() => setCampusDetail(null));
  }, [selectedId]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await campusApi.create(form);
      setForm({ name: '', code: '' });
      setMsg('Campus created successfully!');
      refresh();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to create campus');
    }
  };

  const saveCoords = async (building, floor, binId, lat, lng) => {
    try {
      await campusApi.setBinCoords(selectedId, building, floor, binId, Number(lat), Number(lng));
      const detail = await campusApi.get(selectedId);
      setCampusDetail(detail.campus);
      setMsg(`Saved coordinates for Bin #${binId}`);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to save coordinates');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
            <BuildingIcon className="w-4 h-4 text-eco-emerald" />
            System Administration & Campus Config
          </div>
          <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
            Admin Management Console ⚙️
          </h1>
          <p className="text-xs sm:text-sm text-eco-secondary">
            Configure campuses, set GPS coordinates for interactive Leaflet maps, and view cross-campus analytics.
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

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Create Campus Card */}
      <form onSubmit={create} className="card space-y-4">
        <h2 className="font-extrabold text-lg text-eco-text">Create New Campus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Campus Name</label>
            <input
              className="field"
              placeholder="e.g. ABC University Main Campus"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Campus Code</label>
            <input
              className="field"
              placeholder="e.g. ABC-MAIN"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>
        </div>
        <button className="btn btn-primary px-6">
          Create Campus
        </button>
      </form>

      {/* Campuses List Card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-eco-border pb-3">
          <h2 className="font-extrabold text-lg text-eco-text">Registered Campuses</h2>
          <span className="chip font-bold">{campuses.length} Campuses</span>
        </div>

        <div className="divide-y divide-eco-border">
          {campuses.map(c => (
            <div key={c._id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-eco-text">{c.name}</span>
                <span className="chip font-mono text-xs">{c.code}</span>
              </div>
              <button
                className={`btn text-xs py-1.5 px-3 ${selectedId === c._id ? 'border-2 border-eco-forest bg-eco-mint text-eco-forest font-bold' : ''}`}
                onClick={() => setSelectedId(c._id)}
              >
                {selectedId === c._id ? 'Editing Bins Below ✓' : 'Edit Bin Coords'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bin Coordinates Editor Card */}
      {campusDetail && (
        <div className="card space-y-4">
          <div className="border-b border-eco-border pb-3">
            <h2 className="font-extrabold text-lg text-eco-text">
              Bin Coordinates for <span className="text-eco-forest">{campusDetail.name}</span>
            </h2>
            <p className="text-xs text-eco-secondary mt-0.5">
              Enter decimal latitude and longitude (e.g. 12.9716, 77.5946) to plot recycling bins on the Leaflet map.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-eco-border text-eco-secondary uppercase font-extrabold text-[11px] tracking-wider">
                  <th className="py-2.5">Building</th>
                  <th className="py-2.5">Floor</th>
                  <th className="py-2.5">Bin ID</th>
                  <th className="py-2.5">Latitude</th>
                  <th className="py-2.5">Longitude</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-eco-border">
                {(campusDetail.bins || []).map(b => (
                  <BinRow key={`${b.building}-${b.floor}-${b.binId}`} bin={b} onSave={saveCoords} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cross-Campus Impact Statistics */}
      {cross && (
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg text-eco-text flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-eco-emerald" />
            Cross-Campus Impact Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cross.itemsByCampus.map(i => (
              <div key={i.campus.code} className="p-4 rounded-2xl bg-eco-bg border border-eco-border space-y-1">
                <p className="font-extrabold text-sm text-eco-text">{i.campus.name}</p>
                <p className="text-xs font-bold text-eco-forest">{i.items} items logged</p>
                <p className="text-xs text-eco-secondary">≈ {i.kg.toFixed(2)} kg diverted from landfill</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}

function BinRow({ bin, onSave }) {
  const [lat, setLat] = useState(bin.lat ?? '');
  const [lng, setLng] = useState(bin.lng ?? '');

  return (
    <tr className="hover:bg-eco-mint/20 transition">
      <td className="py-3 font-bold text-eco-text">{bin.building}</td>
      <td className="py-3 font-semibold">{bin.floor}</td>
      <td className="py-3 font-extrabold text-eco-forest">{bin.binId}</td>
      <td className="py-3">
        <input
          className="field !w-32 !py-1 !text-xs"
          value={lat}
          onChange={e => setLat(e.target.value)}
          placeholder="e.g. 12.9716"
        />
      </td>
      <td className="py-3">
        <input
          className="field !w-32 !py-1 !text-xs"
          value={lng}
          onChange={e => setLng(e.target.value)}
          placeholder="e.g. 77.5946"
        />
      </td>
      <td className="py-3 text-right">
        <button
          className="btn btn-primary text-xs py-1 px-3"
          onClick={() => onSave(bin.building, bin.floor, bin.binId, lat, lng)}
        >
          Save Coords
        </button>
      </td>
    </tr>
  );
}
