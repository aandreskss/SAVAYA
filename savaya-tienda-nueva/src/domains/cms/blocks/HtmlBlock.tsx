import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'html_block'>

export function HtmlBlock({ html }: Props) {
  if (!html) return null

  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
