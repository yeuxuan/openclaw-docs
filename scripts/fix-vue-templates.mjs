/**
 * Fix {{ }} in markdown files that Vue parses as template expressions.
 * Wraps all {{ }} occurrences outside of fenced code blocks with <span v-pre>.
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

    // Toggle code block state
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }

    // Skip lines inside code blocks
    if (inCodeBlock) continue

    // Check if line has {{ }} outside of backtick code spans
    if (/\{\{/.test(line)) {
      // Replace {{ }} that are NOT inside backtick code spans
      // Strategy: split by backtick code spans, only process non-code parts
      const parts = line.split(/(`[^`]*`)/)
      let lineChanged = false

      for (let j = 0; j < parts.length; j++) {
        // Skip backtick code spans (odd indices after split)
        if (parts[j].startsWith('`') && parts[j].endsWith('`')) continue

        if (/\{\{/.test(parts[j])) {
          // Replace {{ with escaped version
          parts[j] = parts[j].replace(/\{\{([^}]*)\}\}/g, '<span v-pre>{{$1}}</span>')
          lineChanged = true
        }
      }

      if (lineChanged) {
        lines[i] = parts.join('')
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
