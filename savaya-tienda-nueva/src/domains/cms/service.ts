import { getHomePageSections, getCustomPageSections } from './repository'
import { BLOCK_SCHEMAS } from './block-schemas'
import type { BlockType, BlockContent } from './block-schemas'
import type { PageSection } from './repository'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParsedBlock<T extends BlockType = BlockType> = {
  id: string
  type: T
  content: BlockContent<T>
  sortOrder: number
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Returns validated, parsed home page blocks.
 *
 * - Calls getHomePageSections() to fetch raw sections from the DB (or fallback).
 * - Validates each section's content against the corresponding Zod schema.
 * - Skips (with console.error) any section whose type is unknown or whose
 *   content fails validation — the page never crashes due to a bad CMS entry.
 */
export async function getHomeBlocks(): Promise<ParsedBlock[]> {
  const sections = await getHomePageSections()
  return parseSections(sections)
}

function parseSections(sections: PageSection[]): ParsedBlock[] {
  const parsed: ParsedBlock[] = []
  for (const section of sections) {
    const schema = BLOCK_SCHEMAS[section.type as BlockType]
    if (!schema) {
      console.error(`[cms/service] Unknown block type "${section.type}" (id: ${section.id}) — skipping`)
      continue
    }
    const result = schema.safeParse(section.content)
    if (!result.success) {
      console.error(`[cms/service] Invalid content for "${section.type}" (id: ${section.id}):`, result.error.flatten())
      continue
    }
    parsed.push({
      id: section.id,
      type: section.type as BlockType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: result.data as any,
      sortOrder: section.sortOrder,
    })
  }
  return parsed
}

/**
 * Returns validated blocks for a custom page (slug = 'p/...' in DB).
 * Returns null if the page doesn't exist or is inactive.
 */
export async function getCustomPageBlocks(slug: string): Promise<ParsedBlock[] | null> {
  const sections = await getCustomPageSections(slug)
  if (sections === null) return null
  return parseSections(sections)
}
