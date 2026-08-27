'use client'

import { useEffect } from 'react'

function addReplayLink() {
  const completedTag = Array.from(document.querySelectorAll<HTMLElement>('.tag')).find((item) => item.textContent?.includes('SALA COMPLETADA HOY'))
  const card = completedTag?.closest<HTMLElement>('.card')
  const actions = card?.querySelector<HTMLElement>('.action-row')
  if (!actions || actions.querySelector('[data-writing-replay-link]')) return
  const link = document.createElement('a')
  link.href = '/zone/language/writing/replay'
  link.className = 'btn primary'
  link.dataset.writingReplayLink = 'true'
  link.textContent = 'VOLVER A PRACTICAR'
  actions.prepend(link)
}

export default function SpanishWritingReplayLink() {
  useEffect(() => {
    addReplayLink()
    const observer = new MutationObserver(addReplayLink)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return null
}
