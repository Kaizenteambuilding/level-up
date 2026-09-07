import BossLab from '@/components/BossLab'

export default function BossLabPage() {
  return (
    <main className="shell game-shell boss-lab-shell">
      <style>{`
        .boss-lab-shell .shop-item > div:first-child {
          pointer-events: none;
        }
        .boss-lab-shell .shop-item .btn {
          position: relative;
          z-index: 2;
        }
      `}</style>
      <BossLab />
    </main>
  )
}
