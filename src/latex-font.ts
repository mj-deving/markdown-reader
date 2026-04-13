// latex-font.ts — Generate @font-face CSS with base64-embedded Latin Modern Roman
//
// Reads woff2 files from src/fonts/, base64-encodes them, and returns CSS
// with @font-face declarations. Used by --latex-font CLI flag to produce
// self-contained HTML with the authentic LaTeX font.

import { join } from 'path'

const FONTS_DIR = join(import.meta.dir, 'fonts')

const FONT_FILES = [
  { file: 'lm-roman-regular.woff2', weight: '400', style: 'normal' },
  { file: 'lm-roman-bold.woff2', weight: '700', style: 'normal' },
  { file: 'lm-roman-italic.woff2', weight: '400', style: 'italic' },
] as const

/**
 * Generate @font-face CSS with base64-inlined Latin Modern Roman woff2 fonts.
 * Each font face is ~64KB base64, ~192KB total — acceptable for self-contained HTML.
 */
export async function generateLatinModernCSS(): Promise<string> {
  const faces: string[] = []

  for (const { file, weight, style } of FONT_FILES) {
    const path = join(FONTS_DIR, file)
    const buffer = await Bun.file(path).arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    faces.push(`@font-face {
  font-family: 'Latin Modern Roman';
  src: url('data:font/woff2;base64,${base64}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`)
  }

  return faces.join('\n')
}
