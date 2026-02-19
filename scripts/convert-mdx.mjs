/**
 * MDX → VitePress Markdown 批量转换脚本
 *
 * 用法: node scripts/convert-mdx.mjs <src-dir> <dest-dir>
 * 例: node scripts/convert-mdx.mjs D:/my_code/projects/openclaw/docs/start docs/tutorials/getting-started
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'

const [, , srcDir, destDir] = process.argv
if (!srcDir || !destDir) {
  console.error('Usage: node scripts/convert-mdx.mjs <src-dir> <dest-dir>')
  process.exit(1)
}

const absSrc = resolve(srcDir)
const absDest = resolve(destDir)

if (!existsSync(absDest)) {
  mkdirSync(absDest, { recursive: true })
}

const files = readdirSync(absSrc).filter(f => f.endsWith('.md') && !f.startsWith('.'))

let converted = 0
let skipped = 0

for (const file of files) {
  const srcPath = join(absSrc, file)
  let content = readFileSync(srcPath, 'utf-8')

  // Skip pure redirect pages
  if (content.includes('has moved to') && content.length < 500) {
    console.log(`  SKIP (redirect): ${file}`)
    skipped++
    continue
  }

  content = convertMdx(content)

  const destPath = join(absDest, file)
  writeFileSync(destPath, content, 'utf-8')
  console.log(`  OK: ${file}`)
  converted++
}

console.log(`\nDone: ${converted} converted, ${skipped} skipped`)

function convertMdx(text) {
  // 1. Clean frontmatter: remove read_when, summary fields but keep title
  text = text.replace(/^---\n([\s\S]*?)\n---/, (match, fm) => {
    const lines = fm.split('\n')
    const kept = []
    let skipBlock = false
    for (const line of lines) {
      if (/^(read_when|summary):/.test(line)) {
        skipBlock = /:\s*$/.test(line) || /:\s*\[/.test(line) // multi-line
        if (!/:\s*"/.test(line) && !/:\s*'/.test(line) && /:\s*$/.test(line)) {
          skipBlock = true
        }
        continue
      }
      if (skipBlock) {
        if (/^\s+-/.test(line) || /^\s+/.test(line) && !/:/.test(line)) {
          continue // continuation of skipped block
        }
        skipBlock = false
      }
      kept.push(line)
    }
    const result = kept.filter(l => l.trim()).join('\n')
    return result ? `---\n${result}\n---` : ''
  })

  // 2. Steps / Step
  text = text.replace(/<Steps>/g, '')
  text = text.replace(/<\/Steps>/g, '')
  let stepCounter = 0
  text = text.replace(/<Step\s+title="([^"]*)">/g, (_, title) => {
    stepCounter++
    return `### 步骤 ${stepCounter}：${title}\n`
  })
  text = text.replace(/<\/Step>/g, '')

  // 3. Tabs / Tab → code-group or bold labels
  text = text.replace(/<Tabs>/g, '')
  text = text.replace(/<\/Tabs>/g, '')
  text = text.replace(/<Tab\s+title="([^"]*)">/g, (_, title) => `**${title}：**\n`)
  text = text.replace(/<\/Tab>/g, '')

  // 4. Note / Tip / Info / Warning / Check → VitePress containers
  text = text.replace(/<Note>([\s\S]*?)<\/Note>/g, (_, inner) => `::: info 说明\n${inner.trim()}\n:::\n`)
  text = text.replace(/<Tip>([\s\S]*?)<\/Tip>/g, (_, inner) => `::: tip 提示\n${inner.trim()}\n:::\n`)
  text = text.replace(/<Info>([\s\S]*?)<\/Info>/g, (_, inner) => `::: info\n${inner.trim()}\n:::\n`)
  text = text.replace(/<Warning>([\s\S]*?)<\/Warning>/g, (_, inner) => `::: warning 注意\n${inner.trim()}\n:::\n`)
  text = text.replace(/<Check>([\s\S]*?)<\/Check>/g, (_, inner) => `::: tip 验证\n${inner.trim()}\n:::\n`)
  text = text.replace(/<Danger>([\s\S]*?)<\/Danger>/g, (_, inner) => `::: danger 危险\n${inner.trim()}\n:::\n`)

  // 5. Accordion / AccordionGroup → <details>
  text = text.replace(/<AccordionGroup>/g, '')
  text = text.replace(/<\/AccordionGroup>/g, '')
  text = text.replace(/<Accordion\s+title="([^"]*)"[^>]*>/g, (_, title) => `<details>\n<summary>${title}</summary>\n`)
  text = text.replace(/<\/Accordion>/g, '</details>\n')

  // 6. Card / CardGroup → link list
  text = text.replace(/<CardGroup[^>]*>/g, '')
  text = text.replace(/<\/CardGroup>/g, '')
  text = text.replace(/<Card\s+title="([^"]*)"[^>]*href="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/Card>/g,
    (_, title, href, desc) => `- [${title}](${href}) — ${desc.trim()}\n`)
  // Self-closing cards
  text = text.replace(/<Card\s+title="([^"]*)"[^>]*href="([^"]*)"[^>]*\/>/g,
    (_, title, href) => `- [${title}](${href})\n`)

  // 7. Columns → just content
  text = text.replace(/<Columns>/g, '')
  text = text.replace(/<\/Columns>/g, '')

  // 8. Tooltip → plain text
  text = text.replace(/<Tooltip[^>]*>([^<]*)<\/Tooltip>/g, '$1')

  // 9. JSX img → Markdown img
  text = text.replace(/<img\s+src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '![$2]($1)')
  text = text.replace(/<img\s+src="([^"]*)"[^>]*\/?>/g, '![]($1)')

  // 10. Fix internal links: /path → /tutorials/category/path (skip for now, keep relative)

  // 11. Remove className and other JSX attributes from remaining HTML
  text = text.replace(/\s+className="[^"]*"/g, '')

  // 12. Clean up excessive blank lines
  text = text.replace(/\n{4,}/g, '\n\n\n')

  // 13. Remove any remaining self-closing JSX tags that aren't standard HTML
  text = text.replace(/<(Steps|Step|Tabs|Tab|Note|Tip|Info|Warning|Check|Card|CardGroup|Columns|AccordionGroup|Accordion|Tooltip|Danger)\s*\/?>/gi, '')

  return text.trim() + '\n'
}
