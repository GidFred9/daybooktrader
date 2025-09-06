export const metadata = { title: 'DayBook Trader' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <div className="relative">
          {/* moving aurora strip */}
          <div className="pointer-events-none absolute -top-20 left-0 right-0 h-56 blur-3xl opacity-60 animate-aurora"
               style={{ background: 'linear-gradient(90deg,#285CF6, #22D5EE, #F472B6)' }} />
          <header className="sticky top-0 z-20 glass px-5 py-3">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">DayBook <span className="text-neon-blue">Trader</span></h1>
              <div className="flex items-center gap-2 text-sm text-mute">
                <span className="hidden sm:block">Press <kbd className="px-1.5 py-0.5 glass">N</kbd> new trade</span>
              </div>
            </div>
          </header>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
