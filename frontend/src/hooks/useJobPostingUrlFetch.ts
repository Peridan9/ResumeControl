import { useState, useCallback } from 'react'
import { getTextSnippet } from '../utils/htmlSnippet'

const FETCH_TIMEOUT_MS = 10000
const CORS_HINT =
  'For protected pages (e.g. LinkedIn), use the browser extension when available, or paste the job description manually below.'

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface FetchedMeta {
  byteCount: number
  textSnippet: string
}

export interface UseJobPostingUrlFetchReturn {
  url: string
  setUrl: (value: string) => void
  fetchHtml: () => Promise<void>
  fetchStatus: FetchStatus
  fetchedMeta: FetchedMeta | null
  fetchError: string | null
  reset: () => void
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function useJobPostingUrlFetch(): UseJobPostingUrlFetchReturn {
  const [url, setUrl] = useState('')
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle')
  const [fetchedMeta, setFetchedMeta] = useState<FetchedMeta | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setFetchStatus('idle')
    setFetchedMeta(null)
    setFetchError(null)
  }, [])

  const fetchHtml = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setFetchError('Please enter a URL.')
      setFetchStatus('error')
      return
    }
    if (!isValidUrl(trimmed)) {
      setFetchError('Please enter a valid URL.')
      setFetchStatus('error')
      return
    }

    setFetchStatus('loading')
    setFetchError(null)
    setFetchedMeta(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const response = await fetch(trimmed, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        setFetchError(`Page returned error: ${response.status} ${response.statusText || ''}`.trim())
        setFetchStatus('error')
        return
      }

      const html = await response.text()
      const byteCount = new TextEncoder().encode(html).length
      const textSnippet = getTextSnippet(html, 200)
      setFetchedMeta({ byteCount, textSnippet })
      setFetchStatus('success')
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setFetchError('Request timed out.')
          setFetchStatus('error')
          return
        }
        // CORS / network / failed to fetch
        const msg = err.message || 'Could not load page.'
        if (
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('Load failed') ||
          msg.includes('CORS')
        ) {
          setFetchError(`${msg} ${CORS_HINT}`)
        } else {
          setFetchError(`Could not load page: ${msg}`)
        }
      } else {
        setFetchError('Could not load page. ' + CORS_HINT)
      }
      setFetchStatus('error')
    }
  }, [url])

  return {
    url,
    setUrl,
    fetchHtml,
    fetchStatus,
    fetchedMeta,
    fetchError,
    reset,
  }
}
