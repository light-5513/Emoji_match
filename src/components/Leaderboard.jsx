import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../utils/api.js';

export default function Leaderboard({ onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard(50)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleString();
  }

  return (
    <div className="checker-bg min-h-screen w-full flex flex-col">
      <header className="w-full px-6 pt-6 pb-4 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            EMOJI MIMIC GAME
          </h1>
          <span className="bg-coral-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
            GAME
          </span>
        </div>
        <button onClick={onBack} className="btn-outline px-5 py-2 text-sm">
          BACK
        </button>
      </header>

      <main className="flex-1 px-6 pb-10">
        <div className="max-w-4xl mx-auto card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight">🏆 Leaderboard</h2>
            <span className="text-xs font-semibold tracking-widest text-slate-500">
              TOP {rows.length} OF ALL TIME
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500">Loading…</div>
          ) : error ? (
            <div className="py-16 text-center text-coral-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No scores yet. Be the first!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3 text-right">Score</th>
                    <th className="py-3 px-3 text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r._id || i}
                      className={`border-t border-slate-100 ${i < 3 ? 'bg-coral-50/40' : ''}`}
                    >
                      <td className="py-3 px-3 font-extrabold">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold">{r.name}</td>
                      <td className="py-3 px-3 text-slate-600">{r.rollNumber}</td>
                      <td className="py-3 px-3 text-slate-500 text-sm">{r.email}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-coral-600">
                        {r.total}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-400">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full text-center pb-6 text-xs text-slate-400 tracking-wider">
        powered by <span className="font-bold text-slate-600">Technical Hub</span>
      </footer>
    </div>
  );
}
