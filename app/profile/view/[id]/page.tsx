'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Team { id: number; name: string }
interface Post { id: number; content: string; createdAt: string }
interface Reply { id: number; content: string; createdAt: string }
interface Thread { id: number; title: string; createdAt: string }

interface UserProfile {
  id: number
  username: string
  avatar: string | null
  favoriteTeams: Team[]
  posts: Post[]
  replies: Reply[]
  threads: Thread[]
  _count: { followers: number; following: number }
}

export default function UserProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'threads'>('posts')
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchUserAndActivity = async () => {
      try {
        const res = await fetch(`/api/users/profile/view/${id}`)
        const data = await res.json()
        
        if (!res.ok) {
          setError(data.error || 'User not found')
          setLoading(false)
          return
        }

        setUser(data)
        setFollowing(data.isFollowing)

        const chartRes = await fetch(`/api/users/activity?userId=${id}`)
        if (chartRes.ok) {
          const activityData = await chartRes.json()
          setChartData(activityData)
        }
      } catch (e) {
        setError('Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndActivity()
  }, [id])

  const handleFollow = async () => {
    const res = await fetch('/api/users/profile/view')
    if (!res.ok) {
      router.push('/login')
      return
    }
    try {
      const res = await fetch(following ? `/api/users/unfollow` : `/api/users/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: Number(id) })
      })
      if (res.ok) {
        setFollowing(!following)
        setUser(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            followers: following ? prev._count.followers - 1 : prev._count.followers + 1
          }
        } : prev)
      }
    } catch (e) {
      console.error('Follow error', e)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-[var(--text-muted)]">Loading...</p>
    </div>
  )

  if (error || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-red-400">{error || 'User not found'}</p>
    </div>
  )

  return (
    <div className="relative min-h-screen text-[var(--text-primary)] py-10 px-4">
      <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" alt="bg" />
      <div className="fixed inset-0 bg-black/70 -z-10" />

      {/* Main Grid Wrapper */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left — profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border)]">
            <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400" />
            <div className="px-6 pb-6">
              <div className="-mt-12 mb-3 flex justify-center">
                {user.avatar ? (
                  <Image src={user.avatar} alt="avatar" width={96} height={96} className="rounded-full border-4 border-white/30 object-cover w-24 h-24" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] text-center">{user.username}</h1>
              <div className="flex justify-center gap-10 my-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--text-primary)]">{user._count.followers}</p>
                  <p className="text-[var(--text-muted)] text-xs">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--text-primary)]">{user._count.following}</p>
                  <p className="text-[var(--text-muted)] text-xs">Following</p>
                </div>
              </div>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Favorite Teams</h2>
                <div className="flex flex-wrap gap-1">
                  {user.favoriteTeams.length > 0 ? user.favoriteTeams.map(team => (
                    <span key={team.id} className="px-2 py-1 bg-blue-900/60 text-blue-200 rounded-full text-xs">{team.name}</span>
                  )) : <p className="text-[var(--text-muted)] text-xs">No favorite teams</p>}
                </div>
              </div>
              <button onClick={handleFollow} className={`w-full py-2 rounded-lg text-sm font-medium transition ${following ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border)]' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {following ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Right — activity & tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Activity Chart Card */}
          <div className="rounded-2xl p-6 shadow-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--accent-blue)] mb-4 uppercase tracking-wider">Activity History</h3>
            <div className="h-48 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="posts" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPosts)" strokeWidth={2} />
                    <Area type="monotone" dataKey="replies" stroke="#a855f7" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm italic">No activity record found</div>
              )}
            </div>
          </div>

          {/* Tabs Card */}
          <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border)]">
            <div className="flex border-b border-[var(--border)]">
              {(['posts', 'replies', 'threads'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-medium capitalize transition ${activeTab === tab ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                  {tab} ({user[tab].length})
                </button>
              ))}
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
              {user[activeTab].length > 0 ? user[activeTab].map((item: any) => (
                <div key={item.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:opacity-80 transition">
                  <p className="text-[var(--text-primary)] text-sm">{item.content || item.title}</p>
                  <p className="text-[var(--text-muted)] text-[10px] mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
              )) : <p className="text-[var(--text-muted)] text-sm text-center py-8">No {activeTab} yet</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}