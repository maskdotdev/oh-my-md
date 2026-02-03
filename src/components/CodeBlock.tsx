import { Show, createEffect, createSignal } from 'solid-js'
import { Check, Copy } from 'lucide-solid'
import { codeToHtml } from 'shiki'
import { resolvedColorMode, aesthetic } from '../stores/theme'
import type { AestheticTheme } from '../stores/theme'
import type { BundledTheme } from 'shiki'

// Common languages to support - these will be loaded on demand by Shiki
const SUPPORTED_LANGUAGES: Set<string> = new Set([
  'javascript',
  'js',
  'typescript',
  'ts',
  'jsx',
  'tsx',
  'html',
  'css',
  'scss',
  'json',
  'markdown',
  'md',
  'python',
  'py',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'cs',
  'php',
  'ruby',
  'rb',
  'swift',
  'kotlin',
  'sql',
  'bash',
  'sh',
  'shell',
  'zsh',
  'powershell',
  'yaml',
  'yml',
  'toml',
  'xml',
  'graphql',
  'dockerfile',
  'docker',
  'vue',
  'svelte',
  'astro',
  'lua',
  'perl',
  'r',
  'scala',
  'elixir',
  'clojure',
  'haskell',
  'ocaml',
  'zig',
  'nim',
  'diff',
  'git-commit',
  'git-rebase',
  'makefile',
  'nginx',
  'ini',
  'properties',
  'plaintext',
  'text',
  'txt',
])

export interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock(props: CodeBlockProps) {
  const [copied, setCopied] = createSignal(false)
  const [highlightedHtml, setHighlightedHtml] = createSignal<string | null>(
    null,
  )
  const [isLoading, setIsLoading] = createSignal(true)

  const normalizeLanguage = (lang?: string): string => {
    if (!lang) return 'plaintext'
    const lower = lang.toLowerCase()

    // Map common aliases
    const aliases: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      cs: 'csharp',
      sh: 'bash',
      shell: 'bash',
      zsh: 'bash',
      yml: 'yaml',
      docker: 'dockerfile',
      text: 'plaintext',
      txt: 'plaintext',
    }

    if (aliases[lower]) return aliases[lower]
    if (SUPPORTED_LANGUAGES.has(lower)) return lower
    return 'plaintext'
  }

  // Get the appropriate Shiki theme based on aesthetic and color mode
  const getShikiTheme = (
    aestheticTheme: AestheticTheme,
    mode: 'light' | 'dark',
  ): BundledTheme => {
    const themeMap: Record<
      AestheticTheme,
      { light: BundledTheme; dark: BundledTheme }
    > = {
      editorial: {
        light: 'github-light',
        dark: 'nord',
      },
      minimal: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      cozy: {
        light: 'kanagawa-lotus',
        dark: 'kanagawa-wave',
      },
      bold: {
        light: 'one-light',
        dark: 'tokyo-night',
      },
      retro: {
        light: 'everforest-light',
        dark: 'everforest-dark',
      },
      tokyo: {
        light: 'github-light-default',
        dark: 'tokyo-night',
      },
    }

    return themeMap[aestheticTheme][mode]
  }

  // Highlight code with Shiki
  createEffect(() => {
    const code = props.code
    const lang = normalizeLanguage(props.language)
    const mode = resolvedColorMode()
    const currentAesthetic = aesthetic()

    setIsLoading(true)

    // Use appropriate theme based on aesthetic and color mode
    const shikiTheme = getShikiTheme(currentAesthetic, mode)

    codeToHtml(code, {
      lang,
      theme: shikiTheme,
    })
      .then((html) => {
        setHighlightedHtml(html)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Shiki highlighting failed:', err)
        // Fallback to plain text
        setHighlightedHtml(null)
        setIsLoading(false)
      })
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const displayLanguage = () => {
    const lang = props.language?.toLowerCase()
    if (!lang) return ''

    // Display friendly names
    const displayNames: Record<string, string> = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      jsx: 'JSX',
      tsx: 'TSX',
      py: 'Python',
      python: 'Python',
      rb: 'Ruby',
      ruby: 'Ruby',
      cs: 'C#',
      csharp: 'C#',
      cpp: 'C++',
      sh: 'Shell',
      bash: 'Bash',
      shell: 'Shell',
      zsh: 'Zsh',
      yml: 'YAML',
      yaml: 'YAML',
      md: 'Markdown',
      markdown: 'Markdown',
      dockerfile: 'Dockerfile',
      docker: 'Dockerfile',
      graphql: 'GraphQL',
      plaintext: 'Plain Text',
      text: 'Plain Text',
      txt: 'Plain Text',
    }

    return displayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
  }

  return (
    <div
      class="code-block group relative my-5 overflow-hidden"
      style={{
        'border-radius': 'var(--th-radius-lg)',
        border: '1px solid var(--th-border)',
      }}
    >
      {/* Header with language and copy button */}
      <div
        class="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'var(--th-bg-subtle)' }}
      >
        <div class="flex items-center gap-2">
          {/* Window dots decoration */}
          <div class="mr-2 flex items-center gap-1.5">
            <div
              class="h-3 w-3 rounded-full"
              style={{ background: 'var(--th-accent)', opacity: 0.6 }}
            />
            <div
              class="h-3 w-3 rounded-full"
              style={{ background: 'var(--th-fg-subtle)', opacity: 0.4 }}
            />
            <div
              class="h-3 w-3 rounded-full"
              style={{ background: 'var(--th-fg-subtle)', opacity: 0.4 }}
            />
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider"
            style={{
              color: 'var(--th-fg-muted)',
              'font-family': 'var(--font-ui)',
            }}
          >
            {displayLanguage()}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95"
          style={{
            color: 'var(--th-fg-muted)',
            'font-family': 'var(--font-ui)',
            'border-radius': 'var(--th-radius)',
          }}
          aria-label={copied() ? 'Copied!' : 'Copy code'}
        >
          <Show
            when={copied()}
            fallback={<Copy class="h-3.5 w-3.5" aria-hidden="true" />}
          >
            <Check
              class="h-3.5 w-3.5"
              style={{ color: 'var(--th-accent)' }}
              aria-hidden="true"
            />
          </Show>
          <span>{copied() ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code content */}
      <div class="overflow-x-auto" style={{ background: 'var(--th-bg)' }}>
        <Show
          when={!isLoading() && highlightedHtml()}
          fallback={
            <pre class="p-4">
              <code
                class="text-sm leading-relaxed"
                style={{
                  color: 'var(--th-fg)',
                  'font-family': 'var(--font-mono)',
                }}
              >
                {props.code}
              </code>
            </pre>
          }
        >
          {(html) => (
            <div
              class="shiki-wrapper [&>pre]:m-0 [&>pre]:overflow-x-auto [&>pre]:bg-transparent [&>pre]:p-4 [&>pre]:text-sm [&>pre]:leading-relaxed [&_code]:bg-transparent"
              innerHTML={html()}
            />
          )}
        </Show>
      </div>
    </div>
  )
}
