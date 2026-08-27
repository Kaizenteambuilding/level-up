import MissionGuard from '@/components/MissionGuard'
import SpanishWritingExactRequirements from '@/components/SpanishWritingExactRequirements'
import SpanishWritingReplayLink from '@/components/SpanishWritingReplayLink'

export default function SpanishWritingPage() {
  return <main className="shell game-shell"><SpanishWritingExactRequirements /><SpanishWritingReplayLink /><MissionGuard mode="spanish_writing" /></main>
}
