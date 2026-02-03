import { For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import {
  FileText,
  Monitor,
  Moon,
  Palette,
  Plus,
  Search,
  Sun,
  Trash2,
} from 'lucide-solid'
import ConfirmDialog from './ConfirmDialog'
import { deleteFile, files, setCurrentFileId } from '../stores/files'
import {
  aesthetic,
  aestheticThemes,
  colorMode,
  colorModes,
  setAesthetic,
  setColorMode,
} from '../stores/theme'
import type { SavedFile } from '../stores/files'
import type { ColorMode } from '../stores/theme'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelectFile: (file: SavedFile) => void
  onCreateFile: () => void
}

type CommandItem =
  | { type: 'file'; file: SavedFile }
  | { type: 'color-mode'; mode: (typeof colorModes)[number] }
  | { type: 'aesthetic'; theme: (typeof aestheticThemes)[number] }
  | { type: 'action'; action: 'new-file' }

export default function CommandPalette(props: CommandPaletteProps) {
  const [search, setSearch] = createSignal('')
  const [selectedIndex, setSelectedIndex] = createSignal(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = createSignal(false)
  const [fileToDelete, setFileToDelete] = createSignal<string | null>(null)
  let inputRef: HTMLInputElement | undefined
  let listRef: HTMLDivElement | undefined

  // Reset search and selection when opened
  createEffect(() => {
    if (props.isOpen) {
      setSearch('')
      setSelectedIndex(0)
      queueMicrotask(() => inputRef?.focus())
    }
  })

  // Build the list of commands
  const commands = createMemo((): Array<CommandItem> => {
    const query = search().toLowerCase().trim()
    const items: Array<CommandItem> = []

    // Add "new file" action
    if (!query || 'new file'.includes(query) || 'create'.includes(query)) {
      items.push({ type: 'action', action: 'new-file' })
    }

    // Add files
    const fileList = files()
    const matchingFiles = query
      ? fileList.filter((f) => f.name.toLowerCase().includes(query))
      : fileList

    // Sort by most recently updated
    const sortedFiles = [...matchingFiles].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )
    for (const file of sortedFiles) {
      items.push({ type: 'file', file })
    }

    // Add aesthetic themes
    const matchingAesthetics = query
      ? aestheticThemes.filter(
          (t) =>
            t.label.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            'theme'.includes(query) ||
            'style'.includes(query) ||
            'aesthetic'.includes(query),
        )
      : aestheticThemes

    for (const t of matchingAesthetics) {
      items.push({ type: 'aesthetic', theme: t })
    }

    // Add color modes
    const matchingModes = query
      ? colorModes.filter(
          (m) =>
            m.label.toLowerCase().includes(query) ||
            m.description.toLowerCase().includes(query) ||
            'mode'.includes(query) ||
            'dark'.includes(query) ||
            'light'.includes(query),
        )
      : colorModes

    for (const m of matchingModes) {
      items.push({ type: 'color-mode', mode: m })
    }

    return items
  })

  // Reset selection when search changes
  createEffect(() => {
    search()
    setSelectedIndex(0)
  })

  // Ensure selected index is valid
  createEffect(() => {
    const max = commands().length - 1
    if (selectedIndex() > max) {
      setSelectedIndex(Math.max(0, max))
    }
  })

  // Scroll selected item into view
  createEffect(() => {
    const index = selectedIndex()
    const item = listRef?.children[index] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  })

  const handleSelect = (item: CommandItem) => {
    switch (item.type) {
      case 'file':
        setCurrentFileId(item.file.id)
        props.onSelectFile(item.file)
        props.onClose()
        break
      case 'aesthetic':
        setAesthetic(item.theme.value)
        break
      case 'color-mode':
        setColorMode(item.mode.value)
        break
      case 'action':
        props.onCreateFile()
        props.onClose()
        break
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const items = commands()

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter': {
        e.preventDefault()
        const selected = items.at(selectedIndex())
        if (selected) handleSelect(selected)
        break
      }
      case 'Escape':
        e.preventDefault()
        props.onClose()
        break
    }
  }

  const handleDeleteFile = (e: MouseEvent, fileId: string) => {
    e.stopPropagation()
    setFileToDelete(fileId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteFile = () => {
    const fileId = fileToDelete()
    if (fileId) {
      deleteFile(fileId)
    }
    setDeleteConfirmOpen(false)
    setFileToDelete(null)
  }

  const getColorModeIcon = (value: ColorMode) => {
    switch (value) {
      case 'light':
        return <Sun class="h-4 w-4" />
      case 'dark':
        return <Moon class="h-4 w-4" />
      case 'system':
        return <Monitor class="h-4 w-4" />
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => props.onClose()}
        onKeyDown={(e) => e.key === 'Escape' && props.onClose()}
        role="button"
        tabIndex={-1}
      />

      {/* Dialog */}
      <div class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
        <div
          class="command-palette w-full max-w-xl overflow-hidden border bg-[var(--th-bg-elevated)] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
          style={{ 'border-radius': 'var(--th-radius-lg)' }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div class="flex items-center gap-3 border-b border-[var(--th-border)] px-4">
            <Search class="h-5 w-5 text-[var(--th-fg-subtle)]" />
            <input
              ref={(el) => {
                inputRef = el
              }}
              type="text"
              placeholder="Search files, themes, or commands…"
              class="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-[var(--th-fg-subtle)]"
              style={{
                'font-family': 'var(--font-ui)',
                color: 'var(--th-fg)',
              }}
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd
              class="hidden rounded px-2 py-0.5 text-xs font-medium sm:inline-block"
              style={{
                background: 'var(--th-bg-subtle)',
                color: 'var(--th-fg-muted)',
                border: '1px solid var(--th-border)',
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div
            ref={(el) => {
              listRef = el
            }}
            class="max-h-[50vh] overflow-y-auto overscroll-contain p-2"
          >
            <Show
              when={commands().length > 0}
              fallback={
                <div
                  class="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--th-fg-muted)' }}
                >
                  No results found
                </div>
              }
            >
              <For each={commands()}>
                {(item, index) => (
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{
                      'border-radius': 'var(--th-radius)',
                      background:
                        selectedIndex() === index()
                          ? 'var(--th-bg-subtle)'
                          : 'transparent',
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index())}
                  >
                    {/* File item */}
                    <Show when={item.type === 'file'}>
                      <FileText
                        class="h-5 w-5 flex-shrink-0"
                        style={{ color: 'var(--th-fg-subtle)' }}
                      />
                      <div class="min-w-0 flex-1">
                        <div
                          class="truncate font-medium"
                          style={{ color: 'var(--th-fg)' }}
                        >
                          {
                            (item as { type: 'file'; file: SavedFile }).file
                              .name
                          }
                        </div>
                        <div
                          class="truncate text-xs"
                          style={{ color: 'var(--th-fg-muted)' }}
                        >
                          Updated{' '}
                          {formatDate(
                            (item as { type: 'file'; file: SavedFile }).file
                              .updatedAt,
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="flex-shrink-0 rounded p-1 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        style={{ color: 'var(--th-fg-subtle)' }}
                        onClick={(e) =>
                          handleDeleteFile(
                            e,
                            (item as { type: 'file'; file: SavedFile }).file.id,
                          )
                        }
                        title="Delete file"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </Show>

                    {/* Aesthetic theme item */}
                    <Show when={item.type === 'aesthetic'}>
                      {(() => {
                        const theme = (
                          item as {
                            type: 'aesthetic'
                            theme: (typeof aestheticThemes)[number]
                          }
                        ).theme
                        const isActive = aesthetic() === theme.value
                        return (
                          <>
                            {/* Distinctive color preview swatch */}
                            <div
                              class="relative h-10 w-10 flex-shrink-0 overflow-hidden"
                              style={{
                                'border-radius':
                                  theme.value === 'cozy'
                                    ? '0.5rem'
                                    : theme.value === 'minimal' ||
                                        theme.value === 'retro'
                                      ? '0'
                                      : '0.25rem',
                                border:
                                  theme.value === 'retro'
                                    ? `2px solid ${theme.preview.accent}`
                                    : theme.value === 'minimal'
                                      ? `2px solid ${theme.preview.accent}`
                                      : '1px solid var(--th-border)',
                                background: theme.preview.bg,
                                'box-shadow':
                                  theme.value === 'bold'
                                    ? `0 0 12px ${theme.preview.accent}40`
                                    : theme.value === 'cozy'
                                      ? '2px 2px 0 var(--th-border)'
                                      : 'none',
                              }}
                            >
                              {/* Theme-specific swatch designs */}
                              {theme.value === 'editorial' && (
                                <>
                                  <div
                                    class="absolute top-1 left-1.5 text-lg font-serif italic"
                                    style={{ color: theme.preview.accent }}
                                  >
                                    A
                                  </div>
                                  <div
                                    class="absolute bottom-1 right-1 h-0.5 w-4"
                                    style={{
                                      background: theme.preview.secondary,
                                    }}
                                  />
                                </>
                              )}
                              {theme.value === 'minimal' && (
                                <div
                                  class="absolute inset-0 flex items-center justify-center font-bold text-xs"
                                  style={{ color: theme.preview.accent }}
                                >
                                  Aa
                                </div>
                              )}
                              {theme.value === 'cozy' && (
                                <>
                                  <div
                                    class="absolute top-0.5 left-0.5 right-0.5 h-2 rounded-sm"
                                    style={{
                                      background: theme.preview.secondary,
                                    }}
                                  />
                                  <div
                                    class="absolute bottom-1.5 left-1.5 right-1.5 h-0.5 rounded-full"
                                    style={{ background: theme.preview.accent }}
                                  />
                                  <div
                                    class="absolute bottom-3 left-1.5 right-2 h-0.5 rounded-full"
                                    style={{
                                      background: theme.preview.accent,
                                      opacity: 0.5,
                                    }}
                                  />
                                </>
                              )}
                              {theme.value === 'bold' && (
                                <div
                                  class="absolute inset-0"
                                  style={{
                                    background: `linear-gradient(135deg, ${theme.preview.accent}40 0%, ${theme.preview.secondary}40 100%)`,
                                  }}
                                >
                                  <div
                                    class="absolute top-1 left-1 h-2 w-2 rounded-full"
                                    style={{
                                      background: theme.preview.accent,
                                      'box-shadow': `0 0 6px ${theme.preview.accent}`,
                                    }}
                                  />
                                  <div
                                    class="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full"
                                    style={{
                                      background: theme.preview.secondary,
                                      'box-shadow': `0 0 4px ${theme.preview.secondary}`,
                                    }}
                                  />
                                </div>
                              )}
                              {theme.value === 'retro' && (
                                <>
                                  <div
                                    class="absolute top-1 left-1 text-xs font-mono"
                                    style={{
                                      color: theme.preview.accent,
                                      'text-shadow': `0 0 4px ${theme.preview.accent}`,
                                    }}
                                  >
                                    {'>_'}
                                  </div>
                                  <div
                                    class="absolute bottom-1 left-1 right-1 h-px"
                                    style={{ background: theme.preview.accent }}
                                  />
                                </>
                              )}
                            </div>
                            <div class="min-w-0 flex-1">
                              <div class="flex items-center gap-2">
                                <span
                                  class="truncate font-medium"
                                  style={{ color: 'var(--th-fg)' }}
                                >
                                  {theme.label}
                                </span>
                                <Palette
                                  class="h-3.5 w-3.5"
                                  style={{ color: 'var(--th-fg-subtle)' }}
                                />
                              </div>
                              <div
                                class="truncate text-xs"
                                style={{ color: 'var(--th-fg-muted)' }}
                              >
                                {theme.description}
                              </div>
                            </div>
                            <Show when={isActive}>
                              <span
                                class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  background: 'var(--th-accent-subtle)',
                                  color: 'var(--th-accent)',
                                }}
                              >
                                Active
                              </span>
                            </Show>
                          </>
                        )
                      })()}
                    </Show>

                    {/* Color mode item */}
                    <Show when={item.type === 'color-mode'}>
                      {(() => {
                        const mode = (
                          item as {
                            type: 'color-mode'
                            mode: (typeof colorModes)[number]
                          }
                        ).mode
                        const isActive = colorMode() === mode.value
                        return (
                          <>
                            <span
                              class="flex-shrink-0"
                              style={{ color: 'var(--th-fg-subtle)' }}
                            >
                              {getColorModeIcon(mode.value)}
                            </span>
                            <div class="min-w-0 flex-1">
                              <div
                                class="truncate font-medium"
                                style={{ color: 'var(--th-fg)' }}
                              >
                                {mode.label} Mode
                              </div>
                              <div
                                class="truncate text-xs"
                                style={{ color: 'var(--th-fg-muted)' }}
                              >
                                {mode.description}
                              </div>
                            </div>
                            <Show when={isActive}>
                              <span
                                class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  background: 'var(--th-accent-subtle)',
                                  color: 'var(--th-accent)',
                                }}
                              >
                                Active
                              </span>
                            </Show>
                          </>
                        )
                      })()}
                    </Show>

                    {/* New file action */}
                    <Show when={item.type === 'action'}>
                      <Plus
                        class="h-5 w-5 flex-shrink-0"
                        style={{ color: 'var(--th-fg-subtle)' }}
                      />
                      <div class="min-w-0 flex-1">
                        <div
                          class="truncate font-medium"
                          style={{ color: 'var(--th-fg)' }}
                        >
                          New File
                        </div>
                        <div
                          class="truncate text-xs"
                          style={{ color: 'var(--th-fg-muted)' }}
                        >
                          Create a new markdown file
                        </div>
                      </div>
                    </Show>
                  </button>
                )}
              </For>
            </Show>
          </div>

          {/* Footer hint */}
          <div
            class="border-t px-4 py-2"
            style={{
              'border-color': 'var(--th-border)',
              background: 'var(--th-bg-subtle)',
            }}
          >
            <div
              class="flex items-center justify-between text-xs"
              style={{ color: 'var(--th-fg-muted)' }}
            >
              <div class="flex items-center gap-2">
                <kbd
                  class="rounded px-1.5 py-0.5 font-mono"
                  style={{
                    background: 'var(--th-bg-elevated)',
                    border: '1px solid var(--th-border)',
                  }}
                >
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd
                  class="rounded px-1.5 py-0.5 font-mono"
                  style={{
                    background: 'var(--th-bg-elevated)',
                    border: '1px solid var(--th-border)',
                  }}
                >
                  ↵
                </kbd>
                <span>Select</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd
                  class="rounded px-1.5 py-0.5 font-mono"
                  style={{
                    background: 'var(--th-bg-elevated)',
                    border: '1px solid var(--th-border)',
                  }}
                >
                  esc
                </kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen()}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteFile}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setFileToDelete(null)
        }}
      />
    </Show>
  )
}
