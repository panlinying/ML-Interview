import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const preferredRoot = path.resolve(process.cwd(), '..', 'content')
const fallbackRoot = path.resolve(process.cwd(), 'content')
const contentRoot = fs.existsSync(preferredRoot) ? preferredRoot : fallbackRoot
const contentDirs = ['00-Reference', '10-Weeks', '20-Daily', '30-ML-Fundamentals', '40-ML-System-Design']

export interface MarkdownFile {
  slug: string
  title: string
  content: string
  category: string
  path: string
}

export interface NavItem {
  title: string
  slug: string
  category: string
  children?: NavItem[]
}

function getFilesRecursively(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) return files

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath))
    } else if (item.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

export function getAllMarkdownFiles(): MarkdownFile[] {
  const files: MarkdownFile[] = []
  for (const contentDir of contentDirs) {
    const dirPath = path.join(contentRoot, contentDir)
    const mdFiles = getFilesRecursively(dirPath)

    for (const filePath of mdFiles) {
      const relativePath = path.relative(contentRoot, filePath)
      const slug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/')
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(fileContent)

      // Extract title from frontmatter or first heading
      let title = data.title
      if (!title) {
        const match = content.match(/^#\s+(.+)$/m)
        title = match ? match[1] : path.basename(filePath, '.md')
      }

      files.push({
        slug,
        title,
        content,
        category: contentDir,
        path: relativePath,
      })
    }
  }

  return files
}

export function getMarkdownBySlug(slug: string): MarkdownFile | null {
  const files = getAllMarkdownFiles()
  return files.find(f => f.slug === slug) || null
}

export function getNavigation(): NavItem[] {
  const files = getAllMarkdownFiles()
  const nav: NavItem[] = []

  const categories: Record<string, NavItem[]> = {}

  for (const file of files) {
    if (!categories[file.category]) {
      categories[file.category] = []
    }
    categories[file.category].push({
      title: file.title,
      slug: file.slug,
      category: file.category,
    })
  }

  // Sort and structure navigation
  const categoryOrder = ['00-Reference', '10-Weeks', '20-Daily', '30-ML-Fundamentals', '40-ML-System-Design']
  const categoryNames: Record<string, string> = {
    '00-Reference': 'Reference',
    '10-Weeks': 'Weekly Plans',
    '20-Daily': 'Daily Notes',
    '30-ML-Fundamentals': 'ML Fundamentals',
    '40-ML-System-Design': 'System Design',
  }

  for (const cat of categoryOrder) {
    if (categories[cat]) {
      nav.push({
        title: categoryNames[cat] || cat,
        slug: cat,
        category: cat,
        children: categories[cat].sort((a, b) => a.title.localeCompare(b.title)),
      })
    }
  }

  return nav
}

export function getAllSlugs(): string[] {
  return getAllMarkdownFiles().map(f => f.slug)
}

// Resolve a wiki link (file name, path, or title) to its full slug
export function resolveWikiLink(linkText: string): string | null {
  const files = getAllMarkdownFiles()

  // Try to find by exact slug match (full path like "20-Daily/2026-01-12")
  const bySlug = files.find(f => f.slug === linkText)
  if (bySlug) return bySlug.slug

  // Try to find by exact filename match (without extension)
  const byFileName = files.find(f => {
    const fileName = f.slug.split('/').pop()
    return fileName === linkText
  })
  if (byFileName) return byFileName.slug

  // Try to find by title match
  const byTitle = files.find(f => f.title === linkText)
  if (byTitle) return byTitle.slug

  // Return null if not found
  return null
}
