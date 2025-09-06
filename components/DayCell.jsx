'use client';
export default function DayCell({ day, pnl=0, onClick }) {
  const positive = pnl > 0;
  const chip =
    pnl === 0 ? null :
    <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs tabnums
        ${positive ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-red/20 text-neon-red'}`}>
      {positive ? '▲' : '▼'} ${Math.abs(pnl).toFixed(0)}
    </span>;

  const heat = pnl === 0 ? 'hover:bg-white/5' :
               positive ? 'bg-neon-green/5 hover:bg-neon-green/10' :
                          'bg-neon-red/5 hover:bg-neon-red/10';

  return (
    <button onClick={onClick}
      className={`relative glass border border-line/70 text-left p-3 h-24 transition ${heat}`}>
      <div className="text-xs text-mute">{day}</div>
      {chip}
    </button>
  );
}