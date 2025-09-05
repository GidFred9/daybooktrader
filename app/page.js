'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const [stats, setStats] = useState({ pnl: 0, wins: 0, trades: 0 });

  const daysInMonth = useMemo(() => new Date(y, m + 1, 0).getDate(), [y, m]);

  const handleDayClick = (day) => {
    const date = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    router.push(`/day/${date}`);
  };

  useEffect(() => {
    // Aggregate month stats from localStorage
    let pnl = 0, wins = 0, trades = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const raw = localStorage.getItem(`dbt:trades:${dateKey}`);
      if (!raw) continue;
      const dayTrades = JSON.parse(raw);
      for (const t of dayTrades) {
        trades += 1;
        pnl += Number(t.pnl || 0);
        if (Number(t.pnl) > 0) wins += 1;
      }
    }
    setStats({ pnl, wins, trades });
  }, [daysInMonth, y, m]);

  const winRate = stats.trades ? Math.round((stats.wins / stats.trades) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">DayBook Trader</h1>
          <p className="text-gray-600">Track your trades, track your growth</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-sm font-medium text-gray-600">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(daysInMonth)].map((_, i) => (
              <button key={i}
                className="p-4 border rounded hover:bg-blue-50 transition-colors"
                onClick={() => handleDayClick(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-600">Month P&L</h3>
            <div className={`text-2xl font-bold mt-2 ${stats.pnl>=0?'text-green-700':'text-red-700'}`}>
              ${stats.pnl.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-600">Win Rate</h3>
            <div className="text-2xl font-bold mt-2">{winRate}%</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-600">Total Trades</h3>
            <div className="text-2xl font-bold mt-2">{stats.trades}</div>
          </div>
        </div>
      </main>
    </div>
  );
}