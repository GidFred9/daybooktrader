'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import DayCell from '@/components/DayCell';
import NeonButton from '@/components/NeonButton';

export default function Home() {
  const router = useRouter();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const [stats, setStats] = useState({ pnl: 0, wins: 0, trades: 0 });
  const daysInMonth = useMemo(() => new Date(y, m + 1, 0).getDate(), [y, m]);

  const go = (day) => {
    const date = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    router.push(`/day/${date}`);
  };

  useEffect(() => {
    // aggregate stats from localStorage
    let pnl=0, wins=0, trades=0;
    for (let d=1; d<=daysInMonth; d++) {
      const key = `dbt:trades:${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const dayTrades = JSON.parse(raw);
      for (const t of dayTrades) {
        if (t.type === 'voice' || t.type === 'screenshot') continue;
        trades++; pnl += Number(t.pnl||0); if (Number(t.pnl) > 0) wins++;
      }
    }
    setStats({ pnl, wins, trades });
  }, [daysInMonth, y, m]);

  const winRate = stats.trades ? Math.round((stats.wins / stats.trades) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Month P&L" value={`$${stats.pnl.toFixed(2)}`} delta="" positive={stats.pnl>=0}/>
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Total Trades" value={stats.trades} />
      </div>

      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <NeonButton onClick={() => go(now.getDate())}>+ Add Trade</NeonButton>
        </div>

        {/* Week headers */}
        <div className="grid grid-cols-7 gap-2 mt-4 text-center text-xs text-mute">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d}>{d}</div>)}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-2 mt-2">
          {Array.from({length: daysInMonth}, (_,i)=>i+1).map(day => {
            // fetch day pnl from storage (sum)
            const key = `dbt:trades:${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
            let pnl = 0;
            if (raw) for (const t of JSON.parse(raw)) if (!t.type) pnl += Number(t.pnl||0);
            return <DayCell key={day} day={day} pnl={pnl} onClick={()=>go(day)} />;
          })}
        </div>
      </div>
    </div>
  );
}
