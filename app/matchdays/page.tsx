import { Suspense } from 'react'
import MatchDaysPage from './MatchDayClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">Loading...</div>}>
      <MatchDaysPage />
    </Suspense>
  )
}