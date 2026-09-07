import { useEffect, type RefObject } from 'react'

export function usePromptShortcut(
  inputRef: RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    const focusPrompt = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.matches(
        'input, textarea, select, [contenteditable="true"]',
      )
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusPrompt)
    return () => window.removeEventListener('keydown', focusPrompt)
  }, [inputRef])
}
