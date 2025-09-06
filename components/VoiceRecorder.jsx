'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

export default function VoiceRecorder({ onSave }) {
  const [rec, setRec] = useState(null);
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef([]);
  const [sec,setSec] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const r = new MediaRecorder(stream);
        r.ondataavailable = e => chunksRef.current.push(e.data);
        r.onstop = () => {
          clearInterval(timerRef.current);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          onSave && onSave(blob);
          setSec(0);
        };
        setRec(r);
      }).catch(() => console.log('Mic permission denied'));
    }
  }, [onSave]);

  const start = () => { 
    if (rec && rec.state !== 'recording') {
      rec.start(); 
      setRecording(true); 
      timerRef.current = setInterval(() => setSec(s => s + 1), 1000);
    }
  };
  
  const stop = () => { 
    if (rec && rec.state === 'recording') {
      rec.stop(); 
      setRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={recording ? stop : start}
        className={`rounded-full px-3 py-2 glass ${recording ? 'text-neon-red' : 'text-neon-green'}`}>
        {recording ? <Square size={18}/> : <Mic size={18}/>}
      </button>
      <span className="text-sm tabnums text-mute">{sec.toString().padStart(2,'0')}s</span>
    </div>
  );
}