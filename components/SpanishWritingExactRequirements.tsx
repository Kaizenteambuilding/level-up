'use client'

import { useEffect } from 'react'

function syncExactWordRequirements() {
  const difficultyText = document.querySelector('.mission-question .tag')?.textContent ?? ''
  const difficulty = Number(difficultyText.match(/dificultad\s+([0-9.]+)/i)?.[1] ?? 1)
  const extraWords = Math.max(0, Math.min(8, (difficulty - 1) * 2))

  document.querySelectorAll<HTMLElement>('.mission-question li').forEach((item) => {
    const current = item.textContent?.trim() ?? ''
    if (item.dataset.lastExactWords === current) return
    const match = current.match(/^([✓↻]\s+)?Al menos\s+(\d+)\s+palabras$/i)
    if (!match) return
    const required = Number(match[2]) + extraWords
    const exact = `${match[1] ?? ''}Mínimo: ${required} palabras`
    item.textContent = exact
    item.dataset.lastExactWords = exact
  })
}

export default function SpanishWritingExactRequirements() {
  useEffect(() => {
    syncExactWordRequirements()
    const observer = new MutationObserver(syncExactWordRequirements)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return null
}
