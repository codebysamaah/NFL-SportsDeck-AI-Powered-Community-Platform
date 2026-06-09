'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminHomePage() {
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [appealCount, setAppealCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/review')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setReportCount(data.length) })
      .catch(() => {})

    fetch('/api/admin/banappeal')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAppealCount(data.length) })
      .catch(() => {})
  }, [])

  return (
    <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">
      <img src="/images/nfl-banner-8.png" alt="NFL Background" className="fixed inset-0 w-full h-full object-cover object-[center] -z-10" />
      <div className="fixed inset-0 bg-black/75 -z-10" />

      <div className="relative z-10 flex flex-col items-center px-6 py-12 space-y-8">

        {/* Header */}
        <div className="w-full max-w-5xl bg-[var(--bg-card)] backdrop-blur-sm rounded-2xl px-8 py-12 text-center shadow-xl border border-white/20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">
            ⚠ Admin Panel
          </div>
          <h1 className="text-5xl font-bold text-[var(--text-primary)]">NFL SportsDeck</h1>
          <p className="text-lg text-[var(--accent-orange)] mt-3 max-w-2xl mx-auto font-medium">
            Manage reports, ban appeals, and monitor community activity.
          </p>
        </div>

        {/* Admin Action Cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Flagged Reports */}
          <Link href="/flagged_comments"
            className="group p-6 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-red-500/30 hover:border-red-500/60 transition-all duration-200 shadow-lg hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-red-400 group-hover:text-red-300">Flagged Reports</h2>
                <p className="text-[var(--text-muted)] text-sm mt-1">Review and action pending content reports.</p>
              </div>
              <span className="text-2xl">🚩</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-[var(--text-primary)]">
                {reportCount === null ? (
                  <span className="text-[var(--text-muted)] text-2xl">...</span>
                ) : (
                  reportCount
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                reportCount && reportCount > 0
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {reportCount === 0 ? 'All clear' : 'Pending'}
              </span>
            </div>
          </Link>

          {/* Ban Appeals */}
          <Link href="/view_banappeal"
            className="group p-6 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-yellow-500/30 hover:border-yellow-500/60 transition-all duration-200 shadow-lg hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-yellow-400 group-hover:text-yellow-300">Ban Appeals</h2>
                <p className="text-[var(--text-muted)] text-sm mt-1">Review requests from banned users to be reinstated.</p>
              </div>
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-[var(--text-primary)]">
                {appealCount === null ? (
                  <span className="text-[var(--text-muted)] text-2xl">...</span>
                ) : (
                  appealCount
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                appealCount && appealCount > 0
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {appealCount === 0 ? 'All clear' : 'Pending'}
              </span>
            </div>
          </Link>
        </div>

        {/* Community Quick Links */}
        <div className="w-full max-w-5xl">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3 ml-1">Community Overview</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/threads"
              className="p-5 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/30 hover:border-white/40 transition-all duration-200 shadow-lg hover:scale-[1.02]">
              <h2 className="text-lg font-bold text-[var(--accent-blue)]">Threads 💬</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">View and moderate community threads.</p>
            </Link>
            <Link href="/matches"
              className="p-5 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/30 hover:border-white/40 transition-all duration-200 shadow-lg hover:scale-[1.02]">
              <h2 className="text-lg font-bold text-[var(--accent-blue)]">Matches 🏟</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">Check upcoming matches and live scores.</p>
            </Link>
            <Link href="/stages"
              className="p-5 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--accent-blue)]/30 hover:border-white/40 transition-all duration-200 shadow-lg hover:scale-[1.02]">
              <h2 className="text-lg font-bold text-[var(--accent-blue)]">Stages 🏆</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">View the current season stages.</p>
            </Link>
          </div>
        </div>

        {/* Gallery */}
        <div className="w-full max-w-5xl p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent-orange)]/40">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Top Moments of the 2025 NFL Season</h3>
          <div className="grid grid-cols-4 gap-3">
            {["/images/image-5.jpg", "/images/image-2.jpg", "/images/image-3.jpg", "/images/image-4.jpg"].map((src, i) => (
              <div key={i} className="overflow-hidden rounded-xl aspect-square">
                <img
                  src={src}
                  alt={`Gallery image ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}