import Image from "next/image";
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col">
      <img src="/images/nfl-banner-8.png" alt="NFL Background" className="fixed inset-0 w-full h-full object-cover object-[center] -z-10"/>
      <div className="fixed inset-0 bg-black/75 -z-10" />

      {/* Heading */}
      <div className="relative z-10 flex flex-col items-center px-6 py-12 space-y-6">
        
        <div className="w-full max-w-5xl bg-[var(--bg-card)] backdrop-blur-sm rounded-2xl px-8 py-16 text-center shadow-xl border border-white/40">
        
          <h1 className="text-6xl font-bold text-[var(--text-primary)]">Welcome to NFL SportsDeck</h1>
          <p className="text-xl font-bold text-[var(--accent-orange)] mt-2 mt-4 max-w-2xl mx-auto">
            Your hub for threads, matches, and the latest game stages.
          </p>
        </div>

      {/* Quick Links */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/threads" 
          className="p-6 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/60 hover:border-white/60 transition-all duration-200 shadow-lg hover:scale-[1.02]">
          <h2 className="text-2xl font-bold text-[var(--accent-blue)]">Threads 💬</h2>
          <p className="text-[var(--text-muted)] mt-2">Join discussions and view community threads.</p>
        </Link>
        <Link href="/matches" 
          className="p-6 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/60 hover:border-white/60 transition-all duration-200 shadow-lg hover:scale-[1.02]">
          <h2 className="text-2xl font-bold text-[var(--accent-blue)]">Matches 🏟</h2>
          <p className="text-[var(--text-muted)] mt-2">Check upcoming matches and live scores.</p>
        </Link>
        <Link href="/stages" 
          className="p-6 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/60 hover:border-white/60 transition-all duration-200 shadow-lg hover:scale-[1.02]">
          <h2 className="text-2xl font-bold text-[var(--accent-blue)]">Stages 🏆</h2>
          <p className="text-[var(--text-muted)]">View the current season stages.</p>
        </Link>
      </div>

    {/* Gallery */}
    <div className="w-full max-w-5xl p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent-orange)]/60">
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Top Moments of the 2025 NFL Season</h3>
      <div className="grid grid-cols-4 gap-3">
          {["/images/image-5.jpg", "/images/image-2.jpg", "/images/image-3.jpg", "/images/image-4.jpg"].map((src, i) => (
              <div key={i} className="overflow-hidden rounded-xl aspect-square">
                  <img
                      src={src}
                      alt={`Gallery image ${i + 1}`}
                      className="w-60 h-50 object-cover hover:scale-105 transition duration-300"
                  />
              </div>
          ))}
      </div>
    </div>
  </div>
</div>
)}