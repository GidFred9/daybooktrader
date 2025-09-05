'use client';
import { useState } from 'react';

export default function ScreenshotUpload({ onUpload }) {
  const [previews, setPreviews] = useState([]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      url: URL.createObjectURL(f),
      file: f
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    onUpload && onUpload(newPreviews);
  };

  const removeImage = (id) => {
    setPreviews(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer inline-block hover:bg-blue-700">
          📸 Add Chart Screenshots
        </span>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleFiles}
          className="hidden"
        />
      </label>
      
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {previews.map(p => (
            <div key={p.id} className="relative">
              <img src={p.url} alt={p.name} className="w-full h-24 object-cover rounded" />
              <button 
                onClick={() => removeImage(p.id)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}