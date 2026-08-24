export type DemoSoundKind = 'correct' | 'incorrect' | 'reward' | 'select'

const NOTES: Record<DemoSoundKind, number[]> = {
  correct: [523, 659, 784],
  incorrect: [220, 175],
  reward: [392, 523, 659, 784],
  select: [440, 554],
}

export function playDemoSound(enabled: boolean, kind: DemoSoundKind) {
  if (!enabled || typeof window === 'undefined' || !window.AudioContext) return
  try {
    const context = new window.AudioContext()
    const start = context.currentTime
    NOTES[kind].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const noteStart = start + index * 0.085
      oscillator.type = kind === 'incorrect' ? 'triangle' : 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.17)
    })
    window.setTimeout(() => void context.close(), 700)
  } catch {
    // Optional audio must never block the game.
  }
}
