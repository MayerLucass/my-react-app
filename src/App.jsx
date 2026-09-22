import { useEffect, useMemo, useState } from 'react'
import { brand as defaultBrand, products as sampleProducts } from './catalog'
import { normalizeCatalog } from './githubCatalog'
import AdminPanel from './AdminPanel'
import './App.css'

const money = amount => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
const CART_KEY = 'latita-cart-v1'

function Icon({ name, size = 22 }) {
  const paths = {
    bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    arrow: <path d="M4 12h16m-7-7 7 7-7 7"/>, close: <path d="m5 5 14 14M19 5 5 19"/>,
    minus: <path d="M5 12h14"/>, plus: <path d="M5 12h14M12 5v14"/>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function DessertArt({ product, hero = false }) {
  return <div className={`dessert-art ${hero ? 'dessert-art--hero' : ''}`} style={{ '--flavor': product.color, '--cream': product.cream, '--accent': product.accent }} aria-hidden="true">
    <span className="art-orbit"/><span className="art-orbit second"/>
    <div className="dessert-can"><div className="can-lid"><div className="can-pull"/></div><div className="can-body"><div className="can-cream"><i/><i/><i/><i/><i/></div><div className="can-top"/><div className="can-layer one"/><div className="can-layer two"/><div className="can-layer three"/><div className="can-label"><span>LATITA</span><small>un antojo en lata ♡</small></div><div className="can-bottom"/></div></div>
    <span className="art-star first">✳</span><span className="art-star last">✦</span>
  </div>
}

function ProductArtwork({ product }) {
  const [failed, setFailed] = useState(false)
  const src = product.image?.startsWith('products/') ? `${import.meta.env.BASE_URL}${product.image}` : product.image
  if (!src || failed) return <DessertArt product={product}/>
  return <img className="product-photo" src={src} alt={`Foto de ${product.name}`} loading="lazy" onError={() => setFailed(true)}/>
}

function ProductCard({ product, add, index }) {
  return <article className="product-card reveal" style={{ '--delay': `${(index % 3) * 90}ms` }}><div className="product-visual" style={{ background: product.background }}><span className="product-tag">{product.status === 'soldout' ? 'SIN STOCK' : product.tag}</span><ProductArtwork product={product}/></div><div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><span className="product-price">{product.price === null ? 'Consultar precio' : money(product.price)}</span><button className="add-button" type="button" disabled={product.status === 'soldout'} onClick={() => add(product)} aria-label={product.status === 'soldout' ? `${product.name} sin stock` : `Agregar ${product.name} al pedido`}><Icon name="plus" size={20}/></button></div></div></article>
}

function CatalogApp() {
  const [liveCatalog, setLiveCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState(false)
  const products = liveCatalog?.products || sampleProducts
  const brand = { ...defaultBrand, ...liveCatalog?.brand }
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}catalog.json?v=${Date.now()}`, { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Catálogo no disponible'); return response.json() })
      .then(data => setLiveCatalog(normalizeCatalog(data)))
      .catch(error => { if (error.name !== 'AbortError') setCatalogError(true) })
    return () => controller.abort()
  }, [])
  const [cart, setCart] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {} } catch { return {} } })
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const categories = ['Todos', ...new Set(products.filter(p => p.status !== 'hidden').map(p => p.category))]
  const visible = useMemo(() => products.filter(p => p.status !== 'hidden' && (filter === 'Todos' || p.category === filter) && `${p.name} ${p.description}`.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))), [filter, query, products])
  const items = products.filter(p => p.status === 'available' && Number(cart[p.id]) > 0).map(p => ({ ...p, quantity: cart[p.id] }))
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasTotal = items.length > 0 && items.every(item => Number.isFinite(item.price))
  const total = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { document.body.classList.toggle('drawer-open', open); return () => document.body.classList.remove('drawer-open') }, [open])
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) } }), { threshold: 0.08 })
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [visible])
  useEffect(() => { const escape = e => { if (e.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape) }, [])

  function change(id, delta) { setCart(old => { const next = { ...old }; const quantity = Math.min(99, Math.max(0, (Number(next[id]) || 0) + delta)); if (!quantity) delete next[id]; else next[id] = quantity; return next }) }
  function add(product) { change(product.id, 1); setToast(`${product.name} agregado a tu pedido`) }
  function sendOrder() {
    if (!items.length) return
    const message = [`¡Hola! Quiero hacer un pedido en ${brand.name}:`, '', ...items.map(item => `• ${item.quantity} × ${item.name}${item.price === null ? '' : ` — ${money(item.price * item.quantity)}`}`), ...(hasTotal ? ['', `Total: ${money(total)}`] : []), ...(name.trim() ? ['', `Nombre: ${name.trim()}`] : []), ...(note.trim() ? [`Aclaraciones: ${note.trim()}`] : []), '', '¿Me confirmás disponibilidad y precio final? Gracias 😊'].join('\n')
    const phone = brand.whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  return <>
    <div className="announcement">✳ &nbsp; POSTRES EN LATA PARA HACER CUALQUIER DÍA MÁS RICO &nbsp; ✳</div>
    <header className="site-header"><div className="header-inner container"><a className="wordmark" href="#inicio" aria-label="Latita, inicio">latita<span>.</span><small>POSTRES EN LATA</small></a><nav className="desktop-nav" aria-label="Navegación principal"><a href="#catalogo">El menú</a><a href="#nosotros">La experiencia</a><a href={brand.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></nav><button className="header-cart" type="button" onClick={() => setOpen(true)} aria-label={`Abrir pedido, ${count} productos`}><Icon name="bag" size={21}/><span className="header-cart-label">Mi pedido</span><span className="cart-count">{count}</span></button></div></header>
    <main id="inicio"><section className="hero container"><div className="hero-copy"><div className="eyebrow"><span/> UNA LATA, MIL GANAS</div><h1>La felicidad<br/>viene en <em>lata.</em></h1><p>Destapá tu antojo. Elegí tus favoritos, armá tu pedido y consultanos por WhatsApp.</p><div className="hero-actions"><a className="primary-button" href="#catalogo">Explorar el menú <Icon name="arrow" size={19}/></a><a className="text-link" href={brand.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" size={19}/> Seguinos en Instagram</a></div><div className="hero-foot"><div>♡ ♡ ♡</div><span>Hechos para disfrutarse<br/>hasta la última cucharada.</span></div></div><div className="hero-scene"><div className="hero-bg-text">ANTOJO</div><div className="hero-stamp">DULCE<br/>MOMENTO <span>✳</span></div><DessertArt product={products.find(p => p.status === 'available') || sampleProducts[0]} hero/><div className="hero-floating-note">abrir · cucharear · repetir ✳</div></div></section>
    <div className="marquee"><span>POSTRES EN LATA <b>✳</b> DESTAPÁ TU ANTOJO</span></div>
    <section className="catalog-section" id="catalogo"><div className="container"><div className="section-heading reveal"><div><span className="section-kicker">01 / LO MÁS RICO</span><h2>Elegí tu <em>antojo.</em></h2><p>Elegí tus favoritos y armá tu pedido. Confirmá disponibilidad y precio final por WhatsApp.</p></div><div className="heading-scribble">hecho con<br/>mucho ♡ <span>↘</span></div></div>{catalogError && <p className="catalog-warning">No pudimos cargar la última actualización. Te mostramos el menú de muestra.</p>}<div className="catalog-toolbar"><div className="category-tabs" role="group" aria-label="Filtrar por categoría">{categories.map(cat => <button key={cat} type="button" className={filter === cat ? 'active' : ''} aria-pressed={filter === cat} onClick={() => setFilter(cat)}>{cat}</button>)}</div><label className="search-box"><Icon name="search" size={18}/><input aria-label="Buscar postres" placeholder="Buscar un antojo..." value={query} onChange={e => setQuery(e.target.value)}/></label></div>{visible.length ? <div className="product-grid">{visible.map((product, i) => <ProductCard key={product.id} product={product} index={i} add={add}/>)}</div> : <div className="empty-search"><span>✳</span><h3>No encontramos ese antojo</h3><p>Probá con otro nombre o categoría.</p><button type="button" onClick={() => { setFilter('Todos'); setQuery('') }}>Ver todos</button></div>}</div></section>
    <section className="experience-section" id="nosotros"><div className="container experience-grid"><div className="experience-deco" aria-hidden="true"><div className="deco-circle"><span>♡</span><span>latita.</span><small>PARA CADA MOMENTO</small></div><span className="deco-star">✳</span></div><div className="experience-copy reveal"><span className="section-kicker">02 / UN MOMENTO PARA VOS</span><h2>Lo bueno viene<br/>en <em>capas.</em></h2><p>Un postre para regalar, compartir o quedarte todo para vos. Armá tu selección y coordiná los detalles directamente por WhatsApp.</p><a href="#catalogo" className="outline-button">Elegir mis favoritos <Icon name="arrow" size={19}/></a></div></div></section>
    <section className="instagram-section container reveal"><div><span className="section-kicker">SEGUIMOS EN CONTACTO</span><h2>Más antojos<br/>por <em>Instagram.</em></h2></div><a className="instagram-pill" href={brand.instagram} target="_blank" rel="noreferrer"><Icon name="instagram" size={22}/> @{brand.handle} <Icon name="arrow" size={19}/></a></section></main>
    <footer className="footer"><div className="container footer-inner"><a className="wordmark wordmark--footer" href="#inicio">latita<span>.</span><small>POSTRES EN LATA</small></a><div className="footer-links"><a href={brand.instagram} target="_blank" rel="noreferrer">Instagram ↗</a><a href="?admin=1">Acceso dueños</a></div><a className="creator-credit" href="https://wa.me/5493562410512?text=Hola%20Lucas%2C%20vi%20el%20cat%C3%A1logo%20de%20Latita%20y%20quiero%20consultarte%20por%20un%20trabajo." target="_blank" rel="noopener noreferrer" aria-label="Contactar a Lucas Mayer por WhatsApp para un trabajo"><span>Creado por <strong>Lucas Mayer</strong><small>¿Querés algo similar? Escribime ↗</small></span><img src={`${import.meta.env.BASE_URL}lucas-mayer-logo.png`} alt="Logo de Lucas Mayer" loading="lazy"/></a></div></footer>
    {count > 0 && !open && <button className="mobile-cart" type="button" onClick={() => setOpen(true)}><Icon name="bag" size={19}/> Ver mi pedido <span>{count}</span></button>}{toast && <div className="toast" role="status">✳ {toast}</div>}
    {open && <div className="cart-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}><aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Tu pedido"><div className="drawer-top"><div><span className="section-kicker">TU SELECCIÓN</span><h2>Mi pedido <span>({count})</span></h2></div><button className="close-button" type="button" aria-label="Cerrar pedido" onClick={() => setOpen(false)}><Icon name="close"/></button></div><div className="drawer-content">{items.length ? <><div className="cart-items">{items.map(item => <div className="cart-item" key={item.id}><div className="cart-thumb" style={{ background: item.background }}><ProductArtwork product={item}/></div><div className="cart-item-info"><h3>{item.name}</h3><span>{item.price === null ? 'Precio a consultar' : money(item.price)}</span><div className="quantity"><button type="button" aria-label={`Quitar uno de ${item.name}`} onClick={() => change(item.id, -1)}><Icon name="minus" size={15}/></button><span>{item.quantity}</span><button type="button" aria-label={`Agregar uno de ${item.name}`} onClick={() => change(item.id, 1)}><Icon name="plus" size={15}/></button></div></div></div>)}</div><div className="order-fields"><label>Tu nombre <span>(opcional)</span><input value={name} onChange={e => setName(e.target.value)} placeholder="¿Cómo te llamás?" maxLength={80}/></label><label>¿Alguna aclaración? <span>(opcional)</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Por ejemplo, para cuándo lo necesitás" maxLength={500} rows={2}/></label></div></> : <div className="empty-cart"><span>♡</span><h3>Todavía no hay postres acá</h3><p>Elegí algo rico del menú y empezá tu pedido.</p><button className="outline-button" type="button" onClick={() => { setOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }) }}>Ver el menú <Icon name="arrow" size={18}/></button></div>}</div>{items.length > 0 && <div className="drawer-bottom">{hasTotal && <div className="total-line"><span>Total estimado</span><strong>{money(total)}</strong></div>}<button className="checkout-button" type="button" onClick={sendOrder}>Enviar pedido por WhatsApp <Icon name="arrow" size={20}/></button><p>{brand.whatsapp ? 'Se abrirá WhatsApp con tu pedido listo para enviar. La compra se confirma con el negocio.' : 'Se abrirá WhatsApp con tu pedido listo para compartir. Falta configurar el número del negocio para enviarlo directamente.'}</p></div>}</aside></div>}
  </>
}
export default function App() {
  return new URLSearchParams(window.location.search).has('admin') ? <AdminPanel/> : <CatalogApp/>
}
