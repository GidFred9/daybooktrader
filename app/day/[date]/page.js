'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VoiceNote = dynamic(() => import('../../components/VoiceNote'), { ssr: false });
const ScreenshotUpload = dynamic(() => import('../../components/ScreenshotUpload'), { ssr: false });

// Trading symbols organized by category
const SYMBOLS = {
  'Indices': ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO'],
  'Tech': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD'],
  'Finance': ['JPM', 'BAC', 'GS', 'MS', 'WFC', 'C', 'AXP', 'V', 'MA'],
  'Futures': ['ES', 'NQ', 'RTY', 'YM', 'CL', 'GC', 'SI', 'ZB'],
  'Crypto': ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'MATIC'],
  'Forex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD']
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo'
];

// Emotion chips component
function EmotionChip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        selected 
          ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30' 
          : 'bg-[#111827] text-[#9CA3AF] border border-[#1F2937] hover:border-[#60A5FA]/30'
      }`}
    >
      {label}
    </button>
  );
}

export default function DailyTradePage() {
  const { date } = useParams();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Indices');
  const [selectedTZ, setSelectedTZ] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
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
    manualPnl: '',
    pnl: 0,
    rr: '',
    preTradeNote: '',
    duringTradeNote: '',
    postTradeNote: '',
    emotions: { pre: '', during: '', post: '' },
    voiceNote: null,
    screenshots: [],
    timezone: selectedTZ
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTrades(JSON.parse(raw));
    } catch (_) {}
  }, [storageKey]);

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
    setCurrentTrade(t => ({ ...t, pnl: Number(pnl.toFixed(2)), manualPnl: '' }));
  };

  const saveTrade = () => {
    if (!currentTrade.symbol || (!currentTrade.pnl && !currentTrade.manualPnl)) {
      alert('Symbol and P&L are required.');
      return;
    }
    
    const finalPnl = parseFloat(currentTrade.manualPnl || currentTrade.pnl);
    
    setTrades(prev => [
      ...prev,
      { 
        ...currentTrade, 
        pnl: finalPnl,
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString() 
      }
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
      manualPnl: '',
      pnl: 0,
      rr: '',
      preTradeNote: '',
      duringTradeNote: '',
      postTradeNote: '',
      emotions: { pre: '', during: '', post: '' },
      voiceNote: null,
      screenshots: [],
      timezone: selectedTZ
    });
  };

  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const winRate = trades.length ? Math.round((trades.filter(t => t.pnl > 0).length / trades.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/')} 
              className="text-[#60A5FA] hover:text-[#60A5FA]/80 transition-colors"
            >
              ← Back to Calendar
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#E5E7EB]">Trade Entry</h1>
              <p className="text-sm text-[#9CA3AF]">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <select 
            className="bg-[#111827] border border-[#1F2937] text-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#60A5FA]/50"
            value={selectedTZ}
            onChange={(e) => {
              setSelectedTZ(e.target.value);
              setCurrentTrade(t => ({ ...t, timezone: e.target.value }));
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-6">
        {/* Left: Trade Form - spans 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1F2937] bg-[#0F172A] p-6">
          <h2 className="text-lg font-semibold mb-6 text-[#E5E7EB]">Journal Entry</h2>

          {/* Symbol Selector with Category Tabs */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-[#9CA3AF]">Symbol</label>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {Object.keys(SYMBOLS).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30' 
                      : 'bg-[#111827] text-[#9CA3AF] border border-[#1F2937] hover:border-[#60A5FA]/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Symbol Grid */}
            <div className="grid grid-cols-4 gap-2">
              {SYMBOLS[selectedCategory].map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setCurrentTrade(t => ({...t, symbol}))}
                  className={`p-3 rounded-lg text-sm font-mono transition-all ${
                    currentTrade.symbol === symbol
                      ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30'
                      : 'bg-[#111827] border border-[#1F2937] text-[#E5E7EB] hover:border-[#60A5FA]/30'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Details Grid */}
          <div className="space-y-4">
            {/* Direction */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">Side</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentTrade(t => ({...t, side: 'long'}))}
                  className={`py-2.5 rounded-lg font-medium transition-all ${
                    currentTrade.side === 'long'
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                      : 'bg-[#111827] border border-[#1F2937] text-[#9CA3AF] hover:border-[#10B981]/30'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => setCurrentTrade(t => ({...t, side: 'short'}))}
                  className={`py-2.5 rounded-lg font-medium transition-all ${
                    currentTrade.side === 'short'
                      ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                      : 'bg-[#111827] border border-[#1F2937] text-[#9CA3AF] hover:border-[#EF4444]/30'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            {/* Prices and Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">Entry Price</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full p-2.5 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50 tabular-nums"
                  value={currentTrade.entryPrice}
                  onChange={e => setCurrentTrade(t => ({...t, entryPrice: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">Exit Price</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full p-2.5 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50 tabular-nums"
                  value={currentTrade.exitPrice}
                  onChange={e => setCurrentTrade(t => ({...t, exitPrice: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">Quantity (Contracts/Lots)</label>
                <input 
                  type="number"
                  className="w-full p-2.5 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50 tabular-nums"
                  value={currentTrade.quantity}
                  onChange={e => setCurrentTrade(t => ({...t, quantity: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">R:R</label>
                <input 
                  className="w-full p-2.5 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50"
                  placeholder="1:2"
                  value={currentTrade.rr}
                  onChange={e => setCurrentTrade(t => ({...t, rr: e.target.value}))}
                />
              </div>
            </div>

            {/* P&L Section */}
            <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#9CA3AF]">P&L</label>
                <button 
                  onClick={calcPnL}
                  className="px-3 py-1 bg-[#60A5FA]/20 hover:bg-[#60A5FA]/30 text-[#60A5FA] rounded-lg text-sm transition-all"
                >
                  Auto Calculate
                </button>
              </div>
              <div className="flex gap-3 items-center">
                <div className={`text-2xl font-bold tabular-nums ${currentTrade.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  ${Number(currentTrade.pnl).toFixed(2)}
                </div>
                <span className="text-[#4B5563]">or</span>
                <input 
                  type="number" 
                  step="0.01"
                  className="flex-1 p-2 bg-[#0F172A] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50 tabular-nums"
                  placeholder="Enter manually"
                  value={currentTrade.manualPnl}
                  onChange={e => setCurrentTrade(t => ({...t, manualPnl: e.target.value, pnl: 0}))}
                />
              </div>
            </div>

            {/* Emotions */}
            <div>
              <label className="block text-sm font-medium mb-3 text-[#9CA3AF]">Emotions</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-xs text-[#4B5563] w-16">Pre:</span>
                  {['Confident', 'FOMO', 'Fearful', 'Calm'].map(emotion => (
                    <EmotionChip
                      key={emotion}
                      label={emotion}
                      selected={currentTrade.emotions.pre === emotion}
                      onClick={() => setCurrentTrade(t => ({...t, emotions: {...t.emotions, pre: emotion}}))}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-[#4B5563] w-16">Post:</span>
                  {['Satisfied', 'Regretful', 'Learning', 'Frustrated'].map(emotion => (
                    <EmotionChip
                      key={emotion}
                      label={emotion}
                      selected={currentTrade.emotions.post === emotion}
                      onClick={() => setCurrentTrade(t => ({...t, emotions: {...t.emotions, post: emotion}}))}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#9CA3AF]">Trade Notes</label>
              <textarea 
                className="w-full p-3 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#4B5563] focus:outline-none focus:border-[#60A5FA]/50 resize-none"
                rows={3}
                placeholder="Setup, confluence, market conditions..."
                value={currentTrade.preTradeNote}
                onChange={e => setCurrentTrade(t => ({...t, preTradeNote: e.target.value}))}
              />
            </div>

            {/* Media */}
            <div className="space-y-4 pt-4 border-t border-[#1F2937]">
              <VoiceNote onSave={(blob, url) => setCurrentTrade(t => ({ ...t, voiceNote: url }))} />
              <ScreenshotUpload onUpload={(images) => setCurrentTrade(t => ({ ...t, screenshots: images }))} />
            </div>
          </div>

          <button 
            onClick={saveTrade}
            className="w-full mt-6 py-3 bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white font-semibold rounded-lg transition-all"
          >
            Save Trade
          </button>
        </div>

        {/* Right: Session Timeline */}
        <div className="space-y-4">
          {/* Session Stats */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4">
            <h3 className="text-sm font-medium mb-3 text-[#9CA3AF]">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Total P&L</span>
                <span className={`font-semibold tabular-nums ${totalPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  ${totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Win Rate</span>
                <span className="font-semibold tabular-nums text-[#E5E7EB]">{winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Trades</span>
                <span className="font-semibold tabular-nums text-[#E5E7EB]">{trades.length}</span>
              </div>
            </div>
          </div>

          {/* Session Timeline */}
          <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4">
            <h3 className="text-sm font-medium mb-3 text-[#9CA3AF]">Session Timeline</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {trades.length === 0 ? (
                <p className="text-[#4B5563] text-sm text-center py-8">No trades yet</p>
              ) : (
                trades.map(t => (
                  <div key={t.id} className="rounded-lg border border-[#1F2937] bg-[#111827] p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-sm text-[#E5E7EB]">{t.symbol}</span>
                      <span className={`text-sm font-semibold tabular-nums ${t.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {t.pnl >= 0 ? '▲' : '▼'}${Math.abs(t.pnl).toFixed(2)}
                      </span>
                    </div>
                    {t.emotions.pre && (
                      <div className="flex gap-1 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-[#60A5FA]/10 text-[#60A5FA] rounded">{t.emotions.pre}</span>
                        {t.emotions.post && (
                          <span className="text-xs px-2 py-0.5 bg-[#60A5FA]/10 text-[#60A5FA] rounded">{t.emotions.post}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}