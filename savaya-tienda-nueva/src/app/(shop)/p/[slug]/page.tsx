import { notFound } from 'next/navigation'
import { getCustomPageBlocks } from '@/domains/cms/service'
import { BlockRenderer } from '@/domains/cms/BlockRenderer'

// Always dynamic — content is managed in real-time via admin CMS
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CustomPage({ params }: Props) {
  const { slug } = await params
  const blocks = await getCustomPageBlocks(`p/${slug}`)

  if (blocks === null) notFound()

  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </>
  )
}
