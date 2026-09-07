/** `crypto.randomUUID` only exists in secure contexts (https or localhost). */
export function newId(): string {
  const crypto = globalThis.crypto
  if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
