'use client';
import { useEffect, useRef, useState } from 'react';

export default function VoiceNote({ onSave }) {
  const [rec, setRec] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const chunksRef = useRef([]);

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
      rec.start();
      setRecording(true);
    }
  };

  const stop = () => {
    if (rec && rec.state === 'recording') {
      rec.stop();
      setRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button 
          onClick={start} 
          disabled={recording}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
        >
          {recording ? '● Recording...' : '🎤 Record Voice Note'}
        </button>
        {recording && (
          <button 
            onClick={stop}
            className="px-4 py-2 bg-gray-700 text-white rounded"
          >
            Stop
          </button>
        )}
      </div>
      {audioURL && (
        <audio controls src={audioURL} className="w-full mt-2" />
      )}
    </div>
  );
}