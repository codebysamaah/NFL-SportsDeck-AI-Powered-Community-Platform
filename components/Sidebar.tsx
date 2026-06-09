'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/Authcontext'
import { ThemeToggle } from './ThemeToggle'

export function Sidebar() {
  const router = useRouter()
  const { user, refresh } = useAuth()
  const isLoggedIn = !!user

  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    refresh()
    router.push('/login')
  }

  const links = [
    { href: user?.role === 'ADMIN' ? '/home/admin' : '/home', label: 'Home' },
    { href: '/dashboard', label: 'My Dashboard' },
    { href: '/profile/view', label: 'My Profile' },
    { href: '/profile', label: 'Community' },
    { href: '/standings', label: 'Standings' },
    { href: '/threads', label: 'Threads' },
    { href: '/stages', label: 'Stages' },
    { href: '/matches', label: 'Matches' },
    { href: '/matchdays', label: 'Matchdays' },
  ]

  return (
    <aside className="w-64 h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col sticky top-0 z-10">
      <div className="flex items-center justify-center py-6">
        <Image src="/images/logo.png" alt="Logo" width={50} height={50} />
        <span className="ml-2 font-bold text-xl text-[var(--accent-blue)]">NFL SportsDeck</span>
      </div>
      <nav className="flex-1 flex flex-col px-4 space-y-2">
        <Link
          href={user?.role === 'ADMIN' ? '/admin' : '/home'}
          className="px-4 py-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Home
        </Link>

        {links.filter(l => l.label !== 'Home').map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-6 flex flex-col gap-2">
        <ThemeToggle />
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-700 hover:bg-red-900 text-[var(--text-primary)] font-semibold"
          >
            Logout
          </button>
        ) : (
          <>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 rounded-lg bg-[#00563b] hover:bg-[#0c2d1c] text-white font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="w-full px-4 py-2 rounded-lg bg-[#00563b] hover:bg-[#0c2d1c] text-white font-semibold"
            >
              Register
            </button>
          </>
        )}
      </div>
    </aside>
  )
}

export function Footer() {
  return (
    <footer className="w-full bg-[var(--bg-secondary)] text-[var(--text-muted)] py-4 flex justify-center text-sm text-slate-400 z-10">
      &copy; {new Date().getFullYear()} NFL SportsDeck. All rights reserved.
    </footer>
  )
}