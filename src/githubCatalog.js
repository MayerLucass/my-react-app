const REPO = 'MayerLucass/my-react-app'
const API = `https://api.github.com/repos/${REPO}`

const cleanText = (value, limit = 250) => String(value ?? '').trim().slice(0, limit)
const safeColor = (value, fallback) => /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback
const safeImage = value => {
  const image = cleanText(value, 600)
  return /^products\/[a-zA-Z0-9._-]+\.(webp|jpe?g|png)$/.test(image) || /^https:\/\//.test(image) ? image : ''
}

export function normalizeCatalog(value) {
  if (!value || !Array.isArray(value.products)) throw new Error('El archivo de productos no tiene un formato válido.')
  const products = value.products.map((item, index) => ({
    id: /^[a-zA-Z0-9-]+$/.test(item.id || '') ? item.id : `producto-${index + 1}`,
    name: cleanText(item.name, 90),
    category: cleanText(item.category, 60) || 'Otros',
    description: cleanText(item.description, 400),
    tag: cleanText(item.tag, 40),
    price: item.price === null || item.price === '' || item.price === undefined ? null : Number(item.price),
    status: ['available', 'soldout', 'hidden'].includes(item.status) ? item.status : 'available',
    image: safeImage(item.image),
    color: safeColor(item.color, '#9e4253'),
    cream: safeColor(item.cream, '#fff0e7'),
    accent: safeColor(item.accent, '#c87984'),
    background: safeColor(item.background, '#f2d7de'),
  }))
  if (products.length > 150) throw new Error('El catálogo permite hasta 150 productos.')
  if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Hay productos con identificadores repetidos.')
  if (products.some(p => !p.name || !Number.isFinite(p.price ?? 0) || (p.price !== null && (p.price < 0 || p.price > 100000000)))) throw new Error('Revisá los nombres y precios de los productos.')
  const phone = cleanText(value.brand?.whatsapp, 25).replace(/\D/g, '')
  if (phone && !/^\d{10,15}$/.test(phone)) throw new Error('El WhatsApp debe tener entre 10 y 15 dígitos, con código de país.')
  return { version: 1, brand: { whatsapp: phone }, products }
}

async function github(path, token, method = 'GET', body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const reason = response.status === 401 ? 'La credencial no es válida.'
      : response.status === 403 ? 'Esta cuenta no tiene permiso para editar el repositorio o llegó al límite de GitHub.'
      : response.status === 409 || response.status === 422 ? 'Hubo cambios recientes en GitHub. Recargá el panel antes de volver a guardar.'
      : data.message || 'GitHub no pudo completar la operación.'
    throw new Error(reason)
  }
  return data
}

export async function connectEditor(token) {
  const repo = await github('', token)
  if (!repo.permissions?.push) throw new Error('Tu cuenta de GitHub no tiene permiso de edición en este catálogo.')
  const response = await github('/contents/public/catalog.json?ref=main', token)
  const bytes = Uint8Array.from(atob(response.content.replace(/\s/g, '')), char => char.charCodeAt(0))
  return { ...normalizeCatalog(JSON.parse(new TextDecoder().decode(bytes))), baseBlobSha: response.sha }
}

export async function saveCatalog(token, draft) {
  const catalog = normalizeCatalog(draft)
  const pending = draft.products.filter(item => item.pendingImage)
  if (draft.baseBlobSha) {
    const current = await github('/contents/public/catalog.json?ref=main', token)
    if (current.sha !== draft.baseBlobSha) throw new Error('Otra persona actualizó el catálogo. Recargá el panel para ver los cambios antes de guardar.')
  }
  const ref = await github('/git/ref/heads/main', token)
  const parent = ref.object.sha
  const commit = await github(`/git/commits/${parent}`, token)
  const entries = []
  for (const item of pending) {
    const match = /^data:image\/(webp|jpeg);base64,(.+)$/.exec(item.pendingImage)
    if (!match) throw new Error(`La imagen de ${item.name} no se pudo preparar. Volvé a seleccionarla.`)
    const blob = await github('/git/blobs', token, 'POST', { content: match[2], encoding: 'base64' })
    const extension = match[1] === 'webp' ? 'webp' : 'jpg'
    const path = `products/${item.id}-${Date.now().toString(36)}.${extension}`
    catalog.products.find(p => p.id === item.id).image = path
    for (const prefix of ['public', 'docs']) entries.push({ path: `${prefix}/${path}`, mode: '100644', type: 'blob', sha: blob.sha })
  }
  const catalogBlob = await github('/git/blobs', token, 'POST', {
    content: `${JSON.stringify({ ...catalog, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    encoding: 'utf-8',
  })
  for (const prefix of ['public', 'docs']) entries.push({ path: `${prefix}/catalog.json`, mode: '100644', type: 'blob', sha: catalogBlob.sha })
  const tree = await github('/git/trees', token, 'POST', { base_tree: commit.tree.sha, tree: entries })
  const saved = await github('/git/commits', token, 'POST', {
    message: 'Update Latita catalog from owner panel',
    tree: tree.sha,
    parents: [parent],
  })
  await github('/git/refs/heads/main', token, 'PATCH', { sha: saved.sha, force: false })
  return { catalog: { ...catalog, baseBlobSha: catalogBlob.sha }, sha: saved.sha }
}
