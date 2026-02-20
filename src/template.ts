import { CSS } from './styles'

/**
 * Build a full HTML page from a rendered body.
 * When injectScript is provided (watch mode), it's inserted before </body>.
 */
export function buildHtml(title: string, body: string, injectScript?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <article class="prose">
    ${body}
  </article>
${injectScript ? injectScript : ''}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
