import { useEffect, useState } from 'react';
import { campuses as campusApi, staff as staffApi } from '../api/client';

export default function Admin() {
  const [campuses, setCampuses] = useState([]);
  const [cross, setCross] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [msg, setMsg] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [campusDetail, setCampusDetail] = useState(null);

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

  const saveCoords = async (building, floor, binId, lat, lng) => {
    try {
      await campusApi.setBinCoords(selectedId, building, floor, binId, Number(lat), Number(lng));
      const detail = await campusApi.get(selectedId);
      setCampusDetail(detail.campus);
      setMsg(`Saved coords for ${binId}`);
    } catch (err) { setMsg(err.response?.data?.error || 'Failed'); }
  };

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
                onClick={() => setSelectedId(c._id)}>
                {selectedId === c._id ? 'Selected' : 'Edit bins'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {campusDetail && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Bin coordinates for {campusDetail.name}</h2>
          <p className="text-xs text-gray-500">Paste lat / lng in decimal degrees (e.g. 12.9716, 77.5946) so the Campus Map can plot them.</p>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr><th>Building</th><th>Floor</th><th>Bin</th><th>Lat</th><th>Lng</th><th></th></tr>
            </thead>
            <tbody>
              {(campusDetail.bins || []).map(b => (
                <BinRow key={`${b.building}-${b.floor}-${b.binId}`} bin={b} onSave={saveCoords} />
              ))}
            </tbody>
          </table>
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

function BinRow({ bin, onSave }) {
  const [lat, setLat] = useState(bin.lat ?? '');
  const [lng, setLng] = useState(bin.lng ?? '');

  return (
    <tr className="border-t">
      <td className="py-2">{bin.building}</td>
      <td>{bin.floor}</td>
      <td>{bin.binId}</td>
      <td>
        <input className="field !w-32" value={lat} onChange={e => setLat(e.target.value)} placeholder="lat" />
      </td>
      <td>
        <input className="field !w-32" value={lng} onChange={e => setLng(e.target.value)} placeholder="lng" />
      </td>
      <td className="text-right">
        <button className="btn !text-xs !py-1 !px-2"
          onClick={() => onSave(bin.building, bin.floor, bin.binId, lat, lng)}>
          Save
        </button>
      </td>
    </tr>
  );
}
