import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { BIN, BIN_KEY } from '../utils/lookups';
import { BinBadge, ConfidenceBar } from '../components/UI';
import { CameraIcon, UploadIcon, SparklesIcon, CheckCircleIcon, RefreshIcon, LeafIcon, AlertTriangleIcon, RecycleIcon, StarIcon } from '../components/Icons';

const STATUS_TEXT = {
  uploading: 'Uploading photo to secure image storage…',
  classifying: 'Analyzing object with Gemini 1.5 Flash Vision AI…',
  logging: 'Logging item to campus environmental ledger…',
};

export default function Identify() {
  const { selectedCampusId } = useAuthStore();
  const [grid, setGrid] = useState([]);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'classifying' | 'logging'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [pointsToast, setPointsToast] = useState(false);

  useEffect(() => {
    items.quickSelect().then(d => setGrid(d.items || [])).catch(() => {});
  }, []);

  const reset = () => {
    setErr('');
    setResult(null);
    setStatus(null);
    setPointsToast(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!selectedCampusId) {
      setErr('Please select a campus first from the top header.');
      return;
    }
    reset();
    setStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    try {
      setStatus('classifying');
      const fd = new FormData();
      fd.append('image', file);
      fd.append('campusId', selectedCampusId);
      const r = await items.identify(fd);

      if (r.lowConfidence) {
        setResult({ ...r, mode: 'pickFromPhoto', previewUrl: URL.createObjectURL(file), pendingFile: file });
        setStatus(null);
        return;
      }

      setStatus('logging');
      const log = await items.log({
        itemName: r.itemName,
        category: r.category,
        campusId: selectedCampusId,
        source: 'upload',
        imageUrl: r.imageUrl || '',
      });
      setResult({ ...r, mode: 'photo', logId: log.log?._id, status: log.log?.status, points: 0 });
      setStatus(null);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Upload failed. Please check network.');
      setStatus(null);
    }
  };

  const pickFromGrid = async (item, imageUrl = '') => {
    if (!selectedCampusId) {
      setErr('Please select a campus first from the top header.');
      return;
    }
    setStatus('logging');
    setErr('');
    try {
      const r = await items.log({
        itemName: item.name,
        category: item.category,
        campusId: selectedCampusId,
        source: imageUrl ? 'upload' : 'quick_select',
        imageUrl,
      });
      setResult({
        itemName: item.name,
        category: item.category,
        binColor: r.log.binColor,
        points: r.points,
        estimatedKg: r.log.estimatedKg,
        imageUrl: r.log.imageUrl,
        status: r.log.status,
        logId: r.log._id,
        mode: 'photo',
      });
    } catch (e) {
      setErr(e.response?.data?.error || 'Logging failed');
    } finally {
      setStatus(null);
    }
  };

  const verify = async () => {
    if (!result?.logId) return;
    try {
      const r = await items.verify(result.logId);
      setResult(prev => ({ ...prev, status: 'verified', points: (prev.points || 0) + (r.points || 0) }));
      setPointsToast(true);
      setTimeout(() => setPointsToast(false), 4000);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not verify disposal');
    }
  };

  const inPhotoPickMode = result?.mode === 'pickFromPhoto';
  const pendingImageUrl = result?.imageUrl;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-mint border border-eco-emerald/30 text-xs font-bold text-eco-forest">
            <SparklesIcon className="w-4 h-4 text-eco-emerald" />
            AI Waste Recognition Engine
          </div>
          <h1 className="text-3xl font-extrabold text-eco-text tracking-tight mt-1">
            Identify Waste & Find Your Bin 📷
          </h1>
          <p className="text-xs sm:text-sm text-eco-secondary">
            Snap a picture or choose from common campus items to get instant sorting guidance.
          </p>
        </div>

        {result && (
          <button
            onClick={reset}
            className="btn btn-eco-secondary self-start flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Scan New Item
          </button>
        )}
      </div>

      {/* Floating Points Toast Animation */}
      {pointsToast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce-soft">
          <div className="px-5 py-3 rounded-2xl bg-eco-forest text-white shadow-eco-lg border-2 border-eco-lime flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div>
              <p className="font-extrabold text-sm text-eco-lime">+10 Eco XP Earned!</p>
              <p className="text-[11px] text-emerald-100">Disposal verified at bin</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Scanner Drop Zone Card */}
      {!result && (
        <div className="eco-card-gradient relative overflow-hidden border-2 border-dashed border-eco-emerald/30 hover:border-eco-emerald transition-all duration-300 p-8 sm:p-12 text-center space-y-6">
          
          <div className="max-w-md mx-auto space-y-4">
            {/* Animated Scanner Graphic */}
            <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-eco-forest to-eco-teal text-white flex items-center justify-center shadow-eco-glow">
              <CameraIcon className="w-10 h-10 text-eco-lime animate-pulse" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-eco-lime text-eco-forest font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                AI
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-eco-text">Snap or Upload Your Waste Photo</h2>
              <p className="text-xs text-eco-secondary mt-1">
                Gemini AI detects materials (plastic, glass, organic, e-waste) and guides you to the correct bin.
              </p>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="btn btn-primary cursor-pointer w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2">
                <CameraIcon className="w-5 h-5 text-eco-lime" />
                <span>Take Photo / Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!!status}
                  onChange={e => upload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Scanning Progress Overlay */}
          {status && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-eco-mint border-t-eco-emerald animate-spin" />
                <RecycleIcon className="w-8 h-8 text-eco-forest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-extrabold text-base text-eco-forest">{STATUS_TEXT[status]}</p>
                <p className="text-xs text-eco-secondary">Hold tight while WasteWise AI processes your image...</p>
              </div>
            </div>
          )}

          {/* Preview image if loaded */}
          {previewUrl && !status && !result && (
            <div className="max-w-xs mx-auto pt-2 space-y-2">
              <p className="text-xs font-bold text-eco-secondary uppercase">Previewing Image</p>
              <img src={previewUrl} alt="Uploaded waste item" className="w-full h-48 rounded-2xl object-cover border border-eco-border shadow-eco-sm mx-auto" />
            </div>
          )}
        </div>
      )}

      {/* Result Card / Wow Moment */}
      {result && !status && (
        <div className="card border-2 border-eco-emerald shadow-eco-lg p-6 sm:p-8 space-y-6 bg-gradient-to-br from-white via-white to-eco-mint/30">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-eco-border">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-eco-forest text-eco-lime text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  {result.mode === 'pickFromPhoto' ? 'Manual Verification Required' : 'AI Classification Complete'}
                </span>
                {result.confidence != null && (
                  <span className="text-xs font-bold text-eco-secondary">
                    {Math.round(result.confidence * 100)}% Match
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-eco-text tracking-tight">
                  {result.itemName || result.message}
                </h2>
                {result.estimatedKg != null && (
                  <p className="text-xs font-semibold text-eco-emerald mt-1 flex items-center gap-1">
                    <LeafIcon className="w-4 h-4" />
                    Estimated Landfill Diversion: ≈ {result.estimatedKg.toFixed(2)} kg
                  </p>
                )}
              </div>

              {/* Confidence Bar */}
              {result.confidence != null && (
                <div className="max-w-sm">
                  <ConfidenceBar confidence={result.confidence} />
                </div>
              )}
            </div>

            {/* Uploaded Image Thumbnail */}
            {result.imageUrl && (
              <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden border-2 border-eco-emerald shadow-eco-md">
                <img src={result.imageUrl} alt="Identified waste item" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Recommended Bin Highlight */}
          {result.category && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-eco-secondary">Target Disposal Bin</p>
              <BinBadge category={result.category} binColor={result.binColor} size="lg" />
            </div>
          )}

          {/* Low confidence suggestion mode */}
          {result.mode === 'pickFromPhoto' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
                <span>Vision AI Needs Your Confirmation</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {result.message || "We're not 100% sure about this photo. Select the closest item category below to log it."}
              </p>
            </div>
          )}

          {/* Verification Actions */}
          {result.logId && result.status === 'pending' && (
            <div className="p-5 rounded-2xl bg-eco-forest text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-eco-md">
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-eco-lime flex items-center gap-2">
                  <span>📍</span> Walk to the <u className="uppercase">{result.binColor} Bin</u>
                </p>
                <p className="text-xs text-emerald-100/90">
                  Tap "In the bin ✓" once you dispose of the item to credit +10 points to your account.
                </p>
              </div>
              <button
                className="px-6 py-3 rounded-xl bg-eco-lime text-eco-forest font-extrabold text-sm hover:bg-lime-300 shadow-eco-glow transition duration-150 shrink-0 flex items-center justify-center gap-2"
                onClick={verify}
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>In the Bin ✓ (+10 XP)</span>
              </button>
            </div>
          )}

          {result.logId && result.status === 'verified' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                <span>Disposal Verified! +{result.points || 10} Points Added.</span>
              </div>
              <Link to="/history" className="text-xs font-bold underline text-eco-forest">
                View My Impact →
              </Link>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button className="btn" onClick={reset}>
              Identify Another Item
            </button>
          </div>

        </div>
      )}

      {/* Quick Select Category Grid */}
      <div className="card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-eco-border pb-4">
          <div>
            <h2 className="font-extrabold text-lg text-eco-text flex items-center gap-2">
              <RecycleIcon className="w-5 h-5 text-eco-emerald" />
              {inPhotoPickMode ? 'Pick Closest Category (Photo Attached)' : 'Or Select Common Campus Items'}
            </h2>
            <p className="text-xs text-eco-secondary">
              Tap any item below to quickly log your disposal and claim +10 points instantly.
            </p>
          </div>
        </div>

        {/* Bin Color Palette Key */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          {BIN_KEY.map(k => (
            <div key={k.category} className="p-2.5 rounded-xl border border-eco-border bg-eco-bg flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ background: k.color }} />
              <div>
                <p className="font-bold text-eco-text text-xs">{k.label}</p>
                <p className="text-[10px] text-eco-muted truncate">{k.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {grid.map((it) => {
            const swatch = BIN_KEY.find(k => k.category === it.category);
            return (
              <button
                key={it.name}
                disabled={!!status}
                onClick={() => pickFromGrid(it, inPhotoPickMode ? pendingImageUrl : '')}
                className={`group flex flex-col justify-between p-3.5 text-left border rounded-2xl bg-white hover:border-eco-emerald hover:shadow-eco-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  inPhotoPickMode ? 'border-2 border-eco-forest bg-eco-mint/40' : 'border-eco-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ background: swatch?.color || '#16a34a' }} />
                  <span className="font-extrabold text-sm text-eco-text group-hover:text-eco-forest truncate">{it.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-eco-secondary mt-2 flex items-center justify-between">
                  <span>→ {swatch?.textColor || 'Bin'} bin</span>
                  <span className="text-eco-emerald group-hover:translate-x-0.5 transition">+10 pts</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Waste Type Form */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-extrabold text-base text-eco-text">Log Custom Waste Item</h2>
          <p className="text-xs text-eco-secondary">
            Don't see your item in the quick list? Enter any custom name and pick its recycling category.
          </p>
        </div>

        <CustomForm
          imageUrl={inPhotoPickMode ? pendingImageUrl : ''}
          disabled={!!status}
          busy={status === 'logging'}
          onLogged={(r) => {
            setResult({
              itemName: r.log.itemName,
              category: r.log.category,
              binColor: r.log.binColor,
              points: 0,
              estimatedKg: r.log.estimatedKg,
              imageUrl: r.log.imageUrl,
              status: r.log.status,
              logId: r.log._id,
              mode: 'photo',
            });
            setStatus(null);
          }}
          onError={(msg) => {
            setStatus(null);
            setErr(msg);
          }}
          onStart={() => {
            setErr('');
            setStatus('logging');
          }}
        />
      </div>

      {/* Error Alert */}
      {err && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">{err}</p>
            <p className="text-red-600/80 mt-0.5">Ensure your backend server is active and reachable.</p>
          </div>
        </div>
      )}

    </main>
  );
}

const CATEGORIES = [
  { value: 'wet_organic', label: 'Wet Organic (Green Bin)' },
  { value: 'dry_recyclable', label: 'Dry Recyclable (Blue Bin)' },
  { value: 'hazardous_ewaste', label: 'Hazardous / E-Waste (Red Bin)' },
  { value: 'reject_other', label: 'General / Reject (Black Bin)' },
];

function CustomForm({ imageUrl, busy, disabled, onLogged, onError, onStart }) {
  const { selectedCampusId } = useAuthStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('dry_recyclable');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      onError('Please type the item name first.');
      return;
    }
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
      onError(err.response?.data?.error || 'Could not log custom item.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
        <input
          className="field"
          placeholder="e.g. Coconut shell, takeaway coffee cup, broken glass"
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
        <button
          className="btn btn-primary"
          disabled={disabled || !name.trim()}
        >
          {busy ? 'Logging...' : 'Log Custom Waste'}
        </button>
      </div>
      {imageUrl && (
        <p className="text-xs text-eco-emerald font-semibold">
          ✓ Your uploaded image will be linked to this custom log.
        </p>
      )}
    </form>
  );
}
