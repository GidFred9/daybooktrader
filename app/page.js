'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// StatCard Component
function StatCard({ label, value, delta, positive = true, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-[#9CA3AF]" />}
        <span className="text-sm text-[#9CA3AF]">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-[#E5E7EB]">{value}</span>
        {delta != null && (
          <span className={`text-sm tabular-nums ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {positive ? '▲' : '▼'} {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// DayCell Component with heat map
function DayCell({ day, date, pnl = 0, trades = 0, onClick }) {
  const heat =
    pnl === 0 ? 'bg-transparent'
    : pnl > 0 ? 'bg-[#10B981]/10 hover:bg-[#10B981]/15'
    : 'bg-[#EF4444]/10 hover:bg-[#EF4444]/15';

  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border border-[#1F2937] p-3 text-left transition-all hover:shadow-sm ${heat}`}
    >
      <div className="text-xs text-[#9CA3AF]">{day}</div>
      {pnl !== 0 && (
        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums
          ${pnl > 0 ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
          {pnl > 0 ? '▲' : '▼'}${Math.abs(pnl).toFixed(0)}
        </span>
      )}
      {trades > 0 && (
        <div className="mt-4 text-[10px] text-[#9CA3AF]">{trades} trade{trades > 1 ? 's' : ''}</div>
      )}
    </button>
  );
}

export default function Home() {
  const router = useRouter();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const [stats, setStats] = useState({ pnl: 0, wins: 0, trades: 0 });
  const [dayStats, setDayStats] = useState({});

  const daysInMonth = useMemo(() => new Date(y, m + 1, 0).getDate(), [y, m]);
  const firstDay = useMemo(() => new Date(y, m, 1).getDay(), [y, m]);

  useEffect(() => {
    // Aggregate stats
    let pnl = 0, wins = 0, trades = 0;
    const dailyStats = {};
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const raw = localStorage.getItem(`dbt:trades:${dateKey}`);
      if (raw) {
        const dayTrades = JSON.parse(raw);
        let dayPnl = 0;
        for (const t of dayTrades) {
          trades += 1;
          const tradePnl = Number(t.pnl || 0);
          pnl += tradePnl;
          dayPnl += tradePnl;
          if (tradePnl > 0) wins += 1;
        }
        dailyStats[d] = { pnl: dayPnl, trades: dayTrades.length };
      }
    }
    
    setStats({ pnl, wins, trades });
    setDayStats(dailyStats);
  }, [daysInMonth, y, m]);

  const winRate = stats.trades ? Math.round((stats.wins / stats.trades) * 100) : 0;

  const handleDayClick = (day) => {
    const date = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    router.push(`/day/${date}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* App Shell Header */}
      <header className="border-b border-[#1F2937] bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-[#E5E7EB]">DayBook Trader</h1>
            <nav className="flex gap-6">
              <button className="text-[#60A5FA] font-medium">Dashboard</button>
              <button className="text-[#9CA3AF] hover:text-[#E5E7EB]">Analytics</button>
              <button className="text-[#9CA3AF] hover:text-[#E5E7EB]">Settings</button>
            </nav>
          </div>
          <button 
            onClick={() => handleDayClick(new Date().getDate())}
            className="px-4 py-2 bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white rounded-lg font-medium transition-colors"
          >
            + Add Trade
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Month Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard 
            label="Month P&L" 
            value={`$${stats.pnl.toFixed(2)}`}
            delta={stats.pnl > 0 ? `+${Math.abs(stats.pnl).toFixed(0)}` : `-${Math.abs(stats.pnl).toFixed(0)}`}
            positive={stats.pnl >= 0}
          />
          <StatCard 
            label="Win Rate" 
            value={`${winRate}%`}
            delta={winRate > 50 ? `+${winRate - 50}` : `-${50 - winRate}`}
            positive={winRate >= 50}
          />
          <StatCard 
            label="Total Trades" 
            value={stats.trades}
          />
        </div>

        {/* Calendar Grid */}
        <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-6">
          <h2 className="text-lg font-semibold mb-6 text-[#E5E7EB]">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-[#9CA3AF] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for first week alignment */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="p-3"></div>
            ))}
            
            {/* Actual days */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const stats = dayStats[day] || { pnl: 0, trades: 0 };
              
              return (
                <DayCell
                  key={day}
                  day={day}
                  pnl={stats.pnl}
                  trades={stats.trades}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-6 text-xs text-[#9CA3AF] text-center">
          Press <kbd className="px-2 py-1 bg-[#111827] border border-[#1F2937] rounded">N</kbd> for new trade, 
          <kbd className="ml-2 px-2 py-1 bg-[#111827] border border-[#1F2937] rounded">←</kbd>
          <kbd className="px-2 py-1 bg-[#111827] border border-[#1F2937] rounded">→</kbd> to change months
        </div>
      </main>
    </div>
  );
}