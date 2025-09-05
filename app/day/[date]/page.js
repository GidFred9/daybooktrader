'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VoiceNote = dynamic(() => import('../../components/VoiceNote'), { ssr: false });
const ScreenshotUpload = dynamic(() => import('../../components/ScreenshotUpload'), { ssr: false });

// Common trading symbols
const SYMBOLS = {
  'Stocks': ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'BAC', 'WMT', 'V', 'MA', 'DIS', 'NFLX', 'AMD', 'INTC', 'PYPL', 'CRM'],
  'ETFs': ['IWM', 'DIA', 'VTI', 'VOO', 'EEM', 'GLD', 'SLV', 'TLT', 'XLF', 'XLE', 'XLK', 'ARKK'],
  'Futures': ['ES', 'NQ', 'RTY', 'YM', 'CL', 'GC', 'SI', 'ZB', 'ZN', 'ZC', 'ZW', 'NG'],
  'Crypto': ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'MATIC', 'LINK', 'DOT'],
  'Forex': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF']
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Australia/Sydney'
];

export default function DailyTradePage() {
  const { date } = useParams();
  const router = useRouter();

  const [selectedTZ, setSelectedTZ] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  const storageKey = useMemo(() => `dbt:trades:${date}`, [date]);

  const [trades, setTrades] = useState([]);
  const [showSymbolList, setShowSymbolList] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  
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
    voiceTranscript: '',
    screenshots: [],
    timezone: selectedTZ
  });

  // Load existing trades
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTrades(JSON.parse(raw));
    } catch (_) {}
  }, [storageKey]);

  // Save trades
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
      voiceTranscript: '',
      screenshots: [],
      timezone: selectedTZ
    });
  };

  const filteredSymbols = () => {
    const allSymbols = [];
    Object.entries(SYMBOLS).forEach(([category, symbols]) => {
      symbols.forEach(symbol => {
        if (symbol.toLowerCase().includes(symbolSearch.toLowerCase())) {
          allSymbols.push({ symbol, category });
        }
      });
    });
    return allSymbols;
  };

  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">← Back</button>
          <h1 className="text-2xl font-bold">Trade Entry — {date}</h1>
          <select 
            className="text-sm border rounded px-2 py-1"
            value={selectedTZ}
            onChange={(e) => {
              setSelectedTZ(e.target.value);
              setCurrentTrade(t => ({ ...t, timezone: e.target.value }));
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6">
        {/* Left: form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Add Trade</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Symbol with dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <input 
                className="w-full p-2 border rounded" 
                value={currentTrade.symbol}
                onChange={e => {
                  setCurrentTrade(t => ({...t, symbol: e.target.value.toUpperCase()}));
                  setSymbolSearch(e.target.value);
                  setShowSymbolList(true);
                }}
                onFocus={() => setShowSymbolList(true)}
                placeholder="Type or select..."
              />
              {showSymbolList && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSymbols().map(({ symbol, category }) => (
                    <button
                      key={symbol}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between"
                      onClick={() => {
                        setCurrentTrade(t => ({...t, symbol}));
                        setShowSymbolList(false);
                      }}
                    >
                      <span className="font-medium">{symbol}</span>
                      <span className="text-xs text-gray-500">{category}</span>
                    </button>
                  ))}
                </div>
              )}
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
              <label className="block text-sm font-medium mb-1">Quantity (Contracts/Lots)</label>
              <input type="number" className="w-full p-2 border rounded"
                value={currentTrade.quantity}
                onChange={e=>setCurrentTrade(t=>({...t, quantity:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">R:R</label>
              <input className="w-full p-2 border rounded"
                value={currentTrade.rr}
                onChange={e=>setCurrentTrade(t=>({...t, rr:e.target.value}))}/>
            </div>

            {/* Entry/Exit Times */}
            <div>
              <label className="block text-sm font-medium mb-1">Entry Time</label>
              <input type="time" className="w-full p-2 border rounded"
                value={currentTrade.entryTime}
                onChange={e=>setCurrentTrade(t=>({...t, entryTime:e.target.value}))}/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exit Time</label>
              <input type="time" className="w-full p-2 border rounded"
                value={currentTrade.exitTime}
                onChange={e=>setCurrentTrade(t=>({...t, exitTime:e.target.value}))}/>
            </div>

            {/* P&L Section */}
            <div className="col-span-2 border rounded p-3 bg-gray-50">
              <label className="block text-sm font-medium mb-2">P&L</label>
              <div className="flex gap-2 items-center">
                <button onClick={calcPnL} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">
                  Calculate
                </button>
                <div className={`px-3 py-2 font-bold ${currentTrade.pnl >= 0 ? 'text-green-600':'text-red-600'}`}>
                  ${Number(currentTrade.pnl).toFixed(2)}
                </div>
                <span className="text-sm text-gray-500">OR</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-32 p-2 border rounded"
                  placeholder="Enter manually"
                  value={currentTrade.manualPnl}
                  onChange={e=>setCurrentTrade(t=>({...t, manualPnl:e.target.value, pnl: 0}))}
                />
              </div>
            </div>

            {/* Trade Notes */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Pre-Trade Analysis</label>
              <textarea className="w-full p-2 border rounded" rows={2}
                placeholder="Why are you taking this trade? Setup, confluence..."
                value={currentTrade.preTradeNote}
                onChange={e=>setCurrentTrade(t=>({...t, preTradeNote:e.target.value}))}/>
            </div>

            {/* Emotions with text options */}
            <div className="col-span-2 grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Pre-Trade Emotion</label>
                <select className="w-full p-2 border rounded mb-1"
                  value={currentTrade.emotions.pre}
                  onChange={e=>setCurrentTrade(t=>({...t, emotions:{...t.emotions, pre:e.target.value}}))}>
                  <option value="">Select...</option>
                  <option>Confident</option>
                  <option>FOMO</option>
                  <option>Fearful</option>
                  <option>Neutral</option>
                  <option>Revenge</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">During Trade</label>
                <input 
                  className="w-full p-2 border rounded"
                  placeholder="Your state..."
                  value={currentTrade.duringTradeNote}
                  onChange={e=>setCurrentTrade(t=>({...t, duringTradeNote:e.target.value}))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Post-Trade Emotion</label>
                <select className="w-full p-2 border rounded mb-1"
                  value={currentTrade.emotions.post}
                  onChange={e=>setCurrentTrade(t=>({...t, emotions:{...t.emotions, post:e.target.value}}))}>
                  <option value="">Select...</option>
                  <option>Satisfied</option>
                  <option>Regretful</option>
                  <option>Learning</option>
                  <option>Frustrated</option>
                  <option>Proud</option>
                </select>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Post-Trade Reflection</label>
              <textarea className="w-full p-2 border rounded" rows={2}
                placeholder="What did you learn? What would you do differently?"
                value={currentTrade.postTradeNote}
                onChange={e=>setCurrentTrade(t=>({...t, postTradeNote:e.target.value}))}/>
            </div>
          </div>

          {/* Voice Note with Transcription */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium mb-2">Voice Note</label>
            <VoiceNote onSave={(blob, url) => {
              setCurrentTrade(t => ({ ...t, voiceNote: url }));
            }} />
            <textarea 
              className="w-full mt-2 p-2 border rounded text-sm"
              rows={2}
              placeholder="Transcribe your voice note here..."
              value={currentTrade.voiceTranscript}
              onChange={e=>setCurrentTrade(t=>({...t, voiceTranscript:e.target.value}))}
            />
          </div>

          {/* Screenshots */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Chart Screenshots</label>
            <ScreenshotUpload onUpload={(images) => {
              setCurrentTrade(t => ({ ...t, screenshots: images }));
            }} />
          </div>

          <button onClick={saveTrade} className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            Save Trade
          </button>
        </div>

        {/* Right: trades list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trades on {date}</h3>
          {trades.length === 0 && <div className="text-gray-500">No trades yet.</div>}
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trades.map(t => (
              <div key={t.id} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{t.symbol} — {t.side.toUpperCase()}</span>
                  <span className={`font-bold ${t.pnl>=0?'text-green-600':'text-red-600'}`}>
                    ${Number(t.pnl).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {t.quantity && <div>Qty: {t.quantity} | {t.entryPrice} → {t.exitPrice}</div>}
                  {t.entryTime && <div>Time: {t.entryTime} → {t.exitTime}</div>}
                  {t.preTradeNote && <div className="mt-2 text-sm">Pre: {t.preTradeNote}</div>}
                  {t.postTradeNote && <div className="text-sm">Post: {t.postTradeNote}</div>}
                  {t.voiceTranscript && <div className="italic">Voice: {t.voiceTranscript}</div>}
                </div>
              </div>
            ))}
          </div>
          
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