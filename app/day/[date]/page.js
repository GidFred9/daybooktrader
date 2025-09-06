'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';
import NeonButton from '@/components/NeonButton';

export default function DailyTradePage() {
  const { date } = useParams();
  const router = useRouter();
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const storageKey = useMemo(() => `dbt:trades:${date}`, [date]);

  const [trades, setTrades] = useState([]);
  const [t, setT] = useState({
    symbol:'', side:'long', entryPrice:'', exitPrice:'', quantity:'',
    rr:'', pnl:0, notes:'', emotions:{pre:'',during:'',post:''}, timezone: tz
  });

  useEffect(()=>{ const raw=localStorage.getItem(storageKey); if(raw) setTrades(JSON.parse(raw)); },[storageKey]);
  useEffect(()=>{ localStorage.setItem(storageKey, JSON.stringify(trades)); },[trades,storageKey]);

  const calcPnL = () => {
    const e=+t.entryPrice, x=+t.exitPrice, q=+t.quantity;
    if (!isFinite(e) || !isFinite(x) || !isFinite(q)) return;
    const pnl = t.side==='long' ? (x-e)*q : (e-x)*q;
    setT(s=>({...s,pnl:+pnl.toFixed(2)}));
  };

  const saveTrade = () => {
    if(!t.symbol || !t.entryPrice || !t.exitPrice) return alert('Symbol/Entry/Exit required');
    setTrades(prev => [...prev, { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
    setT({ symbol:'', side:'long', entryPrice:'', exitPrice:'', quantity:'', rr:'', pnl:0, notes:'', emotions:{pre:'',during:'',post:''}, timezone: tz });
  };

  const addVoice = (blob) => {
    const url = URL.createObjectURL(blob);
    setTrades(prev => [...prev, { id: crypto.randomUUID(), type:'voice', url, date }]);
  };

  const totalPnl = trades.filter(x=>!x.type).reduce((s, x)=> s + Number(x.pnl||0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-sm text-neon-blue hover:underline">← Back to Calendar</button>
        <div className="text-sm text-mute">{date} • {tz}</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass p-5 space-y-4">
          <h2 className="text-xl font-semibold">Journal Entry</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-mute">Symbol</label>
              <input className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                     value={t.symbol} onChange={e=>setT(s=>({...s,symbol:e.target.value.toUpperCase()}))}/>
            </div>
            <div>
              <label className="text-xs text-mute">Side</label>
              <select className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                      value={t.side} onChange={e=>setT(s=>({...s,side:e.target.value}))}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-mute">Entry Price</label>
              <input type="number" step="0.01" className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                     value={t.entryPrice} onChange={e=>setT(s=>({...s,entryPrice:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-mute">Exit Price</label>
              <input type="number" step="0.01" className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                     value={t.exitPrice} onChange={e=>setT(s=>({...s,exitPrice:e.target.value}))}/>
            </div>

            <div>
              <label className="text-xs text-mute">Quantity</label>
              <input type="number" className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                     value={t.quantity} onChange={e=>setT(s=>({...s,quantity:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-mute">R:R (optional)</label>
              <input className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                     value={t.rr} onChange={e=>setT(s=>({...s,rr:e.target.value}))}/>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm">P&amp;L:</div>
            <div className={`tabnums text-lg font-semibold ${t.pnl>=0?'text-neon-green':'text-neon-red'}`}>
              ${Number(t.pnl).toFixed(2)}
            </div>
            <button onClick={calcPnL} className="ml-auto rounded-lg border border-line/70 px-3 py-1 hover:bg-white/5">Auto Calculate</button>
          </div>

          {/* Emotions */}
          <div className="space-y-2">
            <div className="text-xs text-mute">Emotions</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['pre','Pre: ', ['Confident','FOMO','Fearful','Calm']],
                ['during','During: ', ['Calm','Anxious','Greedy','Flow']],
                ['post','Post: ', ['Satisfied','Regretful','Learning','Frustrated']]
              ].map(([key,label,opts])=>(
                <div key={key}>
                  <div className="text-xs text-mute mb-1">{label}</div>
                  <select className="w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                          value={t.emotions[key]} onChange={e=>setT(s=>({...s,emotions:{...s.emotions,[key]:e.target.value}}))}>
                    <option value="">—</option>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-mute">Trade Notes</label>
            <textarea rows={4} className="mt-1 w-full rounded-xl bg-ink/60 border border-line/70 px-3 py-2"
                      placeholder="Setup, confluence, market conditions…" value={t.notes}
                      onChange={e=>setT(s=>({...s,notes:e.target.value}))}/>
          </div>

          <div className="flex items-center justify-between">
            <VoiceRecorder onSave={addVoice}/>
            <NeonButton onClick={saveTrade} className="px-6">Save Trade</NeonButton>
          </div>
        </div>

        {/* Timeline / session stats */}
        <div className="space-y-4">
          <div className="glass p-5">
            <div className="text-sm text-mute mb-2">Session Stats</div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="text-xs text-mute">Total P&L</div><div className={`tabnums font-semibold ${totalPnl>=0?'text-neon-green':'text-neon-red'}`}>${totalPnl.toFixed(2)}</div></div>
              <div><div className="text-xs text-mute">Win Rate</div><div className="tabnums font-semibold">
                {(() => {
                  const real = trades.filter(x=>!x.type);
                  const wins = real.filter(x=>Number(x.pnl)>0).length;
                  return real.length? Math.round((wins/real.length)*100) : 0;
                })()}%
              </div></div>
              <div><div className="text-xs text-mute">Trades</div><div className="tabnums font-semibold">{trades.filter(x=>!x.type).length}</div></div>
            </div>
          </div>

          <div className="glass p-5">
            <div className="text-sm font-semibold mb-2">Session Timeline</div>
            {trades.length === 0 && <div className="text-mute text-sm">No trades yet</div>}
            {trades.filter(x=>!x.type).map(tr => (
              <div key={tr.id} className="flex items-center justify-between border-t border-line/60 py-2 first:border-t-0">
                <div className="text-sm">{tr.symbol} • {tr.side.toUpperCase()} • {tr.quantity || '?'} @ {tr.entryPrice}→{tr.exitPrice}</div>
                <div className={`tabnums font-semibold ${tr.pnl>=0?'text-neon-green':'text-neon-red'}`}>${Number(tr.pnl).toFixed(2)}</div>
              </div>
            ))}
            {trades.filter(x=>x.type==='voice').map(v => (
              <div key={v.id} className="flex items-center justify-between border-t border-line/60 py-2">
                <div className="text-sm text-mute">Voice note</div>
                <audio src={v.url} controls className="h-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
