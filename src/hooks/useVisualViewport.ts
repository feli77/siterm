import { useEffect, type RefObject } from 'react'

export function useVisualViewport(
  inputRef: RefObject<HTMLInputElement | null>,
  promptRef: RefObject<HTMLFormElement | null>,
): void {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    let settleTimer = 0
    const syncViewport = () => {
      const promptWasFocused = document.activeElement === inputRef.current
      const bottomInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      )
      document.documentElement.style.setProperty(
        '--viewport-bottom',
        `${bottomInset}px`,
      )
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (promptWasFocused && document.activeElement === inputRef.current) {
          promptRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: 'auto',
          })
        }
      }, 120)
    }

    syncViewport()
    viewport.addEventListener('resize', syncViewport)
    viewport.addEventListener('scroll', syncViewport)
    return () => {
      window.clearTimeout(settleTimer)
      viewport.removeEventListener('resize', syncViewport)
      viewport.removeEventListener('scroll', syncViewport)
    }
  }, [inputRef, promptRef])
}
