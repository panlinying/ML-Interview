const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface ApiRequestOptions {
  method?: string
  body?: unknown
  token?: string | null
  headers?: HeadersInit
  signal?: AbortSignal
}

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

export function encodeSlugPath(slug: string): string {
  return slug
    .split('/')
    .map(part => encodeURIComponent(part))
    .join('/')
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, body, headers, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const hasBody = body !== undefined
  if (hasBody && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json()
      if (data?.detail) {
        message = data.detail
      }
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}
