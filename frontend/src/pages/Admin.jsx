import { useState } from 'react';
import { campuses as campusApi, staff as staffApi } from '../api/client';

export default function Admin() {
  const [campuses, setCampuses] = useState([]);
  const [cross, setCross] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [msg, setMsg] = useState('');

  const refresh = async () => {
    const [a, b] = await Promise.all([campusApi.list(), staffApi.crossCampus()]);
    setCampuses(a.campuses); setCross(b);
  };

  useState(() => { refresh(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await campusApi.create(form);
      setForm({ name: '', code: '' });
      setMsg('Campus created');
      refresh();
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
        <ul className="text-sm">
          {campuses.map(c => <li key={c._id} className="py-1">{c.name} <span className="chip">{c.code}</span></li>)}
        </ul>
      </div>

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
