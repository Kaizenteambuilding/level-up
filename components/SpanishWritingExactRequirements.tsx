'use client'

import { useEffect } from 'react'

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
}

function syncExactWordRequirements() {
  const question = document.querySelector<HTMLElement>('.mission-question')
  if (!question) return

  const difficultyText = question.querySelector('.tag')?.textContent ?? ''
  const difficulty = Number(difficultyText.match(/dificultad\s+([0-9.]+)/i)?.[1] ?? 1)
  const extraWords = Math.max(0, Math.min(8, (difficulty - 1) * 2))
  const textarea = question.querySelector<HTMLTextAreaElement>('textarea[aria-label="Tu texto"]')
  if (!textarea) return

  let requiredWords: number | null = null
  question.querySelectorAll<HTMLElement>('li').forEach((item) => {
    const current = item.textContent?.trim() ?? ''
    const baseMatch = current.match(/^([✓↻]\s+)?Al menos\s+(\d+)\s+palabras$/i)
    if (baseMatch) {
      const required = Number(baseMatch[2]) + extraWords
      const exact = `${baseMatch[1] ?? ''}Mínimo: ${required} palabras`
      item.textContent = exact
      item.dataset.exactRequiredWords = String(required)
      requiredWords = required
      return
    }

    const exactMatch = current.match(/^([✓↻]\s+)?Mínimo:\s*(\d+)\s+palabras$/i)
    if (exactMatch) requiredWords = Number(item.dataset.exactRequiredWords ?? exactMatch[2])
  })

  let target = question.querySelector<HTMLElement>('[data-writing-word-target]')
  if (!target) {
    target = document.createElement('div')
    target.dataset.writingWordTarget = 'true'
    target.className = 'metric'
    target.style.marginTop = '14px'
    target.style.marginBottom = '10px'
    textarea.parentElement?.insertBefore(target, textarea)
  }

  const currentWords = countWords(textarea.value)
  if (requiredWords === null) {
    target.innerHTML = `<b>📝 Sin mínimo de palabras</b><p class="muted" style="margin:6px 0 0">Corrige el texto sin necesidad de alargarlo · ${currentWords} palabras escritas</p>`
  } else {
    target.innerHTML = `<b>📝 Objetivo: mínimo ${requiredWords} palabras</b><p class="muted" style="margin:6px 0 0">${currentWords} / ${requiredWords} palabras</p>`
  }
}

export default function SpanishWritingExactRequirements() {
  useEffect(() => {
    syncExactWordRequirements()
    const observer = new MutationObserver(syncExactWordRequirements)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    document.addEventListener('input', syncExactWordRequirements)
    return () => {
      observer.disconnect()
      document.removeEventListener('input', syncExactWordRequirements)
    }
  }, [])

  return null
}
