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
const originalImage = md.renderer.rules.image
const originalLinkOpen = md.renderer.rules.link_open
const originalLinkClose = md.renderer.rules.link_close

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

    const defaultImageRenderer =
      originalImage ||
      ((tokens, idx, options, _env, self) =>
        self.renderToken(tokens, idx, options))
    const defaultLinkOpenRenderer =
      originalLinkOpen ||
      ((tokens, idx, options, _env, self) =>
        self.renderToken(tokens, idx, options))
    const defaultLinkCloseRenderer =
      originalLinkClose ||
      ((tokens, idx, options, _env, self) =>
        self.renderToken(tokens, idx, options))

    const imageToggleButtonHtml =
      '<button type="button" class="md-image-toggle" data-md-image-toggle aria-pressed="false" aria-label="Invert image colors" title="Invert colors">Invert</button>'

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

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      const imageHtml = defaultImageRenderer(tokens, idx, options, env, self)
      const parentLevel = tokens[idx].level - 1
      let isInsideLink = false

      if (parentLevel >= 0) {
        for (let i = idx - 1; i >= 0; i -= 1) {
          const token = tokens[i]
          if (token.level !== parentLevel) continue
          if (token.type === 'link_close') break
          if (token.type === 'link_open') {
            isInsideLink = true
            break
          }
        }
      }

      if (isInsideLink) return imageHtml

      return `<span class="md-image" data-md-image>${imageHtml}${imageToggleButtonHtml}</span>`
    }

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const isImageLink =
        tokens[idx + 1]?.type === 'image' &&
        tokens[idx + 2]?.type === 'link_close'

      if (!isImageLink)
        return defaultLinkOpenRenderer(tokens, idx, options, env, self)

      return `<span class="md-image" data-md-image>${defaultLinkOpenRenderer(
        tokens,
        idx,
        options,
        env,
        self,
      )}`
    }

    md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
      const isImageLink =
        tokens[idx - 1]?.type === 'image' &&
        tokens[idx - 2]?.type === 'link_open'

      if (!isImageLink)
        return defaultLinkCloseRenderer(tokens, idx, options, env, self)

      return `${defaultLinkCloseRenderer(
        tokens,
        idx,
        options,
        env,
        self,
      )}${imageToggleButtonHtml}</span>`
    }

    const html = md.render(source)

    // Restore default renderers
    md.renderer.rules.fence = originalFence
    md.renderer.rules.code_block = originalCodeBlock
    md.renderer.rules.image = originalImage
    md.renderer.rules.link_open = originalLinkOpen
    md.renderer.rules.link_close = originalLinkClose

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

  const handleMarkdownClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    const toggle = target?.closest(
      '[data-md-image-toggle]',
    ) as HTMLButtonElement | null

    if (!toggle) return

    event.preventDefault()
    event.stopPropagation()

    const wrapper = toggle.closest('[data-md-image]') as HTMLElement | null
    if (!wrapper) return

    const isInverted = wrapper.classList.toggle('is-inverted')
    toggle.setAttribute('aria-pressed', isInverted ? 'true' : 'false')
    toggle.textContent = isInverted ? 'Normal' : 'Invert'
    toggle.setAttribute(
      'aria-label',
      isInverted ? 'Show normal colors' : 'Invert image colors',
    )
    toggle.setAttribute('title', isInverted ? 'Show normal colors' : 'Invert')
  }

  return (
    <div class="markdown" onClick={handleMarkdownClick}>
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
