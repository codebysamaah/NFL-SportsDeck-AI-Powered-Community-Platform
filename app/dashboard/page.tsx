'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
    id: number
    username: string
    avatar: string | null
}

interface Post {
    id: number
    content: string
    createdAt: string
    threadId: number
    user?: { username: string; avatar: string | null }
    thread?: { title: string; id: number }
}

interface Reply {
    id: number
    content: string
    createdAt: string
    user?: { username: string }
    post?: { content: string }
}

interface MatchUpdate {
    id: number
    homeScore: number | null
    awayScore: number | null
    lastUpdatedAt: string
    homeTeam: { name: string }
    awayTeam: { name: string }
}

interface DashboardData {
    posts: Post[]
    replies: Reply[]
    matchUpdates: MatchUpdate[]
}

function format_date(date: string) {
    const d = new Date(date)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [dashboard, setDashboard] = useState<DashboardData | null>(null)
    const [digest, setDigest] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'matches'>('posts')
    const [loadingDashboard, setLoadingDashboard] = useState(true)
    const [loadingDigest, setLoadingDigest] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // fetch current user — redirect if not logged in
                const userRes = await fetch('/api/users/me')
                if (!userRes.ok) {
                    router.push('/login')
                    return
                }
                const userData = await userRes.json()
                setUser(userData)
                setAuthChecked(true)

                // fetch dashboard feed
                const dashRes = await fetch('/api/users/dashboard')
                if (dashRes.ok) {
                    const dashData = await dashRes.json()
                    setDashboard(dashData)
                } else {
                    setError('Failed to load feed')
                }
            } catch {
                setError('Something went wrong')
            } finally {
                setLoadingDashboard(false)
            }

            // fetch digest separately
            try {
                const digestRes = await fetch('/api/digest')
                if (digestRes.ok) {
                    const digestData = await digestRes.json()
                    setDigest(digestData.content)
                }
            } catch {
            } finally {
                setLoadingDigest(false)
            }
        }

        fetchAll()
    }, [])

    if (!authChecked) return null

    return (
        <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">
            <img src="/images/nfl-banner-8.png" className="fixed inset-0 w-full h-full object-cover -z-10" />
            <div className="fixed inset-0 bg-black/75 -z-10" />

            <div className="relative z-10 max-w-5xl mx-auto w-full px-6 py-10 space-y-6">

                {/* Greeting */}
                <div className="w-full bg-[var(--bg-card)] backdrop-blur-sm rounded-2xl px-8 py-8 shadow-xl border border-white/20">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                        Welcome back{user ? `, ${user.username}` : ''}!
                    </h1>
                    <p className="text-[var(--accent-orange)] font-semibold mt-2">
                        Here's what's been happening on NFL SportsDeck.
                    </p>
                </div>

                {/* Daily Digest */}
                <div className="w-full bg-[var(--bg-card)] rounded-2xl p-6 border border-border-[var(--accent-orange)]/60 shadow-xl space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--accent-orange)]">Daily Digest</h2>
                        <span className="ml-auto text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>

                    {loadingDigest ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-[var(--bg-secondary)] rounded w-full" />
                            <div className="h-3 bg-[var(--bg-secondary)] rounded w-5/6" />
                            <div className="h-3 bg-[var(--bg-secondary)] rounded w-4/6" />
                        </div>
                    ) : digest ? (
                        <p className="text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-line">{digest}</p>
                    ) : (
                        <p className="text-[var(--text-muted)] text-sm italic">No digest available today.</p>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--accent-blue)]/40 shadow-xl overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-white/10">
                        {([
                            { key: 'posts', label: 'Following', count: dashboard?.posts.length ?? 0 },
                            { key: 'replies', label: 'Replies to Me', count: dashboard?.replies.length ?? 0 },
                            { key: 'matches', label: 'Match Updates', count: dashboard?.matchUpdates.length ?? 0 },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-3 text-sm font-medium transition ${
                                    activeTab === tab.key
                                        ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                        {loadingDashboard ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse space-y-2">
                                        <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/4" />
                                        <div className="h-3 bg-[var(--bg-secondary)] rounded w-full" />
                                        <div className="h-3 bg-[var(--bg-secondary)] rounded w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <p className="text-red-400 text-sm text-center py-8">⚠️ {error}</p>
                        ) : (
                            <>
                                {/* Posts Tab */}
                                {activeTab === 'posts' && (
                                    dashboard?.posts.length === 0 ? (
                                        <div className="text-center py-10 space-y-2">
                                            <p className="text-[var(--text-muted)] text-sm italic">No recent posts from people you follow.</p>
                                            <Link href="/profile" className="text-[var(--accent-blue)] text-xs hover:underline">
                                                Find people to follow →
                                            </Link>
                                        </div>
                                    ) : (
                                        dashboard?.posts.map(post => (
                                            <Link
                                                key={post.id}
                                                href={`/threads/${post.threadId}`}
                                                className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#274D8F]/40 hover:border-[#38bdf8]/30 transition group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[var(--accent-blue)] font-semibold text-xs">
                                                        {post.user?.username ?? 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(post.createdAt)}</span>
                                                </div>
                                                {post.thread && (
                                                    <p className="text-[10px] text-[var(--accent-orange)] mb-1">in: {post.thread.title}</p>
                                                )}
                                                <p className="text-[var(--text-primary)] text-sm line-clamp-2">{post.content}</p>
                                            </Link>
                                        ))
                                    )
                                )}

                                {/* Replies Tab */}
                                {activeTab === 'replies' && (
                                    dashboard?.replies.length === 0 ? (
                                        <p className="text-[var(--text-muted)] text-sm italic text-center py-10">No recent replies to your posts.</p>
                                    ) : (
                                        dashboard?.replies.map(reply => (
                                            <div key={reply.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[var(--accent-blue)] font-semibold text-xs">
                                                        {reply.user?.username ?? 'Unknown'}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(reply.createdAt)}</span>
                                                </div>
                                                {reply.post && (
                                                    <p className="text-[10px] text-[var(--text-muted)] mb-1 line-clamp-1">
                                                        replying to: "{reply.post.content}"
                                                    </p>
                                                )}
                                                <p className="text-[var(--text-primary)] text-sm">{reply.content}</p>
                                            </div>
                                        ))
                                    )
                                )}

                                {/* Match Updates Tab */}
                                {activeTab === 'matches' && (
                                    dashboard?.matchUpdates.length === 0 ? (
                                        <div className="text-center py-10 space-y-2">
                                            <p className="text-[var(--text-muted)] text-sm italic">No recent match updates for your favorite teams.</p>
                                            <Link href="/profile/view" className="text-[var(--accent-blue)] text-xs hover:underline">
                                                Add favorite teams →
                                            </Link>
                                        </div>
                                    ) : (
                                        dashboard?.matchUpdates.map(match => (
                                            <Link
                                                key={match.id}
                                                href={`/matches/${match.id}`}
                                                className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#274D8F]/40 hover:border-[#38bdf8]/30 transition"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[var(--text-primary)] font-semibold text-sm">{match.homeTeam.name}</span>
                                                        <span className="text-[var(--accent-blue)] font-black text-lg">
                                                            {match.homeScore ?? 0} — {match.awayScore ?? 0}
                                                        </span>
                                                        <span className="text-[var(--text-primary)] font-semibold text-sm">{match.awayTeam.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(match.lastUpdatedAt)}</span>
                                                </div>
                                            </Link>
                                        ))
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}