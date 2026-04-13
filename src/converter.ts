import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

// Extend default sanitization schema to allow class names on code/span
// (required for rehype-highlight syntax highlighting)
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
  },
}

// Sanitization schema for math-enabled pipeline — allows KaTeX/MathML output
// through the sanitizer (math elements, attributes, namespaces).
// Also allows id attributes for rehype-slug heading anchors, and disables
// the default clobber prefix so anchor links (#slug) match heading IDs.
const mathSanitizeSchema = {
  ...sanitizeSchema,
  // Don't prefix id attributes — anchor links must match heading slugs exactly
  clobberPrefix: '',
  clobber: [],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // MathML elements
    'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext',
    'msup', 'msub', 'msubsup', 'mfrac', 'mroot', 'msqrt', 'mtable',
    'mtr', 'mtd', 'mover', 'munder', 'munderover', 'mspace', 'mpadded',
    'mphantom', 'mfenced', 'menclose', 'mmultiscripts', 'mprescripts',
    'none', 'annotation', 'annotation-xml',
    // KaTeX span wrappers
    'span',
  ],
  attributes: {
    ...sanitizeSchema.attributes,
    // Allow id attributes on headings (rehype-slug adds them for anchor navigation)
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    math: ['xmlns', 'display', 'alttext'],
    mrow: [],
    mi: ['mathvariant'],
    mo: ['fence', 'separator', 'stretchy', 'symmetric', 'largeop', 'movablelimits', 'lspace', 'rspace', 'minsize', 'maxsize'],
    mn: [],
    ms: [],
    mtext: [],
    msup: [],
    msub: [],
    msubsup: [],
    mfrac: ['linethickness'],
    mroot: [],
    msqrt: [],
    mtable: ['columnalign', 'rowalign', 'columnspacing', 'rowspacing'],
    mtr: [],
    mtd: ['columnalign'],
    mover: ['accent'],
    munder: ['accentunder'],
    munderover: ['accent', 'accentunder'],
    mspace: ['width', 'height', 'depth'],
    mpadded: ['width', 'height', 'depth', 'lspace', 'voffset'],
    mphantom: [],
    mfenced: ['open', 'close', 'separators'],
    menclose: ['notation'],
    annotation: ['encoding'],
    'annotation-xml': ['encoding'],
    span: [...(sanitizeSchema.attributes?.span ?? []), 'className', 'style', 'aria-hidden'],
  },
}

/**
 * Convert markdown to HTML body string.
 * Supports GFM (tables, strikethrough, etc.) and LaTeX math ($...$, $$...$$).
 * Math is rendered as MathML for self-contained output (no external CSS/fonts).
 * Headings get slug-based id attributes for anchor link navigation.
 */
export async function convertMarkdown(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, { output: 'mathml' })
    .use(rehypeSlug)
    .use(rehypeSanitize, mathSanitizeSchema)
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
