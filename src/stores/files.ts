import { createSignal } from 'solid-js'

export interface SavedFile {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'oh-my-md:files-v1'
const CURRENT_FILE_KEY = 'oh-my-md:current-file-v1'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function loadFromStorage(): Array<SavedFile> {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveToStorage(files: Array<SavedFile>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
}

function loadCurrentFileId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CURRENT_FILE_KEY)
}

function saveCurrentFileId(id: string | null): void {
  if (typeof window === 'undefined') return
  if (id) {
    window.localStorage.setItem(CURRENT_FILE_KEY, id)
  } else {
    window.localStorage.removeItem(CURRENT_FILE_KEY)
  }
}

const [files, setFiles] = createSignal<Array<SavedFile>>([])
const [currentFileId, setCurrentFileIdInternal] = createSignal<string | null>(
  null,
)
const [isInitialized, setIsInitialized] = createSignal(false)

export function initializeFilesStore(): void {
  if (isInitialized()) return
  const loadedFiles = loadFromStorage()
  setFiles(loadedFiles)
  const currentId = loadCurrentFileId()
  if (currentId && loadedFiles.some((f) => f.id === currentId)) {
    setCurrentFileIdInternal(currentId)
  }
  setIsInitialized(true)
}

export function getSavedFiles(): Array<SavedFile> {
  return files()
}

export function getCurrentFileId(): string | null {
  return currentFileId()
}

export function getCurrentFile(): SavedFile | undefined {
  const id = currentFileId()
  return id ? files().find((f) => f.id === id) : undefined
}

export function setCurrentFileId(id: string | null): void {
  setCurrentFileIdInternal(id)
  saveCurrentFileId(id)
}

export function createFile(name: string, content = ''): SavedFile {
  const now = Date.now()
  const file: SavedFile = {
    id: generateId(),
    name: name || 'Untitled',
    content,
    createdAt: now,
    updatedAt: now,
  }
  const updated = [...files(), file]
  setFiles(updated)
  saveToStorage(updated)
  return file
}

export function updateFile(
  id: string,
  updates: Partial<Pick<SavedFile, 'name' | 'content'>>,
): void {
  const updated = files().map((f) =>
    f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f,
  )
  setFiles(updated)
  saveToStorage(updated)
}

export function deleteFile(id: string): void {
  const updated = files().filter((f) => f.id !== id)
  setFiles(updated)
  saveToStorage(updated)
  if (currentFileId() === id) {
    setCurrentFileId(null)
  }
}

export function saveCurrentDraft(content: string): void {
  const id = currentFileId()
  if (id) {
    updateFile(id, { content })
  }
}

// For reactivity in components
export { files, currentFileId, isInitialized }
