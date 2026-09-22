import test from 'node:test'
import assert from 'node:assert/strict'
import { connectEditor, normalizeCatalog, saveCatalog } from '../src/githubCatalog.js'

const product = { id: 'chocotorta', name: 'Chocotorta', category: 'Clásicos', description: 'Rica', price: 7500, status: 'available', image: '', color: '#644137', cream: '#f7eadb', accent: '#b17d64', background: '#e9d5c9' }
const draft = { brand: { whatsapp: '5493511234567' }, products: [product] }
const ok = data => ({ ok: true, json: async () => data })

test('normaliza precios y evita valores inválidos', () => {
  assert.equal(normalizeCatalog({ products: [{ ...product, price: '' }] }).products[0].price, null)
  assert.throws(() => normalizeCatalog({ products: [{ ...product, price: -1 }] }), /precios/)
  assert.throws(() => normalizeCatalog({ products: [{ ...product, name: '' }] }), /nombres/)
  assert.throws(() => normalizeCatalog({ products: [product, product] }), /repetidos/)
})

test('solo permite entrar con permiso de escritura', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ok({ permissions: { push: false } })
  try { await assert.rejects(connectEditor('example-token'), /permiso de edición/) }
  finally { globalThis.fetch = original }
})

test('evita sobrescribir cambios de otra persona', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ok({ sha: 'remote-newer' })
  try {
    await assert.rejects(saveCatalog('example-token', { ...draft, baseBlobSha: 'local-older' }), /Otra persona actualizó/)
  } finally { globalThis.fetch = original }
})

test('guarda catálogo y fotos en public y docs en un solo commit', async () => {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null
    calls.push({ url, method: options.method, body, auth: options.headers.Authorization })
    if (url.endsWith('/git/ref/heads/main')) return ok({ object: { sha: 'parent' } })
    if (url.endsWith('/git/commits/parent')) return ok({ tree: { sha: 'base-tree' } })
    if (url.endsWith('/git/blobs')) return ok({ sha: body.encoding === 'base64' ? 'photo-blob' : 'catalog-blob' })
    if (url.endsWith('/git/trees')) return ok({ sha: 'next-tree' })
    if (url.endsWith('/git/commits')) return ok({ sha: 'next-commit' })
    if (url.endsWith('/git/refs/heads/main')) return ok({})
    throw new Error(`Unexpected API call: ${url}`)
  }
  try {
    const result = await saveCatalog('example-token', { ...draft, products: [{ ...product, pendingImage: 'data:image/webp;base64,YWJj' }] })
    assert.equal(result.sha, 'next-commit')
    const tree = calls.find(call => call.url.endsWith('/git/trees')).body
    assert.equal(tree.base_tree, 'base-tree')
    assert.deepEqual(tree.tree.map(item => item.path).sort(), [
      'docs/catalog.json', 'public/catalog.json',
      `docs/${result.catalog.products[0].image}`, `public/${result.catalog.products[0].image}`,
    ].sort())
    const data = calls.find(call => call.url.endsWith('/git/blobs') && call.body.encoding === 'utf-8').body.content
    assert.equal(JSON.parse(data).products[0].price, 7500)
    assert.equal(data.includes('example-token'), false)
    assert.equal(calls.at(-1).body.force, false)
    assert.ok(calls.every(call => call.auth === 'Bearer example-token'))
  } finally { globalThis.fetch = original }
})
