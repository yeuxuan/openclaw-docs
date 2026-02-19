import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'

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
const docsDir = resolve('docs')
const pubDir = resolve('docs/public')
let fixed = 0

for (const file of walk(tutDir)) {
  let content = readFileSync(file, 'utf-8')
  let changed = false

  content = content.replace(/!\[([^\]]*)\]\(([^)]+\.(png|jpg|jpeg|svg|gif|webp))\)/g, (match, alt, imgPath) => {
    let resolvedPath
    if (imgPath.startsWith('/')) {
      resolvedPath = resolve(pubDir, imgPath.slice(1))
      if (!existsSync(resolvedPath)) {
        resolvedPath = resolve(docsDir, imgPath.slice(1))
      }
    } else {
      resolvedPath = resolve(dirname(file), imgPath)
    }

    if (!existsSync(resolvedPath)) {
      changed = true
      fixed++
      return '<!-- ' + match + ' -->'
    }
    return match
  })

  if (changed) {
    writeFileSync(file, content, 'utf-8')
    console.log('Fixed:', file.replace(tutDir, ''))
  }
}
console.log('Total image refs commented out:', fixed)
