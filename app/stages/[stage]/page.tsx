import { Suspense } from 'react'
import StagesPage from './StageMatches'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">Loading...</div>}>
      <StagesPage />
    </Suspense>
  )
}