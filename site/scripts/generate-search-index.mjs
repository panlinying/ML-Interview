import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const contentRoot = path.resolve(process.cwd(), '..', 'content')
const outDir = path.resolve(process.cwd(), 'public')
const outFile = path.join(outDir, 'search-index.json')

const contentDirs = ['00-Reference', '10-Weeks', '20-Daily', '30-ML-Fundamentals', '40-ML-System-Design']
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

function getFilesRecursively(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files

  for (const item of fs.readdirSync(dir)) {
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

function stripMarkdown(markdown) {
  let s = markdown
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/`[^`]*`/g, ' ')
  s = s.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  s = s.replace(/#+\s*/g, '')
  s = s.replace(/^\s*[-*+]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')
  s = s.replace(/\|/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function getTocFromMarkdown(markdown) {
  const lines = markdown.split('\n')
  const counts = new Map()
  const toc = []

  for (const line of lines) {
    const match = /^(#{2,4})\s+(.+)$/.exec(line.trim())
    if (!match) continue
    const level = match[1].length
    const text = match[2].replace(/\s+#+\s*$/, '').trim()
    const base = slugifyHeading(text)
    const n = counts.get(base) ?? 0
    const id = n === 0 ? base : `${base}-${n}`
    counts.set(base, n + 1)
    toc.push({ id, text, level })
  }

  return toc
}

function getCategoryTitle(category) {
  const categoryNames = {
    '00-Reference': 'Reference',
    '10-Weeks': 'Weekly Plans',
    '20-Daily': 'Daily Notes',
    '30-ML-Fundamentals': 'ML Fundamentals',
    '40-ML-System-Design': 'System Design',
  }
  return categoryNames[category] || category
}

function main() {
  const items = []

  for (const category of contentDirs) {
    const dirPath = path.join(contentRoot, category)
    const mdFiles = getFilesRecursively(dirPath).sort((a, b) => collator.compare(a, b))

    for (const filePath of mdFiles) {
      const relativePath = path.relative(contentRoot, filePath)
      const slug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/')
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(raw)

      let title = data.title
      if (!title) {
        const match = content.match(/^#\s+(.+)$/m)
        title = match ? match[1] : path.basename(filePath, '.md')
      }

      const toc = getTocFromMarkdown(content)
      const body = stripMarkdown(content).slice(0, 8000)

      items.push({
        kind: 'page',
        title,
        slug,
        category: getCategoryTitle(category),
        body,
      })

      for (const section of toc) {
        items.push({
          kind: 'section',
          title: section.text,
          slug,
          anchor: section.id,
          category: getCategoryTitle(category),
          pageTitle: title,
        })
      }
    }
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items,
  }

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(payload), 'utf-8')
  process.stdout.write(`Wrote ${outFile} (${items.length} items)\n`)
}

main()

