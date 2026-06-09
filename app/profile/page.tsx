'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Team { id: number; name: string }
interface User {
  id: number
  username: string
  avatar: string | null
  favoriteTeams: Team[]
  posts: { id: number }[]
  replies: { id: number }[]
  threads: { id: number }[]
  _count: { followers: number; following: number }
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users/profile/view_all')
        const data = await res.json()
        if (!res.ok) setError(data.error || 'Failed to load users')
        else setUsers(data)
      } catch (e) {
        setError('Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <p className="text-[var(--text-muted)]">Loading...</p>
    </div>
  )

    return (
    <div className="relative min-h-screen text-[var(--text-primary)] flex flex-col">
      <img src="/images/details-ball-sport.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed inset-0 bg-black/70 -z-10" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-white/10">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Community</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 border border-white/20 bg-white/10 text-[var(--text-primary)] placeholder-gray-400 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length > 0 ? filtered.map(user => (
            <div
              key={user.id}
              onClick={() => router.push(`/profile/view/${user.id}`)}
              className="cursor-pointer rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] hover:border-white/40"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              {/* Avatar and name */}
              <div className="flex items-center gap-3 mb-4">
                {user.avatar ? (
                  <Image src={user.avatar} alt="avatar" width={48} height={48}
                    className="rounded-full object-cover w-12 h-12 border-2 border-white/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white/20">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-[var(--text-primary)] font-semibold">{user.username}</h2>
                  <p className="text-[var(--text-muted)] text-xs">{user.posts.length} post{user.posts.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4 pb-4 border-b border-white/10">
                <div className="text-center">
                  <p className="text-[var(--text-primary)] font-bold">{user._count.followers}</p>
                  <p className="text-[var(--text-muted)] text-xs">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-[var(--text-primary)] font-bold">{user._count.following}</p>
                  <p className="text-[var(--text-muted)] text-xs">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-[var(--text-primary)] font-bold">{user.posts.length}</p>
                  <p className="text-[var(--text-muted)] text-xs">Posts</p>
                </div>
              </div>

              {/* Favorite teams */}
              {user.favoriteTeams.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {user.favoriteTeams.slice(0, 3).map(team => (
                    <span key={team.id} className="px-2 py-0.5 bg-blue-900/60 text-blue-200 rounded-full text-xs border border-blue-700/40">
                      {team.name}
                    </span>
                  ))}
                  {user.favoriteTeams.length > 3 && (
                    <span className="px-2 py-0.5 bg-white/10 text-[var(--text-muted)] rounded-full text-xs">
                      +{user.favoriteTeams.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-xs italic">No favorite teams</p>
              )}
            </div>
          )) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}