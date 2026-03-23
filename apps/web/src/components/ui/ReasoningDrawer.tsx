import type { ReactNode } from 'react'

type ReasoningDrawerProps = {
  isOpen: boolean
  onClose: () => void
  children?: ReactNode
}

export default function ReasoningDrawer({ isOpen, onClose, children }: ReasoningDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-navy-100 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
        <h2 className="font-display text-display-sm text-navy-900">Reasoning</h2>
        <button
          onClick={onClose}
          className="font-body text-body-sm text-navy-500 hover:text-navy-800"
        >
          Close
        </button>
      </div>
      <div className="overflow-y-auto p-6">{children}</div>
    </div>
  )
}
