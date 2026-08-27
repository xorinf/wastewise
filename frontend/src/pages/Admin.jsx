import { useEffect, useState } from 'react';
import { campuses as campusApi, staff as staffApi } from '../api/client';
import CampusMap from '../components/CampusMap';

export default function Admin() {
  const [campuses, setCampuses] = useState([]);
  const [cross, setCross] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [msg, setMsg] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [campusDetail, setCampusDetail] = useState(null);
  const [pickerBinKey, setPickerBinKey] = useState(null); // bin currently being placed on the map

  const refresh = async () => {
    const [a, b] = await Promise.all([campusApi.list(), staffApi.crossCampus()]);
    setCampuses(a.campuses); setCross(b);
    if (selectedId) {
      const detail = await campusApi.get(selectedId);
      setCampusDetail(detail.campus);
    }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!selectedId) return;
    campusApi.get(selectedId).then(d => setCampusDetail(d.campus)).catch(() => setCampusDetail(null));
  }, [selectedId]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await campusApi.create(form);
      setForm({ name: '', code: '' });
      setMsg('Campus created');
      refresh();
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

  const reloadDetail = () => campusApi.get(selectedId).then(d => setCampusDetail(d.campus)).catch(() => {});

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-semibold">Create campus</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="field" placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
        </div>
        <button className="btn btn-primary">Create</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </form>

      <div className="card">
        <h2 className="font-semibold mb-2">Campuses</h2>
        <ul className="text-sm divide-y">
          {campuses.map(c => (
            <li key={c._id} className="py-2 flex items-center justify-between">
              <span>{c.name} <span className="chip ml-2">{c.code}</span></span>
              <button className={`btn !text-xs !py-1 !px-2 ${selectedId === c._id ? 'border-2 border-gray-900' : ''}`}
                onClick={() => { setSelectedId(c._id); setPickerBinKey(null); }}>
                {selectedId === c._id ? 'Selected' : 'Edit bins'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {campusDetail && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Bins for {campusDetail.name}</h2>
            <span className="text-xs text-gray-500">{(campusDetail.bins || []).length} total</span>
          </div>

          {/* Add-bin row */}
          <AddBinRow campusId={selectedId} onAdded={reloadDetail} />

          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr><th>Building</th><th>Floor</th><th>Bin</th><th>Lat</th><th>Lng</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {(campusDetail.bins || []).map(b => {
                const key = `${b.building}|${b.floor}|${b.binId}`;
                const isPicking = pickerBinKey === key;
                return (
                  <BinRow
                    key={key}
                    bin={b}
                    campusId={selectedId}
                    onSaved={reloadDetail}
                    onDeleted={reloadDetail}
                    onStartPick={() => setPickerBinKey(key)}
                    onCancelPick={() => setPickerBinKey(null)}
                  />
                );
              })}
            </tbody>
          </table>

          {/* Map picker: appears when any row has triggered 'Pick on map'. */}
          {pickerBinKey && (() => {
            const b = (campusDetail.bins || []).find(x => `${x.building}|${x.floor}|${x.binId}` === pickerBinKey);
            if (!b) return null;
            const dragMarker = b.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng } : null;
            const otherLocated = (campusDetail.bins || []).filter(x => x !== b && x.lat != null);
            return (
              <div className="space-y-2 border border-gray-300 rounded-md p-3 bg-gray-50">
                <p className="text-xs text-gray-600">
                  Drag the marker to set <strong>{b.binId}</strong>'s location. Existing bins are shown in gray for context.
                </p>
                <BinPickerMap
                  binKey={pickerBinKey}
                  bins={otherLocated}
                  initialLat={b.lat}
                  initialLng={b.lng}
                  onPick={async ({ lat, lng }) => {
                    try {
                      await campusApi.setBinCoords(selectedId, b.building, b.floor, b.binId, lat, lng);
                      await reloadDetail();
                      setPickerBinKey(null);
                      setMsg(`Saved coords for ${b.binId}`);
                    } catch (e2) { setMsg(e2.response?.data?.error || 'Failed'); }
                  }}
                />
                <div className="flex justify-end">
                  <button className="btn !text-xs !py-1 !px-2" onClick={() => setPickerBinKey(null)}>Cancel</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {cross && (
        <div className="card">
          <h2 className="font-semibold mb-2">Cross-campus items logged</h2>
          <ul className="text-sm">
            {cross.itemsByCampus.map(i => (
              <li key={i.campus.code} className="py-1">{i.campus.name}: {i.items} items, {i.kg.toFixed(2)} kg</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function AddBinRow({ campusId, onAdded }) {
  const [form, setForm] = useState({ building: '', floor: '', binId: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.building || !form.floor || !form.binId) { setErr('All three required'); return; }
    setBusy(true); setErr('');
    try {
      await campusApi.addBin(campusId, {
        building: form.building, floor: form.floor, binId: form.binId,
      });
      setForm({ building: '', floor: '', binId: '' });
      onAdded();
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Failed to add');
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 border border-gray-200 rounded-md p-3 bg-gray-50">
      <div>
        <label className="label text-xs">Building</label>
        <input className="field !w-32" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} placeholder="Block A" />
      </div>
      <div>
        <label className="label text-xs">Floor</label>
        <input className="field !w-24" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="Ground" />
      </div>
      <div>
        <label className="label text-xs">Bin ID</label>
        <input className="field !w-28" value={form.binId} onChange={e => setForm({ ...form, binId: e.target.value })} placeholder="A-G-04" />
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? '...' : 'Add bin'}</button>
      {err && <p className="text-sm text-red-700">{err}</p>}
    </form>
  );
}

function BinRow({ bin, campusId, onSaved, onDeleted, onStartPick, onCancelPick }) {
  const [lat, setLat] = useState(bin.lat ?? '');
  const [lng, setLng] = useState(bin.lng ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await campusApi.setBinCoords(campusId, bin.building, bin.floor, bin.binId, Number(lat), Number(lng));
      onSaved();
    } catch (e) { /* surfaced via msg in parent */ }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm(`Delete bin ${bin.binId}?`)) return;
    setBusy(true);
    try {
      await campusApi.deleteBin(campusId, bin.building, bin.floor, bin.binId);
      onDeleted();
    } catch (e) { /* ignore */ }
    finally { setBusy(false); }
  };

  return (
    <tr className="border-t">
      <td className="py-2">{bin.building}</td>
      <td>{bin.floor}</td>
      <td>{bin.binId}</td>
      <td><input className="field !w-32" value={lat} onChange={e => setLat(e.target.value)} placeholder="lat" /></td>
      <td><input className="field !w-32" value={lng} onChange={e => setLng(e.target.value)} placeholder="lng" /></td>
      <td className="text-right space-x-1 whitespace-nowrap">
        <button className="btn !text-xs !py-1 !px-2" onClick={save} disabled={busy}>{busy ? '...' : 'Save'}</button>
        <button className="btn !text-xs !py-1 !px-2" onClick={onStartPick}>Pick on map</button>
      </td>
      <td className="text-right">
        <button className="btn btn-danger !text-xs !py-1 !px-2" onClick={remove} disabled={busy}>Delete</button>
      </td>
    </tr>
  );
}

/**
 * Wrapper around CampusMap in 'pick' mode: keeps a single draggable marker
 * for the bin being edited. Calls onPick({lat,lng}) when the user clicks or
 * drags the marker somewhere.
 */
function BinPickerMap({ bins, initialLat, initialLng, onPick }) {
  const [marker, setMarker] = useState(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );

  return (
    <CampusMap
      bins={bins}
      pins={[]}
      bbox={null}
      dragMarker={marker}
      onSelect={(p) => { setMarker(p); onPick(p); }}
      onMove={(p) => { setMarker(p); onPick(p); }}
      height={280}
    />
  );
}
