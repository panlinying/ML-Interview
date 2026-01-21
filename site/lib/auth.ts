const TOKEN_KEY = 'ml-interview-token'
export const AUTH_TOKEN_EVENT = 'ml-auth-token-changed'

function notifyTokenChange(token: string | null) {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKEN_EVENT, { detail: { token } })
  )
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(TOKEN_KEY, token)
  notifyTokenChange(token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(TOKEN_KEY)
  notifyTokenChange(null)
}
