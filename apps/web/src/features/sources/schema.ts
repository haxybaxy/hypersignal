import { z } from 'zod'

export const SOURCE_KINDS = ['hackernews', 'reddit', 'twitter', 'linkedin', 'rss'] as const

export const sourceKindSchema = z.enum(SOURCE_KINDS)
export type SourceKind = z.infer<typeof sourceKindSchema>

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  hackernews: 'Hacker News',
  reddit: 'Reddit',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  rss: 'RSS',
}

export const feedUrlSchema = z
  .url({ protocol: /^https?$/, error: 'Enter a valid http(s) feed URL' })
  .trim()
  .max(2048, 'Feed URL is too long')

export const sourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  kind: sourceKindSchema,
  feedUrl: feedUrlSchema,
  enabled: z.boolean().default(true),
})
export type Source = z.infer<typeof sourceSchema>

/** Fields a user fills in when adding a source. */
export const newSourceSchema = sourceSchema.pick({ name: true, kind: true, feedUrl: true })
export type NewSource = z.infer<typeof newSourceSchema>

/** The shareable import/export file format. */
export const sourcesFileSchema = z.object({
  version: z.literal(1),
  sources: z.array(sourceSchema),
})
export type SourcesFile = z.infer<typeof sourcesFileSchema>

export const SOURCES_FILE_VERSION = 1 as const
