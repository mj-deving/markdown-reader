// toc.ts — Table of Contents extractor and renderer
//
// Parses the rendered HTML for heading elements (h1-h6),
// builds a hierarchical TOC sidebar with clickable links.
// Headings must have IDs (assigned by main.ts after render).

interface TocEntry {
  id: string
  text: string
  level: number
}

// Extract headings from the rendered content container
function extractHeadings(container: HTMLElement): TocEntry[] {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const entries: TocEntry[] = []

  headings.forEach((heading) => {
    if (heading.id && heading.textContent) {
      entries.push({
        id: heading.id,
        text: heading.textContent.trim(),
        level: parseInt(heading.tagName[1], 10),
      })
    }
  })

  return entries
}

// Build TOC HTML from heading entries
export function buildToc(container: HTMLElement): string {
  const entries = extractHeadings(container)

  if (entries.length === 0) {
    return '<nav class="toc"><p class="toc-empty">No headings</p></nav>'
  }

  // Find the minimum heading level to normalize indentation
  const minLevel = Math.min(...entries.map((e) => e.level))

  const items = entries
    .map((entry) => {
      const indent = entry.level - minLevel
      return `<a class="toc-link toc-level-${indent}" data-heading-id="${entry.id}">${entry.text}</a>`
    })
    .join('\n')

  return `<nav class="toc">
  <div class="toc-title">Contents</div>
  ${items}
</nav>`
}
