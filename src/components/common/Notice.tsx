import type { ReactNode } from 'react'

interface NoticeProps {
  children: ReactNode
  tone?: 'muted' | 'success' | 'error'
}

export function Notice({ children, tone = 'muted' }: NoticeProps) {
  return <div className={`output-block notice notice-${tone}`}>{children}</div>
}
