import { Fragment } from 'react'
import type { Metadata } from 'next'
import { getHomeBlocks } from '@/domains/cms/service'
import { BlockRenderer } from '@/domains/cms/BlockRenderer'
import { listActiveCategories } from '@/domains/catalog/repository'
import { CategoryPillsRow } from '@/domains/catalog/components/CategoryPillsRow'

// ISR: revalidate every hour — CMS blocks are edited infrequently
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'SAVAYA — Calzado venezolano | Valencia, Carabobo',
  description:
    'Descubre nuestra colección de calzado femenino. Tallas 35 al 40. Envíos a todo Venezuela desde Valencia, Carabobo.',
}

export default async function HomePage() {
  const [blocks, categories] = await Promise.all([getHomeBlocks(), listActiveCategories()])

  return (
    <main>
      {blocks.map((block) => (
        <Fragment key={block.id}>
          <BlockRenderer block={block} />
          {block.type === 'hero' && <CategoryPillsRow categories={categories} />}
        </Fragment>
      ))}
    </main>
  )
}
