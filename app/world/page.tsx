import DemoWorld from '@/components/DemoWorld'
import GuestFeedback from '@/components/GuestFeedback'
import QuarterBossPortal from '@/components/QuarterBossPortal'

export default function WorldPage() {
  return <main className="shell game-shell"><DemoWorld /><QuarterBossPortal /><GuestFeedback /></main>
}
