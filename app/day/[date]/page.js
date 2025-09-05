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
    
    const finalPnl = currentTrade.manualPnl || currentTrade.pnl;
    
    setTrades(prev => [
      ...prev,
      { 
        ...currentTrade, 
        pnl: finalPnl,
        id: crypto.randomUUID(), 
        createdAt: new Date().toISOString() 
      }
    ]);
    
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      {/* Animated background effect */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-cyan-600/10 blur-3xl"></div>
      </div>
      
      {/* Header */}
      <header className="relative backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/')} 
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
            >
              <span className="text-2xl">←</span> Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Trade Entry</h1>
              <p className="text-sm text-gray-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <select 
            className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-400/50"
            value={selectedTZ}
            onChange={(e) => {
              setSelectedTZ(e.target.value);
              setCurrentTrade(t => ({ ...t, timezone: e.target.value }));
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz} className="bg-gray-900">{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-5 gap-6">
        {/* Left: Trade Form - spans 3 columns */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            New Trade Entry
          </h2>

          {/* Symbol Selector with Category Pills */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-300">Symbol Selection</label>
            
            {/* Category Pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {Object.keys(SYMBOLS).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-cyan-300'
                      : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Trade Direction */}
            <div className="col-span-2 mb-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentTrade(t => ({...t, side: 'long'}))}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    currentTrade.side === 'long'
                      ? 'bg-green-500/20 border border-green-400/50 text-green-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  LONG ↗
                </button>
                <button
                  onClick={() => setCurrentTrade(t => ({...t, side: 'short'}))}
                  className={`py-3 rounded-lg font-medium transition-all ${
                    currentTrade.side === 'short'
                      ? 'bg-red-500/20 border border-red-400/50 text-red-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  SHORT ↘
                </button>
              </div>
            </div>

            {/* Price Inputs */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Entry Price</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                value={currentTrade.entryPrice}
                onChange={e => setCurrentTrade(t => ({...t, entryPrice: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Exit Price</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                value={currentTrade.exitPrice}
                onChange={e => setCurrentTrade(t => ({...t, exitPrice: e.target.value}))}
              />
            </div>

            {/* Quantity and R:R */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Quantity (Contracts/Lots)</label>
              <input 
                type="number"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                value={currentTrade.quantity}
                onChange={e => setCurrentTrade(t => ({...t, quantity: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Risk:Reward</label>
              <input 
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                placeholder="1:2"
                value={currentTrade.rr}
                onChange={e => setCurrentTrade(t => ({...t, rr: e.target.value}))}
              />
            </div>

            {/* P&L Section */}
            <div className="col-span-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-400/20">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Profit & Loss</label>
                <button 
                  onClick={calcPnL}
                  className="px-4 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-all"
                >
                  Calculate
                </button>
              </div>
              <div className="flex gap-3 items-center">
                <div className={`text-2xl font-bold ${currentTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Number(currentTrade.pnl).toFixed(2)}
                </div>
                <span className="text-gray-500">or</span>
                <input 
                  type="number" 
                  step="0.01"
                  className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                  placeholder="Enter manually"
                  value={currentTrade.manualPnl}
                  onChange={e => setCurrentTrade(t => ({...t, manualPnl: e.target.value, pnl: 0}))}
                />
              </div>
            </div>

            {/* Emotions */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Emotional State</label>
              <div className="grid grid-cols-3 gap-2">
                <select 
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  value={currentTrade.emotions.pre}
                  onChange={e => setCurrentTrade(t => ({...t, emotions: {...t.emotions, pre: e.target.value}}))}
                >
                  <option value="" className="bg-gray-900">Pre-Trade</option>
                  <option className="bg-gray-900">Confident</option>
                  <option className="bg-gray-900">FOMO</option>
                  <option className="bg-gray-900">Fearful</option>
                  <option className="bg-gray-900">Neutral</option>
                </select>
                <input 
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
                  placeholder="During..."
                  value={currentTrade.duringTradeNote}
                  onChange={e => setCurrentTrade(t => ({...t, duringTradeNote: e.target.value}))}
                />
                <select 
                  className="p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  value={currentTrade.emotions.post}
                  onChange={e => setCurrentTrade(t => ({...t, emotions: {...t.emotions, post: e.target.value}}))}
                >
                  <option value="" className="bg-gray-900">Post-Trade</option>
                  <option className="bg-gray-900">Satisfied</option>
                  <option className="bg-gray-900">Regretful</option>
                  <option className="bg-gray-900">Learning</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-300">Trade Notes</label>
              <textarea 
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 resize-none"
                rows={3}
                placeholder="Why did you take this trade? Setup, confluence factors..."
                value={currentTrade.preTradeNote}
                onChange={e => setCurrentTrade(t => ({...t, preTradeNote: e.target.value}))}
              />
            </div>

            {/* Media */}
            <div className="col-span-2 space-y-4">
              <VoiceNote onSave={(blob, url) => setCurrentTrade(t => ({ ...t, voiceNote: url }))} />
              <ScreenshotUpload onUpload={(images) => setCurrentTrade(t => ({ ...t, screenshots: images }))} />
            </div>
          </div>

          <button 
            onClick={saveTrade}
            className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02]"
          >
            Save Trade Entry
          </button>
        </div>

        {/* Right: Stats & Trades - spans 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-400/20">
                <p className="text-xs text-green-300 mb-1">P&L</p>
                <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${totalPnl.toFixed(2)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-400/20">
                <p className="text-xs text-blue-300 mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Today's Trades</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {trades.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No trades recorded yet</p>
              ) : (
                trades.map(t => (
                  <div key={t.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono text-white font-medium">{t.symbol}</span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          t.side === 'long' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {t.side.toUpperCase()}
                        </span>
                      </div>
                      <span className={`font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${Number(t.pnl).toFixed(2)}
                      </span>
                    </div>
                    {t.preTradeNote && (
                      <p className="text-xs text-gray-400 mt-2">{t.preTradeNote}</p>
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