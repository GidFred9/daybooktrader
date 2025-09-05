'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VoiceNote = dynamic(() => import('../../components/VoiceNote'), { ssr: false });
const ScreenshotUpload = dynamic(() => import('../../components/ScreenshotUpload'), { ssr: false });

export default function DailyTradePage() {
  const { date } = useParams();
  const router = useRouter();

  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    []
  );

  const storageKey = useMemo(() => `dbt:trades:${date}`, [date]);

  const [trades, setTrades] = useState([]);
  const [currentTrade, setCurrentTrade] = useState({
    symbol: '',
    side: 'long',
    entryTime: '',
    exitTime: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    rr: '',
    pnl: 0,
    notes: '',
    emotions: { pre: '', during: '', post: '' },
    voiceNote: null,
    screenshots: [],
    tags: [],
    timezone: tz
  });

  // Load existing trades for this day
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTrades(JSON.parse(raw));
    } catch (_) {}
  }, [storageKey]);

  // Save whenever trades change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trades));
    } catch (_) {}
  }, [trades, storageKey]);

  const calcPnL = () => {
    const e = parseFloat(currentTrade.entryPrice);
    const x = parseFloat(currentTrade.exitPrice);
    const q = parseFloat(currentTrade.quantity);
    if (!isFinite(e) || !isFinite(x) || !isFinite(q)) return;
    const pnl = currentTrade.side === 'long' ? (x - e) * q : (e - x) * q;
    setCurrentTrade(t => ({ ...t, pnl: Number(pnl.toFixed(2)) }));
  };

  const saveTrade = () => {
    if (!currentTrade.symbol || !currentTrade.entryPrice || !currentTrade.exitPrice) {
      alert('Symbol, entry, and exit are required.');
      return;
    }
    setTrades(prev => [
      ...prev,
      { ...currentTrade, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    ]);
    // Reset form
    setCurrentTrade({
      symbol: '',
      side: 'long',
      entryTime: '',
      exitTime: '',
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      rr: '',
      pnl: 0,
      notes: '',
      emotions: { pre: '', during: '', post: '' },
      voiceNote: null,
      screenshots: [],
      tags: [],
      timezone: tz
    });
  };

  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">← Back</button>
          <h1 className="text-2xl font-bold">Trade Entry — {date}</h1>
          <span className="text-sm text-gray-500">Timezone: {tz}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
        {/* Left: form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add Trade</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <input className="w-full p-2 border rounded" value={currentTrade.symbol}
                onChange={e=>setCurrentTrade(t=>({...t, symbol:e.target.value.toUpperCase()}))}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Side</label>
              <select className="w-full p-2 border rounded" value={currentTrade.side}
                onChange={e=>setCurrentTrade(t=>({...t, side:e.target.value}))}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Entry Price</label>
              <input type="number" step="0.01" className="w-full p-2 border rounded"
                value={currentTrade.entryPrice}
                onChange={e=>setCurrentTrade(t=>({...t, entryPrice:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Price</label>
              <input type="number" step="0.01" className="w-full p-2 border rounded"
                value={currentTrade.exitPrice}
                onChange={e=>setCurrentTrade(t=>({...t, exitPrice:e.target.value}))}/>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" className="w-full p-2 border rounded"
                value={currentTrade.quantity}
                onChange={e=>setCurrentTrade(t=>({...t, quantity:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">R:R (optional)</label>
              <input className="w-full p-2 border rounded"
                value={currentTrade.rr}
                onChange={e=>setCurrentTrade(t=>({...t, rr:e.target.value}))}/>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (why you took it)</label>
              <textarea className="w-full p-2 border rounded" rows={3}
                value={currentTrade.notes}
                onChange={e=>setCurrentTrade(t=>({...t, notes:e.target.value}))}/>
            </div>

            {/* Emotions quick picks */}
            <div>
              <label className="block text-sm font-medium mb-1">Pre-trade</label>
              <select className="w-full p-2 border rounded"
                value={currentTrade.emotions.pre}
                onChange={e=>setCurrentTrade(t=>({...t, emotions:{...t.emotions, pre:e.target.value}}))}>
                <option value="">—</option>
                <option>Confident</option><option>FOMO</option><option>Fearful</option><option>Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">During</label>
              <select className="w-full p-2 border rounded"
                value={currentTrade.emotions.during}
                onChange={e=>setCurrentTrade(t=>({...t, emotions:{...t.emotions, during:e.target.value}}))}>
                <option value="">—</option>
                <option>Calm</option><option>Anxious</option><option>Greedy</option><option>Flow</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Post</label>
              <select className="w-full p-2 border rounded"
                value={currentTrade.emotions.post}
                onChange={e=>setCurrentTrade(t=>({...t, emotions:{...t.emotions, post:e.target.value}}))}>
                <option value="">—</option>
                <option>Satisfied</option><option>Regretful</option><option>Learning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">P&L</label>
              <div className={`p-2 border rounded font-bold ${currentTrade.pnl >= 0 ? 'text-green-600':'text-red-600'}`}>
                ${Number(currentTrade.pnl).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Voice Note Section */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium mb-2">Voice Note (record your thoughts)</label>
            <VoiceNote onSave={(blob, url) => {
              setCurrentTrade(t => ({ ...t, voiceNote: url }));
            }} />
          </div>

          {/* Screenshot Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Chart Screenshots</label>
            <ScreenshotUpload onUpload={(images) => {
              setCurrentTrade(t => ({ ...t, screenshots: images }));
            }} />
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={calcPnL} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">
              Calculate P&L
            </button>
            <button onClick={saveTrade} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Save Trade
            </button>
          </div>
        </div>

        {/* Right: today list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trades on {date}</h3>
          {trades.length === 0 && <div className="text-gray-500">No trades yet.</div>}
          {trades.map(t => (
            <div key={t.id} className="border-b py-3">
              <div className="flex justify-between">
                <div className="font-medium">{t.symbol} — {t.side.toUpperCase()}</div>
                <div className={`${t.pnl>=0?'text-green-600':'text-red-600'} font-bold`}>${Number(t.pnl).toFixed(2)}</div>
              </div>
              <div className="text-xs text-gray-500">
                Qty {t.quantity} • {t.entryPrice} → {t.exitPrice}
              </div>
              {t.notes && <div className="text-sm mt-1 text-gray-700">{t.notes}</div>}
              {(t.emotions.pre || t.emotions.during || t.emotions.post) && (
                <div className="text-xs text-gray-600 mt-1">
                  Emotions: {t.emotions.pre} → {t.emotions.during} → {t.emotions.post}
                </div>
              )}
              {t.voiceNote && (
                <div className="mt-2">
                  <audio controls src={t.voiceNote} className="w-full h-8" />
                </div>
              )}
              {t.screenshots && t.screenshots.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {t.screenshots.map((img, idx) => (
                    <img key={idx} src={img.url} className="h-16 w-16 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xl font-bold">
              Day Total: <span className={totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}