import { Show, createEffect } from 'solid-js'
import { AlertTriangle } from 'lucide-solid'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  let confirmButtonRef: HTMLButtonElement | undefined

  // Focus confirm button when opened
  createEffect(() => {
    if (props.isOpen) {
      queueMicrotask(() => confirmButtonRef?.focus())
    }
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      props.onCancel()
    }
  }

  const isDanger = () => props.variant === 'danger'

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => props.onCancel()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={-1}
      />

      {/* Dialog */}
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          class="w-full max-w-sm overflow-hidden border bg-[var(--th-bg-elevated)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            'border-radius': 'var(--th-radius-lg)',
            'border-color': 'var(--th-border)',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Content */}
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-start gap-4">
              <Show when={isDanger()}>
                <div
                  class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(220, 38, 38, 0.1)' }}
                >
                  <AlertTriangle class="h-5 w-5 text-red-500" />
                </div>
              </Show>
              <div class="flex-1">
                <h2
                  class="text-lg font-semibold"
                  style={{
                    color: 'var(--th-fg)',
                    'font-family': 'var(--font-ui)',
                  }}
                >
                  {props.title}
                </h2>
                <p class="mt-2 text-sm" style={{ color: 'var(--th-fg-muted)' }}>
                  {props.description}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            class="flex items-center justify-end gap-3 border-t px-6 py-4"
            style={{
              'border-color': 'var(--th-border)',
              background: 'var(--th-bg-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => props.onCancel()}
              class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: 'var(--th-fg-muted)',
                background: 'transparent',
                'border-radius': 'var(--th-radius)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--th-bg-elevated)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {props.cancelLabel || 'Cancel'}
            </button>
            <button
              ref={(el) => {
                confirmButtonRef = el
              }}
              type="button"
              onClick={() => props.onConfirm()}
              class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: isDanger() ? '#fff' : 'var(--th-bg)',
                background: isDanger() ? '#dc2626' : 'var(--th-accent)',
                'border-radius': 'var(--th-radius)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {props.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
