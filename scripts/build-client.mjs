import { build } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(root, 'lib/client.js')
const checkOnly = process.argv.includes('--check')

function moduleLoaderWrapper() {
  return {
    name: 'dsh-os26-module-loader-wrapper',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') continue

        const code = file.code.replace(/^\s*['"]use strict['"];?\s*/, '')
        file.code = [
          'window.__ModuleLoader__.load({',
          "  id: 'dsh-os26',",
          '  factory: function (require) {',
          "    'use strict';",
          '    var module = { exports: {} };',
          '    var exports = module.exports;',
          code,
          '    return module.exports;',
          '  }',
          '});',
          '',
        ].join('\n')
      }
    },
  }
}

const result = await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [moduleLoaderWrapper()],
  publicDir: false,
  build: {
    write: false,
    minify: false,
    lib: {
      entry: resolve(root, 'src/client/index.js'),
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    rollupOptions: {
      external: ['react'],
      output: { exports: 'named' },
    },
  },
})

const outputs = Array.isArray(result) ? result.flatMap((item) => item.output) : result.output
const chunk = outputs.find((item) => item.type === 'chunk')
if (!chunk) throw new Error('Vite did not emit a client chunk.')

if (checkOnly) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')
  if (current !== chunk.code) {
    throw new Error('lib/client.js is missing or stale. Run npm run build.')
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, chunk.code, 'utf8')
  console.log(`Built ${outputPath}`)
}
