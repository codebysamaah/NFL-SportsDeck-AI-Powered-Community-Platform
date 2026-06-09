'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type BanAppeal = {
  id: number
  userId: number
  reason: string
  createdAt: string
}

export default function BanAppealsPage() {
  const router = useRouter()
  const [appeals, setAppeals] = useState<BanAppeal[]>([])
  const [resolved, setResolved] = useState<(BanAppeal & { decision: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<BanAppeal | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/banappeal')
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        if (res.status === 403) { router.push('/home'); return null }
        if (!res.ok) { setError('Failed to load ban appeals'); return null }
        return res.json()
      })
      .then(data => { if (data) setAppeals(data) })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false))
  }, [])

  const handleResolve = async (decision: 'APPROVE' | 'DISMISS') => {
    if (!selected) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/banappeal/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      })
      if (!res.ok) { setError('Failed to resolve appeal'); return }
      setAppeals(prev => prev.filter(a => a.id !== selected.id))
      setResolved(prev => [...prev, { ...selected, decision }])
      setSelected(null)
    } catch {
      setError('Something went wrong')
    } finally {
      setResolving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-8 bg-yellow-500 rounded-full" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ban Appeals</h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm ml-5">
          Review pending ban appeals. Click a row to approve or dismiss.
        </p>
      </div>
 
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
      )}
 
      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
 
      {/* Empty */}
      {!loading && !error && appeals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No pending ban appeals</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      )}
 
      {/* Pending Table */}
      {!loading && appeals.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">User ID</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal, i) => (
                <tr
                  key={appeal.id}
                  onClick={() => setSelected(appeal)}
                  className={`border-t border-white/5 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer ${
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  <td className="px-4 py-3 text-[var(--text-muted)] font-mono">#{appeal.id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--accent-blue)] text-xs font-medium">
                      User #{appeal.userId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] max-w-[400px] truncate">{appeal.reason}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    {formatDate(appeal.createdAt).date} at {formatDate(appeal.createdAt).time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
      {/* Resolved Table */}
      {resolved.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-green-500 rounded-full" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Resolved This Session</h2>
          </div>
          <div className="rounded-xl border border-white/10 overflow-hidden opacity-70">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-center">Decision</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((appeal, i) => (
                  <tr
                    key={appeal.id}
                    className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-muted)] font-mono">#{appeal.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--accent-blue)] text-xs font-medium">
                        User #{appeal.userId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] max-w-[400px] truncate">{appeal.reason}</td>
                    <td className="px-4 py-3 text-center">
                      {appeal.decision === 'APPROVE' ? (
                        <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
                          Unbanned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                          Dismissed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
 
      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Ban Appeal #{selected.id}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ✕
              </button>
            </div>
 
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">User</span>
                <span className="text-[var(--accent-blue)] font-medium">User #{selected.userId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Submitted</span>
                <span className="text-[var(--text-primary)]">
                  {formatDate(selected.createdAt).date} at {formatDate(selected.createdAt).time}
                </span>
              </div>
            </div>
 
            {/* Appeal Reason */}
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Appeal Reason</p>
              <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-white/10 text-sm text-[var(--text-primary)] leading-relaxed max-h-48 overflow-y-auto">
                {selected.reason}
              </div>
            </div>
 
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelected(null)}
                disabled={resolving}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve('DISMISS')}
                disabled={resolving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {resolving ? 'Processing...' : 'Keep Banned'}
              </button>
              <button
                onClick={() => handleResolve('APPROVE')}
                disabled={resolving}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {resolving ? 'Processing...' : 'Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}