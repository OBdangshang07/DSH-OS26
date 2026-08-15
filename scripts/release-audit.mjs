import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const client = await readFile(new URL('../lib/client.js', import.meta.url))
const clientText = client.toString('utf8')

function assert(value, message) {
  if (!value) throw new Error(message)
}

const packOutput = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
const packJson = packOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/)?.[0]
if (!packJson) throw new Error('npm pack did not emit its JSON report')
const pack = JSON.parse(packJson)[0]
const files = pack.files.map(file => file.path).sort()
const allowedRoots = ['CHANGELOG.md', 'LICENSE', 'README.md', 'cordis.patch.yml', 'docs/', 'lib/client.js', 'package.json', 'src/index.js']
const unexpected = files.filter(file => !allowedRoots.some(root => root.endsWith('/') ? file.startsWith(root) : file === root))

assert(manifest.version === '0.1.0-beta.1', 'manifest version drifted from the release candidate')
assert(Object.keys(manifest.dependencies ?? {}).length === 0, 'runtime dependencies must stay empty')
assert(manifest.peerDependenciesMeta?.react?.optional === true, 'React must be an optional DSH-provided peer')
assert(unexpected.length === 0, `unexpected packed files: ${unexpected.join(', ')}`)
assert(clientText.includes("id: 'dsh-os26'"), 'module-loader id missing')
assert(!clientText.includes('querySelector('), 'runtime bundle uses a private DOM selector')

const forbidden = [
  ['fetch(', 'network fetch'],
  ['XMLHttpRequest', 'XHR'],
  ['navigator.sendBeacon', 'telemetry beacon'],
  ['process.env', 'environment access'],
  ['child_process', 'shell execution'],
  ['WebSocket(', 'direct socket'],
  ['eval(', 'dynamic evaluation'],
  ['new Function(', 'dynamic function'],
]
const violations = forbidden.filter(([needle]) => clientText.includes(needle)).map(([, label]) => label)
assert(violations.length === 0, `forbidden runtime capabilities: ${violations.join(', ')}`)

const report = {
  package: `${manifest.name}@${manifest.version}`,
  packedFiles: files.length,
  packedBytes: pack.size,
  unpackedBytes: pack.unpackedSize,
  clientBytes: client.length,
  clientGzipBytes: gzipSync(client, { level: 9 }).length,
  clientSha256: createHash('sha256').update(client).digest('hex'),
  runtimeDependencies: Object.keys(manifest.dependencies ?? {}),
  forbiddenCapabilityViolations: violations,
  unexpectedPackedFiles: unexpected,
}
assert(report.clientGzipBytes < 150 * 1024, 'client gzip budget exceeded 150 kB')
console.log(JSON.stringify(report, null, 2))
