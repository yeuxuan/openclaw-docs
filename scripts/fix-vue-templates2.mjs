/**
 * More aggressive fix: escape ALL {{ }} in markdown files outside fenced code blocks,
 * including those inside backtick code spans (which VitePress still parses in some contexts).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

function walk(dir) {
  let results = []
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) results = results.concat(walk(p))
    else if (f.name.endsWith('.md')) results.push(p)
  }
  return results
}

const tutDir = resolve('docs/tutorials')
let totalFixed = 0

for (const file of walk(tutDir)) {
  let content = readFileSync(file, 'utf-8')
  const lines = content.split('\n')
  let inCodeBlock = false
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) continue

    // Replace ALL {{ }} outside code blocks - even inside backtick spans
    if (/\{\{/.test(line)) {
      const newLine = line.replace(/\{\{([^}]*)\}\}/g, (match, inner) => {
        return '\\{\\{' + inner + '\\}\\}'
      })
      if (newLine !== line) {
        lines[i] = newLine
        changed = true
        totalFixed++
      }
    }
  }

  if (changed) {
    writeFileSync(file, lines.join('\n'), 'utf-8')
    console.log('Fixed:', file.replace(tutDir, ''))
  }
}

console.log('Total lines fixed:', totalFixed)
