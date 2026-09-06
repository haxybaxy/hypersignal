import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
})

/** Human-readable message for an error thrown by the API client. */
export function describeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string' && detail.length > 0) return detail
    if (error.code === 'ECONNABORTED') return 'Request timed out'
    if (!error.response) return 'API is unreachable'
    return `API responded with HTTP ${error.response.status}`
  }
  return error instanceof Error ? error.message : 'Unknown error'
}
