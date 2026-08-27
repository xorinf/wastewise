import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { BIN, BIN_KEY } from '../utils/lookups';

const STATUS_TEXT = {
  uploading: 'Uploading to image storage…',
  classifying: 'Asking Gemini to classify…',
  logging: 'Logging your item…',
};

export default function Identify() {
  const { selectedCampusId } = useAuthStore();
  const [grid, setGrid] = useState([]);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'classifying' | 'logging'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { items.quickSelect().then(d => setGrid(d.items)).catch(() => {}); }, []);

  const reset = () => {
    setErr(''); setResult(null); setStatus(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!selectedCampusId) {
      setErr('Please select a campus first (top right).');
      return;
    }
    reset();
    setStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Single request: backend does upload + classify + log in one round-trip.
      // Image data travels to the backend; it stores it on Cloudinary, calls Gemini,
      // and (on high confidence) writes the DisposalLog row.
      setStatus('classifying');
      const fd = new FormData();
      fd.append('image', file);
      fd.append('campusId', selectedCampusId);
      const r = await items.identify(fd);

      if (r.lowConfidence) {
        // Keep preview + show the suggestions inline so the user picks immediately.
        setResult({ ...r, mode: 'pickFromPhoto', previewUrl: URL.createObjectURL(file), pendingFile: file });
        setStatus(null);
        return;
      }

      setStatus('logging');
      const log = await items.log({
        itemName: r.itemName, category: r.category, campusId: selectedCampusId,
        source: 'upload', imageUrl: r.imageUrl || '',
      });
      setResult({ ...r, mode: 'photo', logId: log.log?._id });
      setStatus(null);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Upload failed');
      setStatus(null);
    }
  };

  // Used when the user picks from the grid AFTER uploading a photo.
  // We log with source='upload' (so it counts as image-driven) and attach the
  // imageUrl from the previous upload response.
  const pickFromGrid = async (item, imageUrl = '') => {
    if (!selectedCampusId) { setErr('Please select a campus first (top right).'); return; }
    setStatus('logging');
    setErr('');
    try {
      const r = await items.log({
        itemName: item.name, category: item.category, campusId: selectedCampusId,
        source: imageUrl ? 'upload' : 'quick_select',
        imageUrl,
      });
      setResult({
        itemName: item.name, category: item.category,
        binColor: r.log.binColor, points: r.points,
        estimatedKg: r.log.estimatedKg, imageUrl: r.log.imageUrl,
        mode: 'photo',
      });
    } catch (e) {
      setErr(e.response?.data?.error || 'Logging failed');
    } finally {
      setStatus(null);
    }
  };

  // Quick-select is highlighted when the user is in the "pickFromPhoto" state,
  // so they can pick without losing context.
  const inPhotoPickMode = result?.mode === 'pickFromPhoto';
  const pendingImageUrl = result?.imageUrl;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Identify an item</h1>

      {/* Upload card */}
      <div className="card space-y-3">
        <h2 className="font-semibold">Upload a photo</h2>
        <input
          type="file" accept="image/*" disabled={!!status}
          onChange={e => upload(e.target.files[0])}
          className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-900 file:bg-white file:text-gray-900 hover:file:bg-gray-900 hover:file:text-white"
        />

        {status && (
          <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-md bg-gray-50" aria-live="polite">
            <Spinner />
            <span className="text-sm text-gray-700">{STATUS_TEXT[status]}</span>
          </div>
        )}

        {previewUrl && !status && !result && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Preview</p>
            <img src={previewUrl} alt="Uploaded item preview" className="max-h-48 rounded-md border border-gray-200" />
          </div>
        )}

        <p className="text-xs text-gray-500">
          Image goes to Cloudinary, then Gemini classifies it. Low-confidence results fall back to the grid below — you can still pick an item and the photo stays attached.
        </p>
      </div>

      {/* Result card — shown when we know what was classified */}
      {result && !status && (
        <div className="card space-y-3 border-2 border-gray-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {result.mode === 'pickFromPhoto' ? 'Pick an item' : 'Classified'}
              </p>
              <p className="text-lg mt-1">
                <strong>{result.itemName || result.message}</strong>
                {result.binColor && <> · put it in the <strong>{result.binColor}</strong> bin</>}
              </p>
              {result.estimatedKg != null && (
                <p className="text-sm text-gray-600">≈ {result.estimatedKg.toFixed(2)} kg diverted</p>
              )}
            </div>
            {result.imageUrl && (
              <img src={result.imageUrl} alt="Uploaded item" className="w-20 h-20 rounded-md border border-gray-200 object-cover" />
            )}
          </div>

          {result.mode === 'pickFromPhoto' && (
            <div>
              <p className="text-sm text-gray-700">{result.message || 'Vision model unsure — pick the closest match below.'}</p>
              {pendingImageUrl && (
                <p className="text-xs text-gray-500 mt-1">Your uploaded image will be attached to whichever item you pick.</p>
              )}
            </div>
          )}

          {result.logId && (
            <p className="text-xs text-gray-500">
              Logged. <Link to="/history" className="underline">See in My Impact</Link>
            </p>
          )}

          <button className="btn !text-sm" onClick={reset}>Identify another</button>
        </div>
      )}

      {/* Quick-select grid */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">
            {inPhotoPickMode ? 'Pick one — photo will be attached' : 'Or quick-select'}
          </h2>
          <p className="text-xs text-gray-500">Each tap logs the item and awards +10 points. The colored dot shows which bin it goes to.</p>
        </div>

        {/* Bin color key — teaches the visual grammar in one glance */}
        <div className="flex flex-wrap gap-2 text-xs">
          {BIN_KEY.map(k => (
            <span key={k.category} className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: k.color }} />
              <strong className="text-gray-700">{k.textColor}</strong>
              <span className="text-gray-500">· {k.label}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {grid.map((it) => {
            const bin = BIN[it.category] || {};
            const swatch = BIN_KEY.find(k => k.category === it.category);
            return (
              <button
                key={it.name}
                disabled={!!status}
                onClick={() => pickFromGrid(it, inPhotoPickMode ? pendingImageUrl : '')}
                className={`group flex flex-col items-start text-left border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition ${inPhotoPickMode ? 'border-2 border-gray-900' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: swatch?.color }} />
                  <span className="font-medium text-sm text-gray-900">{it.name}</span>
                </span>
                <span className="text-xs text-gray-500 mt-1">→ {bin.color || '—'} bin</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom waste type */}
      <div className="card space-y-3">
        <h2 className="font-semibold">Custom waste type</h2>
        <p className="text-xs text-gray-500">Type any item not in the grid above. Pick the matching category.</p>
        <CustomForm
          imageUrl={inPhotoPickMode ? pendingImageUrl : ''}
          disabled={!!status}
          busy={status === 'logging'}
          onLogged={(r) => {
            setResult({
              itemName: r.log.itemName, category: r.log.category,
              binColor: r.log.binColor, points: r.points,
              estimatedKg: r.log.estimatedKg, imageUrl: r.log.imageUrl,
              mode: 'photo',
            });
            setStatus(null);
          }}
          onError={(msg) => { setStatus(null); setErr(msg); }}
          onStart={() => { setErr(''); setStatus('logging'); }}
        />
      </div>

      {err && (
        <div className="card border-red-600 space-y-1">
          <p className="text-sm text-red-700">{err}</p>
          <p className="text-xs text-gray-500">If this keeps failing, confirm your backend is reachable at /api/health.</p>
        </div>
      )}
    </main>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-900" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="50 18" />
    </svg>
  );
}

const CATEGORIES = [
  { value: 'wet_organic', label: 'Wet organic (Green bin)' },
  { value: 'dry_recyclable', label: 'Dry recyclable (Blue bin)' },
  { value: 'hazardous_ewaste', label: 'Hazardous / E-waste (Red bin)' },
  { value: 'reject_other', label: 'General / Reject (Black bin)' },
];

function CustomForm({ imageUrl, busy, disabled, onLogged, onError, onStart }) {
  const { selectedCampusId } = useAuthStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('dry_recyclable');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { onError('Type the item name first.'); return; }
    onStart();
    try {
      const r = await items.log({
        itemName: trimmed,
        category,
        campusId: selectedCampusId,
        source: imageUrl ? 'upload' : 'custom',
        imageUrl,
      });
      setName('');
      onLogged(r);
    } catch (err) {
      onError(err.response?.data?.error || 'Could not save this item.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
        <input
          className="field"
          placeholder="e.g. coconut shell, takeaway cup, broken mirror"
          value={name}
          disabled={disabled}
          onChange={e => setName(e.target.value)}
          maxLength={80}
        />
        <select
          className="field !w-auto"
          value={category}
          disabled={disabled}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button className="btn btn-primary" disabled={disabled || !name.trim()}>{busy ? '...' : 'Log it'}</button>
      </div>
      {imageUrl && (
        <p className="text-xs text-gray-500">The uploaded image will be attached to this entry.</p>
      )}
    </form>
  );
}
