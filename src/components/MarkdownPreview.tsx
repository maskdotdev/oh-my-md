import { For, Show, createMemo } from 'solid-js'
import MarkdownIt from 'markdown-it'
import CodeBlock from './CodeBlock'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

// Store original renderers
const originalFence = md.renderer.rules.fence
const originalCodeBlock = md.renderer.rules.code_block

interface CodeBlockData {
  id: string
  code: string
  language: string
}

type Segment =
  | { type: 'html'; content: string }
  | { type: 'code'; data: CodeBlockData }

export interface MarkdownPreviewProps {
  content: string
}

export default function MarkdownPreview(props: MarkdownPreviewProps) {
  // Extract code blocks and replace them with placeholders
  const processedContent = createMemo(() => {
    const source = props.content
    if (!source.trim())
      return { html: '', codeBlocks: [] as Array<CodeBlockData> }

    const codeBlocks: Array<CodeBlockData> = []
    let blockIndex = 0

    // Custom renderer for fenced code blocks
    md.renderer.rules.fence = (tokens, idx) => {
      const token = tokens[idx]
      const code = token.content
      const language = token.info || 'plaintext'
      const id = `code-block-${blockIndex++}`

      codeBlocks.push({ id, code: code.replace(/\n$/, ''), language })

      // Return a placeholder div that we'll replace with our CodeBlock component
      return `<div data-code-block-id="${id}"></div>`
    }

    // Custom renderer for indented code blocks
    md.renderer.rules.code_block = (tokens, idx) => {
      const token = tokens[idx]
      const code = token.content
      const id = `code-block-${blockIndex++}`

      codeBlocks.push({
        id,
        code: code.replace(/\n$/, ''),
        language: 'plaintext',
      })

      return `<div data-code-block-id="${id}"></div>`
    }

    const html = md.render(source)

    // Restore default renderers
    md.renderer.rules.fence = originalFence
    md.renderer.rules.code_block = originalCodeBlock

    return { html, codeBlocks }
  })

  // Split HTML by code block placeholders
  const segments = createMemo((): Array<Segment> => {
    const { html, codeBlocks } = processedContent()
    if (!html) return []

    const result: Array<Segment> = []

    // Create a map for quick lookup
    const codeBlockMap = new Map(codeBlocks.map((cb) => [cb.id, cb]))

    // Split by placeholder divs
    const regex = /<div data-code-block-id="([^"]+)"><\/div>/g
    let lastIndex = 0
    let match = regex.exec(html)

    while (match !== null) {
      // Add HTML before the placeholder
      if (match.index > lastIndex) {
        const htmlContent = html.slice(lastIndex, match.index)
        if (htmlContent.trim()) {
          result.push({ type: 'html', content: htmlContent })
        }
      }

      // Add the code block
      const codeBlock = codeBlockMap.get(match[1])
      if (codeBlock) {
        result.push({ type: 'code', data: codeBlock })
      }

      lastIndex = match.index + match[0].length
      match = regex.exec(html)
    }

    // Add remaining HTML
    if (lastIndex < html.length) {
      const htmlContent = html.slice(lastIndex)
      if (htmlContent.trim()) {
        result.push({ type: 'html', content: htmlContent })
      }
    }

    return result
  })

  return (
    <div class="markdown">
      <For each={segments()}>
        {(segment) => (
          <Show
            when={segment.type === 'code'}
            fallback={
              <div
                innerHTML={
                  (segment as { type: 'html'; content: string }).content
                }
              />
            }
          >
            <CodeBlock
              code={
                (segment as { type: 'code'; data: CodeBlockData }).data.code
              }
              language={
                (segment as { type: 'code'; data: CodeBlockData }).data.language
              }
            />
          </Show>
        )}
      </For>
    </div>
  )
}
