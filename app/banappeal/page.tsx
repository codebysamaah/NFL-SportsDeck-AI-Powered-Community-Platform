'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BanAppealPage() {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your appeal')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/banappeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit appeal')
      } else {
        setSuccess(true)
      }
    } catch (e) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/football.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg mx-4 p-8 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Appeal Submitted</h1>
            <p className="text-gray-300 mb-6">Your appeal has been submitted and will be reviewed by an admin.</p>
            <button onClick={() => router.push('/home')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
              Go Home
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Ban Appeal</h1>
            <p className="text-gray-300 text-sm mb-6">
              Your account has been banned. If you believe this was a mistake, please explain below.
            </p>

            {error && (
              <p className="text-red-400 bg-red-900/30 rounded p-2 mb-4 text-sm">{error}</p>
            )}

            <label className="text-sm text-gray-300 mb-1 block">Reason for Appeal</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Explain why you believe your ban should be lifted..."
              className="w-full border border-white/20 bg-white/10 text-white placeholder-gray-400 p-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Appeal'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}