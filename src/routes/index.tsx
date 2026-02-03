import { createFileRoute } from '@tanstack/solid-router'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { Command, Palette } from 'lucide-solid'
import CommandPalette from '../components/CommandPalette'
import InputDialog from '../components/InputDialog'
import MarkdownPreview from '../components/MarkdownPreview'
import {
  createFile,
  currentFileId,
  files,
  getCurrentFile,
  initializeFilesStore,
  setCurrentFileId,
  updateFile,
} from '../stores/files'
import { aesthetic, initializeThemeStore } from '../stores/theme'
import type { SavedFile } from '../stores/files'

export const Route = createFileRoute('/')({ component: App })

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null
let pdfWorkerReady = false

const getPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist')
  }
  const pdfjs = await pdfjsPromise
  if (!pdfWorkerReady) {
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url'))
      .default as string
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    pdfWorkerReady = true
  }
  return pdfjs
}

const sampleMarkdown = `# Welcome to Oh My MD

A beautiful markdown editor with **5 distinctive aesthetic themes**. Press **Cmd/Ctrl + K** to open the command palette and explore.

## Typography That Breathes

Each theme brings its own personality through carefully chosen fonts and spacing. Notice how the headings, body text, and code all work together harmoniously.

This is regular text with **bold emphasis**, *italic styling*, and ***bold italic*** combined. You can also use ~~strikethrough~~ for edits and \`inline code\` for technical snippets.

## Curated Lists

### Ideas to Explore
- Editorial theme for magazine-style reading
- Minimal theme for distraction-free writing
- Cozy theme for a warm, inviting feel
- Bold theme for striking visual impact
- Retro theme for nostalgic typewriter vibes

### A Structured Process
1. Choose your aesthetic with Cmd/Ctrl + K
2. Write in the editor
3. Preview your formatted content
4. Toggle dark mode for night sessions

## Thoughtful Quotes

> Design is not just what it looks like and feels like. Design is how it works.
>
> — Steve Jobs

## Code That Shines

Here's a JavaScript example with syntax highlighting:

\`\`\`javascript
function createTheme(name, config) {
  const theme = {
    name,
    fonts: config.fonts,
    colors: config.colors,
    spacing: config.spacing ?? 'comfortable',
  };
  
  return Object.freeze(theme);
}

// Create a cozy reading experience
const cozy = createTheme('cozy', {
  fonts: { display: 'Lora', body: 'Work Sans' },
  colors: { accent: '#059669', bg: '#f0fdf4' },
});
\`\`\`

And some Python for variety:

\`\`\`python
class AestheticTheme:
    """A theme that sparks joy."""
    
    def __init__(self, name: str, mood: str):
        self.name = name
        self.mood = mood
        self._active = False
    
    def activate(self) -> None:
        self._active = True
        print(f"✨ {self.name} theme activated")
\`\`\`

## Data at a Glance

| Theme | Personality | Best For |
|-------|-------------|----------|
| Editorial | Refined, sophisticated | Long-form reading |
| Minimal | Clean, focused | Distraction-free writing |
| Cozy | Warm, inviting | Comfortable browsing |
| Bold | Strong, confident | Making a statement |
| Retro | Nostalgic, playful | Creative projects |

---

## Get Started

Open the command palette with **Cmd/Ctrl + K** to:
- Switch between aesthetic themes
- Toggle light/dark mode
- Create and manage files

Happy writing! ✨
`

function App() {
  const [markdown, setMarkdown] = createSignal(sampleMarkdown)
  const [pendingSave, setPendingSave] = createSignal(false)
  const [lastSavedValue, setLastSavedValue] = createSignal(sampleMarkdown)
  const [mode, setMode] = createSignal<'edit' | 'preview'>('preview')
  const [commandPaletteOpen, setCommandPaletteOpen] = createSignal(false)
  const [newFileDialogOpen, setNewFileDialogOpen] = createSignal(false)
  const [currentFileName, setCurrentFileName] = createSignal('Untitled')
  let textareaRef: HTMLTextAreaElement | undefined
  const [isDragging, setIsDragging] = createSignal(false)
  const [importNotice, setImportNotice] = createSignal<{
    tone: 'info' | 'success' | 'error'
    message: string
  } | null>(null)
  const [isImporting, setIsImporting] = createSignal(false)
  let dragDepth = 0
  let noticeTimeout: ReturnType<typeof setTimeout> | undefined

  const isEmpty = createMemo(() => markdown().trim().length === 0)

  // Initialize stores
  onMount(() => {
    if (typeof window === 'undefined') return
    initializeFilesStore()
    initializeThemeStore()

    // Load current file if exists
    const file = getCurrentFile()
    if (file) {
      setMarkdown(file.content)
      setLastSavedValue(file.content)
      setCurrentFileName(file.name)
    }

    const handleDragEnterGlobal = (event: DragEvent) => handleDragEnter(event)
    const handleDragOverGlobal = (event: DragEvent) => handleDragOver(event)
    const handleDragLeaveGlobal = (event: DragEvent) => handleDragLeave(event)
    const handleDropGlobal = (event: DragEvent) => handleDrop(event)
    const handleDragEndGlobal = () => handleDragEnd()

    window.addEventListener('dragenter', handleDragEnterGlobal)
    window.addEventListener('dragover', handleDragOverGlobal)
    window.addEventListener('dragleave', handleDragLeaveGlobal)
    window.addEventListener('drop', handleDropGlobal)
    window.addEventListener('dragend', handleDragEndGlobal)

    onCleanup(() => {
      window.removeEventListener('dragenter', handleDragEnterGlobal)
      window.removeEventListener('dragover', handleDragOverGlobal)
      window.removeEventListener('dragleave', handleDragLeaveGlobal)
      window.removeEventListener('drop', handleDropGlobal)
      window.removeEventListener('dragend', handleDragEndGlobal)
    })
  })

  // Update content when file changes
  createEffect(() => {
    const fileId = currentFileId()
    if (!fileId) return
    const file = files().find((f) => f.id === fileId)
    if (file) {
      setMarkdown(file.content)
      setLastSavedValue(file.content)
      setCurrentFileName(file.name)
    }
  })

  // Auto-save with debounce
  createEffect(() => {
    if (typeof window === 'undefined') return
    const value = markdown()
    const fileId = currentFileId()

    if (value === lastSavedValue()) {
      setPendingSave(false)
      return
    }

    setPendingSave(true)
    const handle = window.setTimeout(() => {
      if (fileId) {
        updateFile(fileId, { content: value })
      }
      setLastSavedValue(value)
      setPendingSave(false)
    }, 400)
    onCleanup(() => window.clearTimeout(handle))
  })

  // Warn before closing with unsaved changes
  createEffect(() => {
    if (typeof window === 'undefined') return
    const handle = (event: BeforeUnloadEvent) => {
      if (!pendingSave()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handle)
    onCleanup(() => window.removeEventListener('beforeunload', handle))
  })

  // Global keyboard shortcut for command palette
  createEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown))
  })

  onCleanup(() => {
    if (noticeTimeout) clearTimeout(noticeTimeout)
  })

  const setNotice = (
    notice: {
      tone: 'info' | 'success' | 'error'
      message: string
    } | null,
  ) => {
    if (noticeTimeout) clearTimeout(noticeTimeout)
    setImportNotice(notice)
    if (notice && notice.tone !== 'info') {
      noticeTimeout = setTimeout(() => setImportNotice(null), 4500)
    }
  }

  const isPdfFile = (file: File) => {
    const name = file.name.toLowerCase()
    return file.type === 'application/pdf' || name.endsWith('.pdf')
  }

  const isDocxFile = (file: File) => {
    const name = file.name.toLowerCase()
    return (
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    )
  }

  const normalizeImportedName = (name: string) => {
    const baseName = name.replace(/\.[^/.]+$/, '').trim()
    return baseName || 'Imported file'
  }

  const sanitizeImportedMarkdown = (value: string) => {
    let cleaned = value.replace(/^\uFEFF/, '').replace(/\u00a0/g, ' ')
    const emptyAnchorRegex =
      /<a\s+(?:id|name)=(?:"[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’)[^>]*>\s*<\/a>/gi
    cleaned = cleaned.replace(emptyAnchorRegex, '')
    return cleaned
  }

  const convertDocxToMarkdown = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.convertToMarkdown({ arrayBuffer })
    let value = result.value ?? ''
    if (!value.trim()) {
      const raw = await mammoth.extractRawText({ arrayBuffer })
      value = raw.value ?? ''
    }
    return sanitizeImportedMarkdown(value)
  }

  const extractPdfText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfjs = await getPdfJs()
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const pages: string[] = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim()
      if (pageText) pages.push(pageText)
    }
    return pages.join('\n\n')
  }

  const handleImportFile = async (file: File) => {
    if (isImporting()) return
    setIsImporting(true)
    setNotice({ tone: 'info', message: `Importing ${file.name}...` })
    try {
      if (!isPdfFile(file) && !isDocxFile(file)) {
        setNotice({
          tone: 'error',
          message: 'Only .docx and .pdf files are supported.',
        })
        return
      }

      const text = isDocxFile(file)
        ? await convertDocxToMarkdown(file)
        : await extractPdfText(file)

      if (!text.trim()) {
        setNotice({
          tone: 'error',
          message: 'No text found in that file.',
        })
        return
      }

      const imported = createFile(normalizeImportedName(file.name), text)
      setCurrentFileId(imported.id)
      setMarkdown(text)
      setLastSavedValue(text)
      setCurrentFileName(imported.name)
      setNotice({ tone: 'success', message: `Imported ${file.name}.` })
      if (mode() === 'edit') {
        queueMicrotask(() => textareaRef?.focus())
      }
    } catch (error) {
      console.error(error)
      setNotice({
        tone: 'error',
        message: 'Import failed. Please try another file.',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const hasFilePayload = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files')

  const handleDragEnter = (event: DragEvent) => {
    if (!hasFilePayload(event)) return
    event.preventDefault()
    dragDepth += 1
    setIsDragging(true)
  }

  const handleDragOver = (event: DragEvent) => {
    if (!hasFilePayload(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (event: DragEvent) => {
    if (event.relatedTarget === null) {
      dragDepth = 0
      setIsDragging(false)
      return
    }
    if (!hasFilePayload(event)) return
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) setIsDragging(false)
  }

  const handleDragEnd = () => {
    dragDepth = 0
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent) => {
    if (!hasFilePayload(event)) return
    event.preventDefault()
    dragDepth = 0
    setIsDragging(false)
    if (isImporting()) return
    const files = event.dataTransfer?.files
    const file = files?.[0]
    if (file) void handleImportFile(file)
  }

  const handleSelectFile = (file: SavedFile) => {
    setMarkdown(file.content)
    setLastSavedValue(file.content)
    setCurrentFileName(file.name)
  }

  const handleCreateFile = () => {
    setNewFileDialogOpen(true)
  }

  const handleCreateFileSubmit = (name: string) => {
    setNewFileDialogOpen(false)
    const file = createFile(name, '')
    setCurrentFileId(file.id)
    setMarkdown('')
    setLastSavedValue('')
    setCurrentFileName(file.name)
    setMode('edit')
    queueMicrotask(() => textareaRef?.focus())
  }

  // Get aesthetic-aware label
  const aestheticLabel = () => {
    const labels: Record<string, string> = {
      editorial: 'Editorial',
      minimal: 'Minimal',
      cozy: 'Cozy',
      bold: 'Bold',
      retro: 'Retro',
    }
    return labels[aesthetic()] || 'Editorial'
  }

  return (
    <div
      class="relative flex min-h-screen items-start justify-center p-4 transition-colors duration-300 sm:p-8"
      style={{ background: 'var(--th-bg)' }}
    >
      <Show when={isDragging()}>
        <div class="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <div
            class="rounded-2xl border-2 border-dashed px-8 py-6 text-sm font-semibold shadow-lg"
            style={{
              background: 'var(--th-bg-elevated)',
              color: 'var(--th-accent)',
              border: '2px dashed var(--th-accent)',
            }}
          >
            Drop a .docx or .pdf anywhere to import
          </div>
        </div>
      </Show>
      <Show when={importNotice()}>
        {(notice) => (
          <div
            class="fixed bottom-4 right-4 z-50 rounded-2xl px-4 py-3 text-xs font-semibold shadow-lg"
            style={{
              background: 'var(--th-bg-elevated)',
              border: '1px solid var(--th-border)',
              color:
                notice().tone === 'info'
                  ? 'var(--th-fg-muted)'
                  : 'var(--th-accent)',
            }}
          >
            {notice().message}
          </div>
        )}
      </Show>
      <div
        class="editor-container flex w-full max-w-3xl flex-col overflow-hidden animate-fade-in"
        style={{
          background: 'var(--th-bg-elevated)',
          border: '1px solid var(--th-border)',
          'border-radius': 'var(--th-radius-lg)',
        }}
      >
        {/* Header */}
        <div
          class="flex items-center justify-between px-4 py-3"
          style={{
            'border-bottom': '1px solid var(--th-border)',
            background: 'var(--th-bg-subtle)',
          }}
        >
          <div class="flex items-center gap-3">
            {/* Mode toggle */}
            <div
              class="flex items-center gap-1 p-0.5"
              style={{
                background: 'var(--th-bg)',
                border: '1px solid var(--th-border)',
                'border-radius': 'var(--th-radius)',
              }}
            >
              <button
                type="button"
                class="px-3 py-1 text-sm font-medium transition-all"
                style={{
                  'font-family': 'var(--font-ui)',
                  'border-radius': 'calc(var(--th-radius) - 2px)',
                  background:
                    mode() === 'edit' ? 'var(--th-bg-elevated)' : 'transparent',
                  color:
                    mode() === 'edit' ? 'var(--th-fg)' : 'var(--th-fg-muted)',
                  'box-shadow':
                    mode() === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                onClick={() => {
                  setMode('edit')
                  queueMicrotask(() => textareaRef?.focus())
                }}
              >
                Edit
              </button>
              <button
                type="button"
                class="px-3 py-1 text-sm font-medium transition-all"
                style={{
                  'font-family': 'var(--font-ui)',
                  'border-radius': 'calc(var(--th-radius) - 2px)',
                  background:
                    mode() === 'preview'
                      ? 'var(--th-bg-elevated)'
                      : 'transparent',
                  color:
                    mode() === 'preview'
                      ? 'var(--th-fg)'
                      : 'var(--th-fg-muted)',
                  'box-shadow':
                    mode() === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                onClick={() => setMode('preview')}
              >
                Preview
              </button>
            </div>

            {/* File name */}
            <Show when={currentFileId()}>
              <span
                class="hidden text-sm font-medium sm:inline"
                style={{
                  color: 'var(--th-fg-muted)',
                  'font-family': 'var(--font-ui)',
                }}
              >
                {currentFileName()}
              </span>
            </Show>
          </div>

          <div class="flex items-center gap-3">
            {/* Current theme indicator */}
            <button
              type="button"
              class="hidden items-center gap-1.5 px-2 py-1 text-xs font-medium transition-colors sm:flex"
              style={{
                color: 'var(--th-fg-muted)',
                'font-family': 'var(--font-ui)',
                background: 'var(--th-bg)',
                border: '1px solid var(--th-border)',
                'border-radius': 'var(--th-radius)',
              }}
              onClick={() => setCommandPaletteOpen(true)}
              title="Change theme"
            >
              <Palette class="h-3 w-3" style={{ color: 'var(--th-accent)' }} />
              <span>{aestheticLabel()}</span>
            </button>

            {/* Save status */}
            <span
              class="text-xs"
              style={{
                color: 'var(--th-fg-subtle)',
                'font-family': 'var(--font-ui)',
              }}
              aria-live="polite"
            >
              {pendingSave() ? 'Saving…' : currentFileId() ? 'Saved' : ''}
            </span>

            {/* Command palette button */}
            <button
              type="button"
              class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors"
              style={{
                color: 'var(--th-fg-muted)',
                'font-family': 'var(--font-ui)',
                background: 'var(--th-bg)',
                border: '1px solid var(--th-border)',
                'border-radius': 'var(--th-radius)',
              }}
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Command class="h-3 w-3" />
              <span class="hidden sm:inline">K</span>
            </button>
          </div>
        </div>

        {/* Editor */}
        <Show when={mode() === 'edit'}>
          <textarea
            ref={(el) => {
              textareaRef = el
            }}
            class="editor-textarea min-h-[70vh] flex-1 resize-none p-6 text-sm leading-relaxed outline-none"
            style={{
              'font-family': 'var(--font-mono)',
              color: 'var(--th-fg)',
              background: 'transparent',
              'caret-color': 'var(--th-accent)',
            }}
            placeholder="Write something…"
            aria-label="Markdown editor"
            name="markdown"
            autocomplete="off"
            spellcheck={false}
            value={markdown()}
            onInput={(event) => setMarkdown(event.currentTarget.value)}
          />
        </Show>

        {/* Preview */}
        <Show when={mode() === 'preview'}>
          <div class="min-h-[70vh] flex-1 overflow-y-auto p-6 sm:p-8">
            <Show
              when={!isEmpty()}
              fallback={
                <p class="text-sm" style={{ color: 'var(--th-fg-subtle)' }}>
                  Nothing to preview…
                </p>
              }
            >
              <MarkdownPreview content={markdown()} />
            </Show>
          </div>
        </Show>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen()}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectFile={handleSelectFile}
        onCreateFile={handleCreateFile}
      />

      {/* New File Dialog */}
      <InputDialog
        isOpen={newFileDialogOpen()}
        title="Create New File"
        description="Enter a name for your new markdown file."
        placeholder="File name"
        defaultValue="Untitled"
        submitLabel="Create"
        onSubmit={handleCreateFileSubmit}
        onCancel={() => setNewFileDialogOpen(false)}
      />
    </div>
  )
}
