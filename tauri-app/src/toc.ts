// toc.ts — Table of Contents with scroll spy
//
// Two clean exports:
// - buildToc(contentContainer, tocContainer): void — DOM API rendering
// - setupScrollSpy(contentEl): IntersectionObserver — returns observer for lifecycle control
//
// Headings must have IDs (assigned by main.ts after render).

interface TocEntry {
  id: string
  text: string
  level: number
}

/**
 * Extract headings from the rendered content container.
 * Returns an array of TocEntry objects for h1-h6 elements with IDs.
 */
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

/**
 * Build the TOC using DOM API and render into tocContainer.
 * Replaces any existing TOC content. Uses createElement (not innerHTML strings).
 */
export function buildToc(
  contentContainer: HTMLElement,
  tocContainer: HTMLElement,
): void {
  const entries = extractHeadings(contentContainer)

  // Clear existing TOC
  tocContainer.replaceChildren()

  const nav = document.createElement('nav')
  nav.className = 'toc'

  if (entries.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'toc-empty'
    empty.textContent = 'No headings'
    nav.appendChild(empty)
    tocContainer.appendChild(nav)
    return
  }

  // Title
  const title = document.createElement('div')
  title.className = 'toc-title'
  title.textContent = 'Contents'
  nav.appendChild(title)

  // Normalize indent levels relative to the minimum heading level
  const minLevel = Math.min(...entries.map((e) => e.level))

  for (const entry of entries) {
    const link = document.createElement('a')
    const indent = entry.level - minLevel
    link.className = `toc-link toc-level-${Math.min(indent, 5)}`
    link.setAttribute('data-heading-id', entry.id)
    link.textContent = entry.text
    link.tabIndex = 0
    link.role = 'link'
    nav.appendChild(link)
  }

  tocContainer.appendChild(nav)
}

/**
 * Set up an IntersectionObserver for scroll spy on headings.
 * Highlights the corresponding TOC link as headings scroll into the top 20% of the viewport.
 *
 * @param contentEl — the scroll container (#content)
 * @returns the IntersectionObserver instance (caller controls disconnect for lifecycle)
 */
export function setupScrollSpy(contentEl: HTMLElement): IntersectionObserver {
  const tocLinks = document.querySelectorAll<HTMLElement>('.toc-link')

  // Map heading IDs to their TOC link elements for fast lookup
  const linkMap = new Map<string, HTMLElement>()
  tocLinks.forEach((link) => {
    const id = link.getAttribute('data-heading-id')
    if (id) linkMap.set(id, link)
  })

  let currentActive: HTMLElement | null = null

  /**
   * Set the active TOC link, removing the previous highlight.
   * Auto-scrolls the active link into the sidebar viewport.
   */
  function setActive(headingId: string): void {
    const link = linkMap.get(headingId)
    if (!link || link === currentActive) return

    if (currentActive) {
      currentActive.classList.remove('toc-active')
    }
    link.classList.add('toc-active')
    currentActive = link

    // Keep the active link visible in the sidebar scroll area
    link.scrollIntoView({ block: 'nearest' })
  }

  // Track which headings are currently in the observation zone
  const visibleHeadings = new Map<string, IntersectionObserverEntry>()

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).id
        if (entry.isIntersecting) {
          visibleHeadings.set(id, entry)
        } else {
          visibleHeadings.delete(id)
        }
      }

      // Of all visible headings, pick the one closest to the top of the container
      if (visibleHeadings.size > 0) {
        let topId = ''
        let topY = Infinity
        for (const [id, entry] of visibleHeadings) {
          if (entry.boundingClientRect.top < topY) {
            topY = entry.boundingClientRect.top
            topId = id
          }
        }
        if (topId) setActive(topId)
      }
    },
    {
      root: contentEl,
      // Observation zone: top 20% of the scroll container
      rootMargin: '0px 0px -80% 0px',
      threshold: 0,
    },
  )

  // Observe all headings in the content area
  const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headings.forEach((heading) => {
    if (heading.id) observer.observe(heading)
  })

  // Edge case: short documents where all headings are visible — highlight first
  if (headings.length > 0 && headings[0].id) {
    // Use requestAnimationFrame to let observer fire first
    requestAnimationFrame(() => {
      if (!currentActive && headings[0].id) {
        setActive(headings[0].id)
      }
    })
  }

  return observer
}
