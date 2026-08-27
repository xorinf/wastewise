import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const user = useAuthStore(s => s.user);
  const nav = useNavigate();

  const cards = [
    { to: '/identify', title: 'Identify an item', body: 'Upload a photo or pick from the quick grid.' },
    { to: '/pickup',   title: 'Report pickup / supply', body: 'Flag a full bin or request supplies.' },
    { to: '/history',  title: 'See my impact', body: 'Items logged and estimated kg diverted.' },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Hi {user?.name}</h1>
      <p className="text-gray-600">Choose what you'd like to do.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <button key={c.to} onClick={() => nav(c.to)} className="card text-left hover:border-gray-900">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{c.body}</p>
          </button>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Quick stats</h3>
        <p className="text-sm text-gray-600">Open <strong>My Impact</strong> to see items logged, kg diverted and your history.</p>
      </div>
    </main>
  );
}
