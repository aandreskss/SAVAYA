import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'html_block'>

const SCOPE_CLASS = 'savaya-html-blk'

/**
 * Processes raw HTML for safe embedding inside the shop layout:
 * - Moves Google Font <link> tags out of <head> so they load correctly
 * - Extracts all <style> blocks and scopes them with CSS @scope so they
 *   don't bleed into the site's navbar / footer / other blocks
 * - Strips the HTML's own <header> and <footer> (the shop layout provides them)
 * - Strips structural wrappers (<html>, <head>, <body>)
 */
function processHtml(raw: string): string {
  // --- collect <style> contents ---
  const styles: string[] = []
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let m: RegExpExecArray | null
  while ((m = styleRe.exec(raw)) !== null) styles.push(m[1])

  // --- collect Google Font <link> tags ---
  const fontLinks: string[] = []
  const linkRe = /<link[^>]*>/gi
  while ((m = linkRe.exec(raw)) !== null) {
    if (m[0].includes('fonts.google') || m[0].includes('fonts.gstatic')) {
      fontLinks.push(m[0])
    }
  }

  // --- strip structural chrome ---
  let content = raw
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')   // entire <head>
    .replace(/<\/?(html|body)[^>]*>/gi, '')           // <html>, <body> wrappers
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // page's own nav header
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // page's own footer
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // already extracted above
    .trim()

  // --- build @scope block ---
  // :root and body are remapped to :scope so custom properties and base
  // styles apply only within the block wrapper, not the whole document.
  let scopedStyle = ''
  if (styles.length > 0) {
    const css = styles
      .join('\n')
      .replace(/:root/g, ':scope')
      .replace(/\bhtml\s*\{/g, ':scope {')
      .replace(/\bbody\s*\{/g, ':scope {')
    scopedStyle = `<style>\n@scope (.${SCOPE_CLASS}) {\n${css}\n}\n</style>`
  }

  return [
    fontLinks.join('\n'),
    scopedStyle,
    `<div class="${SCOPE_CLASS}">${content}</div>`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function HtmlBlock({ html }: Props) {
  if (!html) return null

  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: processHtml(html) }}
    />
  )
}
