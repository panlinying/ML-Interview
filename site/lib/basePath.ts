export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const homeHref = basePath || '/'

export function docHref(slug: string): string {
  // Encode each path segment separately, preserving slashes
  const encoded = slug
    .split('/')
    .map(part => encodeURIComponent(part))
    .join('/')
  return `${basePath}/docs/${encoded}`
}
