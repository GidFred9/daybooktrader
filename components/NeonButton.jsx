'use client';
export default function NeonButton({ children, className='', ...props }) {
  return (
    <button
      {...props}
      className={`relative inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium
                  text-white bg-gradient-to-r from-neon-violet via-neon-blue to-neon-pink
                  hover:opacity-95 transition shadow-glow ${className}`}>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 rounded-xl opacity-30 blur-xl
                       bg-gradient-to-r from-neon-violet via-neon-blue to-neon-pink"></span>
    </button>
  );
}