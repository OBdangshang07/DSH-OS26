import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return markdownFiles(path)
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
  }))
  return nested.flat()
}

test('project Markdown has no broken local links', async () => {
  const files = [resolve(root, 'README.md'), ...await markdownFiles(resolve(root, 'docs'))]
  const missing = []

  for (const file of files) {
    const markdown = await readFile(file, 'utf8')
    const links = markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)
    for (const match of links) {
      const target = match[1]
      if (/^(?:https?:\/\/|mailto:|#)/.test(target)) continue
      const path = resolve(dirname(file), target.split('#')[0])
      try {
        await assert.doesNotReject(readFile(path))
      } catch {
        missing.push(`${file}: ${target}`)
      }
    }
  }

  assert.deepEqual(missing, [])
})
