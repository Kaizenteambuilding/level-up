import MissionGuard from '@/components/MissionGuard'
import SpanishWritingExactRequirements from '@/components/SpanishWritingExactRequirements'
import SpanishWritingReplayLink from '@/components/SpanishWritingReplayLink'
import SpanishWritingReplayButton from '@/components/SpanishWritingReplayButton'

export default function SpanishWritingPage() {
  return <main className="shell game-shell"><SpanishWritingExactRequirements /><SpanishWritingReplayLink /><SpanishWritingReplayButton /><MissionGuard mode="spanish_writing" /></main>
}
