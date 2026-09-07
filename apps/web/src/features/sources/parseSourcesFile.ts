import { z } from 'zod'
import { sourcesFileSchema, type SourcesFile } from './schema'

export type ParseSourcesFileResult = { ok: true; file: SourcesFile } | { ok: false; error: string }

/** Parse the text of an uploaded sources JSON file into a validated `SourcesFile`. */
export function parseSourcesFile(text: string): ParseSourcesFileResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON' }
  }
  const result = sourcesFileSchema.safeParse(json)
  if (result.success) return { ok: true, file: result.data }
  const issue = result.error.issues[0]
  const where = issue?.path.length
    ? ` at ${z.prettifyError(result.error).split('\n')[0] ?? ''}`
    : ''
  return { ok: false, error: `Not a Hypersignal sources file${where}` }
}
