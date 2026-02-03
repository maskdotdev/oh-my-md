import { Show, createEffect, createSignal } from 'solid-js'

export interface InputDialogProps {
  isOpen: boolean
  title: string
  description?: string
  placeholder?: string
  defaultValue?: string
  submitLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export default function InputDialog(props: InputDialogProps) {
  const [value, setValue] = createSignal('')
  let inputRef: HTMLInputElement | undefined

  // Reset value and focus when opened
  createEffect(() => {
    if (props.isOpen) {
      setValue(props.defaultValue || '')
      queueMicrotask(() => {
        inputRef?.focus()
        inputRef?.select()
      })
    }
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const trimmed = value().trim()
    if (trimmed) {
      props.onSubmit(trimmed)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      props.onCancel()
    }
  }

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
          class="w-full max-w-md overflow-hidden border bg-[var(--th-bg-elevated)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{
            'border-radius': 'var(--th-radius-lg)',
            'border-color': 'var(--th-border)',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div class="px-6 pt-6 pb-2">
              <h2
                class="text-lg font-semibold"
                style={{
                  color: 'var(--th-fg)',
                  'font-family': 'var(--font-ui)',
                }}
              >
                {props.title}
              </h2>
              <Show when={props.description}>
                <p class="mt-1 text-sm" style={{ color: 'var(--th-fg-muted)' }}>
                  {props.description}
                </p>
              </Show>
            </div>

            {/* Input */}
            <div class="px-6 py-4">
              <input
                ref={(el) => {
                  inputRef = el
                }}
                type="text"
                placeholder={props.placeholder || ''}
                value={value()}
                onInput={(e) => setValue(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                class="w-full rounded-md border px-4 py-3 text-base outline-none transition-colors"
                style={{
                  'font-family': 'var(--font-ui)',
                  color: 'var(--th-fg)',
                  background: 'var(--th-bg)',
                  'border-color': 'var(--th-border)',
                  'border-radius': 'var(--th-radius)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--th-accent)'
                  e.currentTarget.style.boxShadow =
                    '0 0 0 2px var(--th-accent-subtle)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--th-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
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
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: 'var(--th-bg)',
                  background: 'var(--th-accent)',
                  'border-radius': 'var(--th-radius)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {props.submitLabel || 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  )
}
