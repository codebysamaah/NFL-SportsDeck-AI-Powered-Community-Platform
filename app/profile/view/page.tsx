'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Team { id: number; name: string }
interface Post { id: number; content: string; createdAt: string }
interface Reply { id: number; content: string; createdAt: string }
interface Thread { id: number; title: string; createdAt: string }

interface Profile {
  id: number
  username: string
  email: string
  is_banned: boolean
  avatar: string | null
  favoriteTeams: Team[]
  posts: Post[]
  replies: Reply[]
  threads: Thread[]
  _count: { followers: number; following: number }
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'threads'>('posts')
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
        try {
            const profileRes = await fetch('/api/users/profile/view')

            if (!profileRes.ok) {
                if (profileRes.status === 401) {
                    router.push('/login')
                    return
                }
                const profileData = await profileRes.json()
                setError(profileData.error || 'Failed to load profile')
                setLoading(false)
                return
            }

            const profileData = await profileRes.json()
            setProfile(profileData)
            setUsername(profileData.username)
            setAvatar(profileData.avatar || '')
            setSelectedTeams(profileData.favoriteTeams?.map((t: Team) => t.id) || [])

            // only fetch these after we know the user is authenticated
            const [teamsRes, chartRes] = await Promise.all([
                fetch('/api/matches/teams'),
                profileData.id ? fetch(`/api/users/activity?userId=${profileData.id}`) : Promise.resolve(null)
            ])

            const teamsData = await teamsRes.json()
            setAllTeams(teamsData)

            if (chartRes?.ok) {
                const activityData = await chartRes.json()
                setChartData(activityData)
            }

        } catch (e) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }
    fetchData()
}, [])
  const toggleTeam = (id: number) => {
    setSelectedTeams(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/uploads", { method: "POST", body: formData })
    const data = await res.json()
    if (res.ok) {
      setAvatar(data.url)
      setProfile(prev => prev ? { ...prev, avatar: data.url } : prev)
    }
  }

  const handleEdit = async () => {
    try {
      const res = await fetch(`/api/users/profile/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar, favoriteTeams: selectedTeams }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
      } else {
        setProfile(prev => prev ? { ...prev, ...data } : prev)
        setEditing(false)
      }
    } catch (e) {
      setError('Something went wrong')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-[var(--text-muted)]">Loading...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-red-500">{error}</p>
    </div>
  )

  if (!profile) return null

  return (
        <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">

            <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />

            <div className="fixed inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 min-h-screen py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — profile card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden shadow-xl"
              style={{ backgroundColor: 'var(--bg-primary)' }}>

              {/* Banner */}
              <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400" />

              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="-mt-12 mb-3 flex justify-center">
                  {profile.avatar ? (
                    <Image src={profile.avatar} alt="avatar" width={96} height={96}
                      className="rounded-full border-4 border-white/30 object-cover w-24 h-24" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h1 className="text-xl font-bold text-[var(--text-primary)] text-center">{profile.username}</h1>
                <p className="text-[var(--text-muted)] text-sm text-center mb-4">{profile.email}</p>

                {profile.is_banned && (
                  <div className="flex flex-col items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-red-500/80 text-white text-xs rounded-full font-semibold">
                      🚫 Banned
                    </span>
                    <button
                      onClick={() => router.push('/banappeal')}
                      className="cursor-pointer text-xs text-[var(--accent-blue)] hover:underline"
                    >
                      Submit a Ban Appeal
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-center gap-10 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{profile._count.followers}</p>
                    <p className="text-[var(--text-muted)] text-xs">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{profile._count.following}</p>
                    <p className="text-[var(--text-muted)] text-xs">Following</p>
                  </div>
                </div>

                {/* Favorite Teams */}
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Favorite Teams</h2>
                  <div className="flex flex-wrap gap-1">
                    {profile.favoriteTeams.length > 0 ? profile.favoriteTeams.map(team => (
                      <span key={team.id} className="px-2 py-1 bg-blue-900/60 text-blue-200 rounded-full text-xs">
                        {team.name}
                      </span>
                    )) : (
                      <p className="text-[var(--text-muted)] text-xs">No favorite teams yet</p>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-sm">
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Username</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-white/20 bg-white/10 text-[var(--text-primary)] p-2 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[var(--text-primary)] px-3 py-2 rounded-lg text-sm transition border border-white/20">
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                      {avatar && (
                        <Image src={avatar} alt="preview" width={48} height={48}
                          className="mt-2 rounded-full object-cover w-12 h-12" />
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">Favorite Teams</label>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {allTeams.map(team => (
                          <button key={team.id} onClick={() => toggleTeam(team.id)}
                            className={`px-2 py-1 rounded-full text-xs border transition ${
                              selectedTeams.includes(team.id)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white/10 text-[var(--text-muted)] border-white/20'
                            }`}>
                            {team.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleEdit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition">
                        Save
                      </button>
                      <button onClick={() => setEditing(false)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-[var(--text-primary)] py-2 rounded-lg text-sm transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Chart card */}
            <div className="rounded-2xl p-6 shadow-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--accent-blue)]">Activity Overview</h3>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Last 30 Days</span>
              </div>
              
              <div className="h-[200px] w-full">
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
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="posts" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPosts)" strokeWidth={2} />
                    <Area type="monotone" dataKey="replies" stroke="#a855f7" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-4 mt-4 text-xs text-[var(--text-muted)] justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-purple-500 border-dashed"></div>
                  <span>Replies</span>
                </div>
              </div>
            </div>

            {/* Tabs card */}
            <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border)]">
              <div className="flex border-b border-white/20">
                {(['posts', 'replies', 'threads'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium capitalize transition ${
                      activeTab === tab ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}>
                    {tab} ({profile[tab].length})
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {activeTab === 'posts' && (
                  profile.posts.length > 0 ? profile.posts.map(post => (
                    <div key={post.id} className="p-3 rounded-lg bg-white/10 border border-white/10">
                      <p className="text-[var(--text-primary)] text-sm">{post.content}</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-[var(--text-muted)] text-sm text-center py-8">No posts yet</p>
                )}
                {activeTab === 'replies' && (
                  profile.replies.length > 0 ? profile.replies.map(reply => (
                    <div key={reply.id} className="p-3 rounded-lg bg-white/10 border border-white/10">
                      <p className="text-[var(--text-primary)] text-sm">{reply.content}</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">{new Date(reply.createdAt).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-[var(--text-muted)] text-sm text-center py-8">No replies yet</p>
                )}
                {activeTab === 'threads' && (
                  profile.threads.length > 0 ? profile.threads.map(thread => (
                    <div key={thread.id} className="p-3 rounded-lg bg-white/10 border border-white/10">
                      <p className="text-[var(--text-primary)] text-sm font-medium">{thread.title}</p>
                      <p className="text-[var(--text-muted)] text-xs mt-1">{new Date(thread.createdAt).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-[var(--text-muted)] text-sm text-center py-8">No threads yet</p>
                )}
              </div>
            </div> 

          </div>  
        </div>
      </div>
    </div>
  )
}