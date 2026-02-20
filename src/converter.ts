import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

export async function convertMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown)

  return String(result)
}

// Extract the first H1 heading as the document title, fall back to provided default
export function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}
