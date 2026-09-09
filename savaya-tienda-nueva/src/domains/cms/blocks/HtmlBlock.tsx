import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'html_block'>

export function HtmlBlock({ html }: Props) {
  if (!html) return null

  return (
    <div
      className="max-w-screen-xl mx-auto px-4 md:px-10 py-8"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
