import { useEffect, useState } from 'react'
import { connectEditor, saveCatalog } from './githubCatalog'
import './AdminPanel.css'

const base = import.meta.env.BASE_URL
const blankProduct = () => ({
  id: `postre-${crypto.randomUUID()}`,
  name: '', category: 'Clásicos', description: '', tag: '', price: null,
  status: 'available', image: '', color: '#9e4253', cream: '#fff0e7',
  accent: '#c87984', background: '#f2d7de',
})
const imageSrc = product => product.pendingImage || (product.image?.startsWith('products/') ? `${base}${product.image}` : product.image)

async function preparePhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Seleccioná una imagen.')
  if (file.size > 12 * 1024 * 1024) throw new Error('La foto debe pesar menos de 12 MB.')
  const url = URL.createObjectURL(file)
  const photo = new Image()
  try {
    await new Promise((resolve, reject) => { photo.onload = resolve; photo.onerror = reject; photo.src = url })
    const scale = Math.min(1, 1200 / Math.max(photo.naturalWidth, photo.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale))
    canvas.getContext('2d').drawImage(photo, 0, 0, canvas.width, canvas.height)
    let result = canvas.toDataURL('image/webp', .76)
    if (!result.startsWith('data:image/webp')) result = canvas.toDataURL('image/jpeg', .76)
    if (result.length > 2_700_000) throw new Error('La imagen sigue siendo muy grande. Probá con otra foto.')
    return result
  } finally { URL.revokeObjectURL(url) }
}

function AdminPanel() {
  const [token, setToken] = useState('')
  const [catalog, setCatalog] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const product = catalog?.products.find(item => item.id === selected)

  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function connect(event) {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const loaded = await connectEditor(token.trim())
      setCatalog(loaded); setSelected(loaded.products[0]?.id || null); setDirty(false)
    } catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }
  function updateProduct(patch) {
    setCatalog(current => ({ ...current, products: current.products.map(item => item.id === selected ? { ...item, ...patch } : item) }))
    setDirty(true); setMessage('')
  }
  function add() {
    const next = blankProduct()
    setCatalog(current => ({ ...current, products: [...current.products, next] }))
    setSelected(next.id); setDirty(true); setMessage('')
  }
  function remove() {
    if (!window.confirm(`¿Eliminar «${product.name || 'este producto'}» del catálogo?`)) return
    setCatalog(current => ({ ...current, products: current.products.filter(item => item.id !== selected) }))
    setSelected(catalog.products.find(item => item.id !== selected)?.id || null)
    setDirty(true); setMessage('')
  }
  function move(direction) {
    const index = catalog.products.findIndex(item => item.id === selected)
    const target = index + direction
    if (target < 0 || target >= catalog.products.length) return
    const next = [...catalog.products]
    ;[next[index], next[target]] = [next[target], next[index]]
    setCatalog(current => ({ ...current, products: next })); setDirty(true)
  }
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try { updateProduct({ pendingImage: await preparePhoto(file) }); setError('') }
    catch (reason) { setError(reason.message) }
    event.target.value = ''
  }
  async function save() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await saveCatalog(token.trim(), catalog)
      setCatalog(result.catalog); setDirty(false)
      setMessage('Guardado en GitHub. La publicación puede tardar unos minutos en actualizarse.')
    } catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }
  function disconnect() { setToken(''); setCatalog(null); setSelected(null); setDirty(false); setMessage('') }

  return <div className="admin-page">
    <header className="admin-header"><a href={base} className="admin-brand">latita<span>.</span><small>ADMINISTRACIÓN</small></a><div className="admin-header-actions"><a href={base} className="admin-back">Ver catálogo ↗</a>{catalog && <button type="button" onClick={disconnect}>Salir</button>}</div></header>
    {!catalog ? <main className="admin-login"><span className="admin-eyebrow">PANEL DE DUEÑOS</span><h1>Tu catálogo,<br/><em>a tu manera.</em></h1><p>Agregá postres, cambiá precios, fotos, categorías y disponibilidad. Los cambios se guardan en el repositorio y aparecen para todos los clientes.</p><form onSubmit={connect}><label htmlFor="github-token">Credencial de GitHub con permiso de edición</label><input id="github-token" type="password" value={token} onChange={event => setToken(event.target.value)} autoComplete="off" placeholder="Pegá tu token aquí" required/><button className="admin-primary" disabled={busy} type="submit">{busy ? 'Verificando…' : 'Entrar al panel →'}</button></form><div className="admin-help"><strong>Acceso para los dueños</strong><p>Cada dueño necesita una cuenta de GitHub invitada como colaborador de este repositorio y un token personal classic con permiso <code>public_repo</code>. La credencial se usa solo durante esta sesión y nunca se publica en el catálogo. No se la compartas a nadie.</p><a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">Abrir mis tokens de GitHub ↗</a></div>{error && <p className="admin-alert" role="alert">{error}</p>}</main> : <main className="admin-shell"><div className="admin-title-row"><div><span className="admin-eyebrow">PANEL DE DUEÑOS</span><h1>Administrar productos</h1><p>{catalog.products.length} productos · {catalog.products.filter(p => p.status === 'soldout').length} sin stock · {catalog.products.filter(p => p.status === 'hidden').length} ocultos</p></div><button className="admin-primary" type="button" disabled={busy || !dirty} onClick={save}>{busy ? 'Guardando…' : dirty ? 'Guardar cambios →' : 'Todo guardado ✓'}</button></div>
      {error && <p className="admin-alert" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
      <div className="admin-columns"><aside className="admin-list"><div className="admin-list-head"><h2>Productos</h2><button type="button" onClick={add}>+ Agregar</button></div><div className="admin-list-scroll">{catalog.products.map(item => <button key={item.id} className={`admin-list-item ${selected === item.id ? 'active' : ''}`} type="button" onClick={() => setSelected(item.id)}><span className="admin-mini" style={{ background: item.background }}>{imageSrc(item) ? <img src={imageSrc(item)} alt=""/> : '✳'}</span><span><strong>{item.name || 'Producto nuevo'}</strong><small>{item.category} · {item.status === 'soldout' ? 'Sin stock' : item.status === 'hidden' ? 'Oculto' : item.price === null ? 'Precio a consultar' : `$ ${Number(item.price).toLocaleString('es-AR')}`}</small></span></button>)}{!catalog.products.length && <p className="admin-list-empty">Todavía no hay productos.</p>}</div></aside>
        <section className="admin-editor">{product ? <><div className="admin-editor-head"><div><span className="admin-eyebrow">EDITAR PRODUCTO</span><h2>{product.name || 'Producto nuevo'}</h2></div><div className="admin-order"><button type="button" onClick={() => move(-1)} aria-label="Subir producto">↑</button><button type="button" onClick={() => move(1)} aria-label="Bajar producto">↓</button></div></div><div className="admin-form-grid"><label>Nombre del producto *<input value={product.name} maxLength={90} onChange={e => updateProduct({ name: e.target.value })} placeholder="Ej. Chocotorta"/></label><label>Precio en ARS<input type="number" min="0" step="1" value={product.price ?? ''} onChange={e => updateProduct({ price: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Dejar vacío para consultar"/></label><label>Categoría<input value={product.category} maxLength={60} onChange={e => updateProduct({ category: e.target.value })} placeholder="Ej. Chocolatosos"/></label><label>Disponibilidad<select value={product.status} onChange={e => updateProduct({ status: e.target.value })}><option value="available">Disponible</option><option value="soldout">Sin stock (visible)</option><option value="hidden">Oculto del catálogo</option></select></label><label className="admin-wide">Descripción<textarea rows="3" maxLength={400} value={product.description} onChange={e => updateProduct({ description: e.target.value })} placeholder="Contá qué hace especial a este postre"/></label><label className="admin-wide">Etiqueta corta<input value={product.tag} maxLength={40} onChange={e => updateProduct({ tag: e.target.value })} placeholder="Ej. Más elegido"/></label></div><div className="admin-photo-section"><div className="admin-photo-preview" style={{ background: product.background }}>{imageSrc(product) ? <img src={imageSrc(product)} alt={`Vista previa de ${product.name}`}/> : <span>✳</span>}</div><div><h3>Foto del producto</h3><p>Subí una foto desde el celular o la computadora. Se reduce automáticamente antes de guardarse.</p><label className="admin-upload">Elegir foto<input type="file" accept="image/*" onChange={upload}/></label>{(product.image || product.pendingImage) && <button className="admin-link-button" type="button" onClick={() => updateProduct({ image: '', pendingImage: '' })}>Quitar foto</button>}</div></div><button className="admin-delete" type="button" onClick={remove}>Eliminar este producto</button></> : <div className="admin-no-selection"><span>✳</span><h2>Elegí un producto</h2><p>Podés editar uno existente o agregar uno nuevo.</p><button className="admin-primary" type="button" onClick={add}>+ Agregar producto</button></div>}</section></div>
      <section className="admin-settings"><div><span className="admin-eyebrow">CONFIGURACIÓN</span><h2>Pedidos por WhatsApp</h2><p>Ingresá el número del negocio con código de país, sin + ni espacios. Si queda vacío, el cliente deberá elegir a quién enviar el mensaje.</p></div><label>Número del negocio<input inputMode="numeric" value={catalog.brand.whatsapp} placeholder="Ej. 5493511234567" onChange={e => { setCatalog(current => ({ ...current, brand: { whatsapp: e.target.value } })); setDirty(true) }}/></label></section><p className="admin-footnote">Los productos ocultos no se muestran en la página, pero el repositorio es público: no cargues información privada.</p>
    </main>}
  </div>
}
export default AdminPanel
