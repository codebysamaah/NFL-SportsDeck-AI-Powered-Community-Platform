'use client'
 
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
 
type Report = {
  id: number
  reporterid: number | null
  threadId: number | null
  postId: number | null
  replyId: number | null
  reason: string
  isAIGenerated: boolean
  aiVerdict: string
  aiScore: number
  status: string
  reportCount: number
  content?: string | null
}
 
export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Report | null>(null)
  const [resolving, setResolving] = useState(false)
  const [threadData, setThreadData] = useState<any>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [resolved, setResolved] = useState<Report[]>([])

    useEffect(() => {
    if (!selected?.threadId) {
        setThreadData(null)
        return
    }
    setThreadLoading(true)
    fetch(`/api/threads/threadId/${selected.threadId}`)
        .then(res => res.json())
        .then(data => setThreadData(data))
        .catch(() => setThreadData(null))
        .finally(() => setThreadLoading(false))
    }, [selected])
 
  useEffect(() => {
    fetch('/api/admin/review')
      .then(res => {
        if (res.status === 401) { router.push('/login'); return null }
        if (res.status === 403) { router.push('/home'); return null }
        if (!res.ok) { setError('Failed to load reports'); return null }
        return res.json()
      })
      .then(data => { if (data) setReports(data) })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false))
  }, [])
 
  const handleResolve = async (decision: 'APPROVE' | 'DISMISS') => {
    if (!selected) return
    setResolving(true)
    try {
      const res = await fetch(`/api/admin/review/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      })
      if (!res.ok) {
        setError('Failed to resolve report')
        return
      }
      setReports(prev => prev.filter(r => r.id !== selected.id))
      setResolved(prev => [...prev, { ...selected, decision }])
      setSelected(null)
    } catch {
      setError('Something went wrong')
    } finally {
      setResolving(false)
    }
  }

  const handleBan = async () => {
  if (!selected) return
  setResolving(true)
  try {
    const res = await fetch(`/api/admin/ban/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'BAN' })
    })
    if (!res.ok) { setError('Failed to ban user'); return }
    // also resolve the report
    await fetch(`/api/admin/review/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'APPROVE' })
    })
    setReports(prev => prev.filter(r => r.id !== selected.id))
    setResolved(prev => [...prev, { ...selected, status: 'APPROVE' }])
    setSelected(null)
  } catch {
    setError('Something went wrong')
  } finally {
    setResolving(false)
  }
}
 
  const getScoreColor = (score: number) => {
    if (score >= 0.75) return 'text-red-400'
    if (score >= 0.5) return 'text-yellow-400'
    return 'text-green-400'
  }
 
  const getScoreBg = (score: number) => {
    if (score >= 0.75) return 'bg-red-500/10 border-red-500/30'
    if (score >= 0.5) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-green-500/10 border-green-500/30'
  }
 
  const getTarget = (report: Report) => {
    if (report.postId) return `Post #${report.postId}`
    if (report.replyId) return `Reply #${report.replyId}`
    if (report.threadId) return `Thread #${report.threadId}`
    return 'Unknown'
  }
 
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-8 bg-red-500 rounded-full" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pending Reports</h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm ml-5">
          Sorted by user report count, then AI severity score. Click a row to review.
        </p>
      </div>
 
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
 
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm mb-4">
          {error}
        </div>
      )}
 
      {!loading && !error && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No pending reports</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      )}
 
      {!loading && reports.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">AI Verdict</th>
                <th className="px-4 py-3 text-center">AI Score</th>
                <th className="px-4 py-3 text-center">Reports</th>
                <th className="px-4 py-3 text-center">Source</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, i) => (
                <tr
                  key={report.id}
                  onClick={() => setSelected(report)}
                  className={`border-t border-white/5 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer ${
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  <td className="px-4 py-3 text-[var(--text-muted)] font-mono">#{report.id}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--accent-blue)] text-xs font-medium">
                      {getTarget(report)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)] max-w-[200px] truncate">{report.reason}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)] max-w-[180px] truncate">{report.aiVerdict || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${getScoreBg(report.aiScore)} ${getScoreColor(report.aiScore)}`}>
                      {(report.aiScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      report.reportCount > 2 ? 'bg-red-500/20 text-red-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                    }`}>
                      {report.reportCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {report.isAIGenerated ? (
                      <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs">AI</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs">User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
 
      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Report #{selected.id}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                ✕
              </button>
            </div>
 
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Target</span>
                <span className="text-[var(--accent-blue)] font-medium">{getTarget(selected)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Reason</span>
                <span className="text-[var(--text-primary)]">{selected.reason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">AI Verdict</span>
                <span className="text-[var(--text-primary)]">{selected.aiVerdict || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">AI Score</span>
                <span className={getScoreColor(selected.aiScore)}>
                  {(selected.aiScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">User Reports</span>
                <span className={selected.reportCount > 2 ? 'text-red-400' : 'text-[var(--text-primary)]'}>
                  {selected.reportCount}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Source</span>
                <span className={selected.isAIGenerated ? 'text-purple-400' : 'text-blue-400'}>
                  {selected.isAIGenerated ? 'AI Generated' : 'User Report'}
                </span>
              </div>
            </div>
 
            {/* Thread Content or Post Content */}
            <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Reported Content</p>

            {selected.threadId ? (
                threadLoading ? (
                <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                </div>
                ) : threadData ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-white/10">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Thread Title</p>
                    <p className="text-[var(--text-primary)] font-semibold">{threadData.title}</p>
                    </div>
                    {threadData.posts?.length > 0 ? (
                    threadData.posts.map((post: any) => (
                        <div key={post.id} className="p-3 rounded-lg bg-[var(--bg-primary)] border border-white/10">
                        <p className="text-xs text-[var(--text-muted)] mb-1">
                            Post #{post.id} — {post.user?.username ?? 'Unknown'}
                        </p>
                        <p className="text-sm text-[var(--text-primary)]">{post.content}</p>
                        </div>
                    ))
                    ) : (
                    <p className="text-[var(--text-muted)] text-sm italic">No posts yet.</p>
                    )}
                </div>
                ) : (
                <p className="text-[var(--text-muted)] text-sm italic">Could not load thread.</p>
                )
            ) : (
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-white/10 text-sm text-[var(--text-primary)] italic max-h-40 overflow-y-auto">
                {selected.content ?? 'No content preview available.'}
                </div>
            )}
            </div>

            {/* Action Buttons */}
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
                className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {resolving ? 'Processing...' : 'Dismiss'}
              </button>
              <button
                onClick={() => handleResolve('APPROVE')}
                disabled={resolving} 
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {resolving ? 'Processing...' : 'Remove Content'}
              </button>
              <button
                onClick={handleBan}
                disabled={resolving}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {resolving ? 'Processing...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-green-500 rounded-full" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Resolved This Session</h2>
          </div>
          <div className="rounded-xl border border-white/10 overflow-hidden opacity-70">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-center">AI Score</th>
                  <th className="px-4 py-3 text-center">Decision</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((report, i) => (
                  <tr
                    key={report.id}
                    className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}
                  >
                    <td className="px-4 py-3 text-[var(--text-muted)] font-mono">#{report.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--accent-blue)] text-xs font-medium">
                        {getTarget(report)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] max-w-[200px] truncate">{report.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded border text-xs font-semibold ${getScoreBg(report.aiScore)} ${getScoreColor(report.aiScore)}`}>
                        {(report.aiScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.status === 'APPROVE' ? (
                        <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">Removed</span>
                      ) : report.status === 'BAN' ? (
                        <span className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">Banned</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">Dismissed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}