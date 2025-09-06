'use client';
import { clsx } from 'clsx';

export default function StatCard({ label, value, delta, positive=true, right }) {
  return (
    <div className="glass p-4">
      <div className="text-xs text-mute">{label}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <div className="text-2xl font-semibold tabnums">{value}</div>
        {right ?? (
          <div className={clsx('text-sm tabnums', positive ? 'text-neon-green' : 'text-neon-red')}>
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}