'use client';
import { useEffect, useRef, useState } from 'react';

export default function VoiceNote({ onSave }) {
  const [rec, setRec] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [duration, setDuration] = useState(0);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const r = new MediaRecorder(stream);
          r.ondataavailable = e => chunksRef.current.push(e.data);
          r.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setAudioURL(url);
            chunksRef.current = [];
            onSave && onSave(blob, url);
          };
          setRec(r);
        })
        .catch(() => console.log('Mic permission denied'));
    }
  }, [onSave]);

  const start = () => {
    if (rec && rec.state !== 'recording') {
      setAudioURL(null);
      setDuration(0);
      rec.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  const stop = () => {
    if (rec && rec.state === 'recording') {
      rec.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button 
          onClick={recording ? stop : start}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            recording 
              ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 animate-pulse' 
              : 'bg-[#111827] text-[#E5E7EB] border border-[#1F2937] hover:border-[#60A5FA]/50'
          }`}
        >
          {recording ? (
            <>
              <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse"></span>
              Recording {formatTime(duration)}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Record Voice Note
            </>
          )}
        </button>
      </div>
      
      {audioURL && (
        <audio controls src={audioURL} className="w-full h-10 rounded-lg" />
      )}
    </div>
  );
}