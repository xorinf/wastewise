import { useEffect, useState } from 'react';
import { items, campuses as campusApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Identify() {
  const { selectedCampusId } = useAuthStore();
  const [grid, setGrid] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { items.quickSelect().then(d => setGrid(d.items)).catch(() => {}); }, []);

  const upload = async (file) => {
    if (!file) return;
    if (!selectedCampusId) {
      setErr('Please select a campus first (top right).');
      return;
    }
    setErr(''); setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('campusId', selectedCampusId);
      const r = await items.identify(fd);
      if (r.lowConfidence) {
        // Show quick-select with the uploaded image context; user re-picks.
        setResult({ ...r, mode: 'pickFromPhoto' });
      } else {
        await items.log({
          itemName: r.itemName, category: r.category, campusId: selectedCampusId,
          source: 'upload', imageUrl: r.imageUrl || '',
        });
        setResult({ ...r, mode: 'photo' });
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const pickFromGrid = async (item) => {
    if (!selectedCampusId) { setErr('Please select a campus first (top right).'); return; }
    setErr(''); setBusy(true); setResult(null);
    try {
      const r = await items.log({
        itemName: item.name, category: item.category, campusId: selectedCampusId, source: 'quick_select',
      });
      setResult({
        ...r.log.toObject?.() || r.log,
        bin: { color: r.log.binColor },
        points: r.points,
        mode: 'quick',
      });
    } catch (e) {
      setErr(e.response?.data?.error || 'Logging failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Identify an item</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold">Upload a photo</h2>
        <input type="file" accept="image/*" disabled={busy}
          onChange={e => upload(e.target.files[0])} />
        <p className="text-xs text-gray-500">Image is sent to the vision model. Low-confidence results fall back to the grid below.</p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Quick-select</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {grid.map((it) => (
            <button key={it.name} className="btn !text-sm !py-2" disabled={busy} onClick={() => pickFromGrid(it)}>
              {it.name}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {result && (
        <div className="card space-y-2">
          {result.mode === 'pickFromPhoto' && (
            <>
              <p className="font-medium">{result.message}</p>
              <p className="text-sm text-gray-600">Click an item below to log it with the uploaded image.</p>
            </>
          )}
          {result.itemName && (
            <>
              <p className="text-lg">
                This is a <strong>{result.itemName}</strong>. Put it in the <strong>{result.bin?.color || result.binColor}</strong> bin
                {result.bin?.reason ? <> because {result.bin.reason}</> : null}.
              </p>
              <p className="text-sm text-gray-600">+{result.points || 10} points earned.</p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
