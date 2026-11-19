import { createRoot } from "react-dom/client"
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Heart, Menu, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react'
import catalog from './catalog.json'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '@fontsource/bodoni-moda/latin-500.css'
import '@fontsource/bodoni-moda/latin-500-italic.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-700.css'
import Showpiece from './Showpiece'
import './style.css'
import './cinematic.css'

gsap.registerPlugin(ScrollTrigger)

type Product = (typeof catalog)[number]
type BagLine = { id: string; option: number; quantity: number }
const categories = ['Earrings', 'Pendant Necklaces', 'Bracelets', 'Rings', 'Combo Sets', 'Watches', 'Bangles']
const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-')
const photo = (path: string) => import.meta.env.BASE_URL + path
const info = new Map(catalog.map(item => [item.id, item]))
const money = (value: number) => 'PKR ' + new Intl.NumberFormat('en-PK').format(value)
const categoryPath = (category: string) => '#/shop/' + slug(category)
const productPath = (item: Product) => '#/product/' + item.id
const featured = ['amour-heart-studs', 'hollow-heart-pendant-necklace', 'the-amour-heart-bracelet', 'amour-belle-earrings', 'pearl-butterfly-drop-earrings', 'gold-glow-oval-edition'].map(id => info.get(id)!)
const categoryImages = ['amour-belle-earrings', 'hollow-heart-pendant-necklace', 'tulip-bracelets', 'rings-collection', 'the-signature-set', 'gold-glow-oval-edition', 'bloome-bangles']

function readStorage<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function useSaved<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial))
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }, [key, value])
  return [value, setValue] as const
}
function showIntro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || (location.hash && location.hash !== '#/')) return false
  try { return sessionStorage.getItem('amour-intro') !== 'seen' } catch { return true }
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const depth = matchMedia('(max-width: 620px)').matches ? 41 : 74
    const animation = gsap.fromTo(element, {
      y: depth, rotateX: -10, scale: .97, opacity: .14,
    }, {
      y: 0, rotateX: 0, scale: 1, opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: element, start: 'top 99%', end: 'top 73%',
        scrub: .55 + delay / 1250, invalidateOnRefresh: true,
      },
    })
    return () => {
      animation.scrollTrigger?.kill()
      animation.revert()
    }
  }, [])
  return <div ref={ref} className={'reveal ' + className} style={{ transitionDelay: delay + 'ms' }}>{children}</div>
}

function Intro({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3890)
    return () => clearTimeout(timer)
  }, [onClose])
  return <section className="intro" aria-label="Amour opening animation">
    <button className="intro-skip" autoFocus onClick={onClose}>Skip intro <ArrowRight size={16} /></button>
    <div className="intro-stage"><Showpiece /><div className="intro-scene" aria-hidden="true">
      <div className="intro-platform" /><div className="intro-plinth" />
      <div className="intro-box"><div className="intro-photo"><img src={photo(featured[1].photos[0])} alt="" /></div></div>
      <div className="intro-ring ring-one" /><div className="intro-ring ring-two" />
    </div>
    </div><div className="intro-brand"><b aria-hidden="true">✦</b><span>Amour</span><i>JEWELRY</i></div>
  </section>
}

function App() {
  const [path, setPath] = useState(() => location.hash.slice(1) || '/')
  const [intro, setIntro] = useState(showIntro)
  const [menu, setMenu] = useState(false)
  const [bag, setBag] = useSaved<BagLine[]>('amour-bag-v1', [])
  const [wish, setWish] = useSaved<string[]>('amour-wishlist-v1', [])
  const [notice, setNotice] = useState('')
  const [order, setOrder] = useState<{ name: string; total: number }>()
  const finishIntro = useRef(() => {
    setIntro(false)
    try { sessionStorage.setItem('amour-intro', 'seen') } catch {}
  }).current

  useEffect(() => {
    function navigate() {
      setPath(location.hash.slice(1) || '/')
      setMenu(false)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 2300)
    return () => clearTimeout(timer)
  }, [notice])

  const cleanBag = bag.filter(line => info.has(line.id))
  const count = cleanBag.reduce((total, item) => total + item.quantity, 0)
  const total = cleanBag.reduce((sum, line) => sum + info.get(line.id)!.price * line.quantity, 0)
  const [, page, id] = path.split('/')
  const category = categories.find(value => slug(value) === id)
  const product = info.get(id)
  const exists = page === 'shop' ? !id || Boolean(category) : page === 'product' ? Boolean(product) : ['', 'wishlist', 'bag', 'checkout', 'confirmation'].includes(page)
  const pageTitle = product?.name ?? category ?? ({ shop: 'Shop', wishlist: 'Wishlist', bag: 'Bag', checkout: 'Checkout', confirmation: 'Confirmation' }[page] || 'Jewelry')
  useEffect(() => { document.title = pageTitle + ' | Amour' }, [pageTitle])

  function toggle(item: Product) {
    const saved = wish.includes(item.id)
    setWish(previous => saved ? previous.filter(id => id !== item.id) : [...previous, item.id])
    setNotice(saved ? 'Removed from wishlist' : 'Saved to wishlist')
  }

  function add(item: Product, option = 0) {
    setBag(previous => {
      const match = previous.find(line => line.id === item.id && line.option === option)
      return match
        ? previous.map(line => line === match ? { ...line, quantity: line.quantity + 1 } : line)
        : [...previous, { id: item.id, option, quantity: 1 }]
    })
    setNotice(item.name + ' added to bag')
  }

  function changeQuantity(item: BagLine, quantity: number) {
    setBag(previous => previous.flatMap(line => line.id === item.id && line.option === item.option
      ? quantity > 0 ? [{ ...line, quantity }] : []
      : [line]))
  }

  function card(item: Product, index: number) {
    return <Reveal key={item.id} delay={(index % 4) * 55}>
      <article className="card">
        <div className="card-media">
          <a href={productPath(item)} className="card-image" aria-label={item.name}>
            <img loading="lazy" src={photo(item.photos[0])} alt={item.name} />
            {item.photos.length > 1 && <img loading="lazy" className="alternate" src={photo(item.photos[1])} alt="" />}
          </a>
          <button type="button" className="favorite" aria-label={'Save ' + item.name + ' to wishlist'} aria-pressed={wish.includes(item.id)} onClick={() => toggle(item)}><Heart size={17} /></button>
        </div>
        <div className="card-text">
          <a className="card-name" href={productPath(item)}>{item.name}</a>
          <p>{item.description}</p>
          <div className="card-bottom"><span>{money(item.price)}</span>
            {variantOptions(item).length > 1
              ? <a className="quick-add" href={productPath(item)} aria-label={'Choose option for ' + item.name}><Plus size={16} /></a>
              : <button type="button" className="quick-add" aria-label={'Add ' + item.name + ' to bag'} onClick={() => add(item)}><Plus size={16} /></button>}
          </div>
        </div>
      </article>
    </Reveal>
  }

  function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!count) return
    const fields = new FormData(event.currentTarget)
    setOrder({ name: String(fields.get('name')).trim(), total })
    setBag([])
    location.hash = '/confirmation'
  }

  return <>
    {intro && <Intro onClose={finishIntro} />}
    <div inert={intro}>
      <header className={intro ? "header waiting" : "header"}>
        <div className="header-inner">
          <button className="icon mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
          <nav className="desktop-nav" aria-label="Main"><a href="#/" aria-current={!page ? 'page' : undefined}>Home</a><a href="#/shop" aria-current={page === 'shop' ? 'page' : undefined}>Shop</a></nav>
          <a href="#/" className="brand" aria-label="Amour home">Amour<span aria-hidden="true">✦</span></a>
          <nav className="actions" aria-label="Shopping"><a className="icon header-search" href="#/shop" aria-label="Search the shop"><Search size={20} /></a><a className="icon" href="#/wishlist" aria-label={`Wishlist, ${wish.length} products`}><Heart size={20} /></a><a className="icon" href="#/bag" aria-label={`Bag, ${count} items`}><ShoppingBag size={20} />{count > 0 && <b>{count}</b>}</a></nav>
        </div>
        {menu && <nav className="mobile-nav" aria-label="Collections"><a href="#/" onClick={() => setMenu(false)}>Home</a><a href="#/shop" onClick={() => setMenu(false)}>Shop all</a>{categories.map(value => <a key={value} href={categoryPath(value)} onClick={() => setMenu(false)}>{value}</a>)}</nav>}
      </header>
      <main key={path} id="main">
        {!exists && <Empty title="Page not found" message="Explore the collection to find your next piece." />}
        {exists && !page && <Home renderCard={card} />}
        {exists && page === 'shop' && <Shop category={category} renderCard={card} />}
        {exists && page === 'product' && product && <ProductPage item={product} saved={wish.includes(product.id)} onSave={() => toggle(product)} onAdd={option => add(product, option)} />}
        {page === 'wishlist' && <section className="shell listing"><h1>Wishlist</h1>{wish.some(id => info.has(id)) ? <div className="grid">{catalog.filter(item => wish.includes(item.id)).sort(byName).map(card)}</div> : <Empty title="Your wishlist is empty" message="Tap the heart on any piece to save it here." />}</section>}
        {page === 'bag' && <section className="shell listing"><h1>Shopping bag</h1>{count ? <div className="purchase-layout">
          <div>{cleanBag.map(line => {
            const item = info.get(line.id)!
            const optionLabel = variantOptions(item).find(option => option.photo === line.option)?.name
            return <article className="bag-line" key={item.id + ':' + line.option}>
              <a href={productPath(item)}><img src={photo(item.photos[line.option] ?? item.photos[0])} alt={item.name} /></a>
              <div><a className="card-name" href={productPath(item)}>{item.name}</a>{optionLabel && <p>{optionLabel}</p>}
                <div className="quantity"><button aria-label={'Decrease quantity of ' + item.name} disabled={line.quantity === 1} onClick={() => changeQuantity(line, line.quantity - 1)}><Minus size={15} /></button><span>{line.quantity}</span><button aria-label={'Increase quantity of ' + item.name} onClick={() => changeQuantity(line, line.quantity + 1)}><Plus size={15} /></button></div>
                <button className="text-button" onClick={() => changeQuantity(line, 0)}>Remove</button>
              </div><strong>{money(item.price * line.quantity)}</strong>
            </article>
          })}</div>
          <aside className="summary"><h2>Bag summary</h2><Summary total={total} /><a className="button" href="#/checkout">Continue to checkout <ArrowRight size={17} /></a></aside>
        </div> : <Empty title="Your bag is empty" message="Discover jewelry to add to your bag." />}</section>}
        {page === 'checkout' && <section className="shell listing"><h1>Checkout</h1>{count ? <form className="purchase-layout" onSubmit={checkout}>
          <div className="checkout-form"><h2>Delivery details</h2><p>Demo checkout. Use sample delivery details.</p>
            <label>Full name<input name="name" autoComplete="name" required pattern=".*\S.*" /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Delivery address<input name="address" autoComplete="street-address" required pattern=".*\S.*" /></label>
            <label>City<input name="city" autoComplete="address-level2" required pattern=".*\S.*" /></label>
            <h2>Payment</h2><div className="payment"><Check size={17} /><span>Simulated payment</span></div>
          </div>
          <aside className="summary"><h2>Order summary</h2>{cleanBag.map(line => <div className="summary-row" key={line.id + ':' + line.option}><span>{info.get(line.id)!.name} × {line.quantity}</span><span>{money(info.get(line.id)!.price * line.quantity)}</span></div>)}<Summary total={total} /><button className="button" type="submit">Place demo order <ArrowRight size={17} /></button><a className="underlined" href="#/bag">Back to bag</a></aside>
        </form> : <Empty title="Your bag is empty" message="Add jewelry to your bag to try checkout." />}</section>}
        {page === 'confirmation' && <section className="shell listing confirmation">{order ? <><Check size={32} /><h1>Demo order complete</h1><p>Thanks, {order.name}. Your demo total was {money(order.total)}.</p><a className="button" href="#/shop">Continue shopping <ArrowRight size={17} /></a></> : <Empty title="Order confirmation" message="Completed demo orders appear here." />}</section>}
      </main>
      <footer><div className="shell footer-inner"><div><a className="brand" href="#/">Amour<span aria-hidden="true">✦</span></a><p>Jewelry</p></div><nav aria-label="Footer"><a href="#/shop">Shop all</a><a href="#/wishlist">Wishlist</a><a href="#/bag">Shopping bag</a></nav><div className="footer-currency">Pakistan · PKR</div></div></footer>
      <div className={notice ? 'toast visible' : 'toast'} role="status">{notice}</div>
    </div>
  </>
}

type RenderCard = (item: Product, index: number) => ReactNode

function Home({ renderCard }: { renderCard: RenderCard }) {
  const story = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = story.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({
        scrollTrigger: {
          trigger: element, start: 'center center', end: '+=170',
          pin: true, pinSpacing: true, scrub: .65,
        },
      }).fromTo(element.querySelector('img'), { scale: 1.03 }, { scale: 1.15, ease: 'none' })
    })
    return () => media.revert()
  }, [])
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span aria-hidden="true">✦</span> The Amour Collection</p><h1>Love in the<br /><em>little things.</em></h1><p>Gold-tone details, soft curves, and pieces to make your own.</p><a className="button" href="#/shop">Explore the collection <ArrowRight size={18} /></a></div>
      <div className="hero-art"><div className="hero-inset" aria-hidden="true"></div><div className="hero-image"><img fetchPriority="high" src={photo(featured[1].photos[0])} alt="Amour open-heart pendant on a gold-tone chain" /></div><a href={productPath(featured[1])} className="hero-tag">Hollow Heart Pendant <ArrowRight size={15} /></a></div>
      <a className="scroll-cue" href="#/shop" onClick={event => { event.preventDefault(); document.getElementById("collections")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }) }} aria-label="Scroll to collections"><ArrowDown size={17} /></a>
    </section>
    <section className="shell home-section" id="collections">
      <Reveal className="section-head"><div><p className="eyebrow">Find your piece</p><h2>Shop by collection</h2></div><a className="underlined" href="#/shop">Shop all <ArrowRight size={15} /></a></Reveal>
      <div className="category-strip" aria-label="Jewelry collections">{categories.map((category, index) => <a key={category} href={categoryPath(category)} className="category-tile"><img loading="lazy" src={photo(info.get(categoryImages[index])!.photos[0])} alt="" /><span>{category}</span><ArrowRight size={14} /></a>)}</div>
    </section>
    <section className="shell home-section featured">
      <Reveal className="section-head"><div><p className="eyebrow">Selected for you</p><h2>The Amour edit</h2></div><a className="underlined" href="#/shop">View all jewelry <ArrowRight size={15} /></a></Reveal>
      <div className="grid">{featured.map(renderCard)}</div>
    </section>
    <section className="editorial" ref={story}><div className="editorial-media">
      <img loading="lazy" src={photo('photos/gold-toned-heart-pendant-necklace-1.webp')} alt="Amour heart pendant presented in a jewelry box" /></div>
      <div><p className="eyebrow">Pendant necklaces</p><h2>Close to the heart.</h2><a className="button" href={categoryPath('Pendant Necklaces')}>Explore pendants <ArrowRight size={17} /></a></div>
    </section>
  </>
}

function byName(a: Product, b: Product) { return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) }

function Shop({ category, renderCard }: { category?: string; renderCard: RenderCard }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('az')
  const [limit, setLimit] = useState(12)
  const results = catalog.filter(item => {
    const matchesCategory = !category || item.category === category
    return matchesCategory && (item.name + ' ' + item.category + ' ' + item.description).toLowerCase().includes(query.trim().toLowerCase())
  }).sort((a, b) => sort === 'az' ? byName(a, b) : byName(b, a))

  return <section className="shell listing">
    <div className="listing-head"><p className="eyebrow">The Amour Collection</p><h1>{category || 'Shop all jewelry'}</h1></div>
    <div className="filter-panel"><nav className="filter-chips" aria-label="Filter by category"><a href="#/shop" aria-current={!category ? 'page' : undefined}>All jewelry</a>{categories.map(value => <a key={value} href={categoryPath(value)} aria-current={value === category ? 'page' : undefined}>{value}</a>)}</nav>
    <div className="shop-controls">
      <label className="search-field"><Search size={17} /><input type="search" aria-label="Search products" placeholder="Search jewelry" value={query} onChange={event => { setQuery(event.target.value); setLimit(12) }} /></label>
      <label className="sort-field"><SlidersHorizontal size={17} /><select aria-label="Sort products" value={sort} onChange={event => { setSort(event.target.value); setLimit(12) }}><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></label>
    </div>
    </div><p className="result-count" role="status">{results.length} {results.length === 1 ? 'product' : 'products'}</p>
    {results.length ? <div className="grid">{results.slice(0, limit).map(renderCard)}</div> : <div className="empty"><h2>No matching jewelry</h2><button className="button" onClick={() => setQuery('')}>Clear search</button></div>}
    {results.length > limit && <button className="button outline load-more" onClick={() => setLimit(limit + 12)}>Load more <Plus size={17} /></button>}
  </section>
}

const options: Record<string, string[]> = {
  'be-my-watch': ['Silver-tone / light dial', 'Gold-tone / amber dial', 'Dark-tone / blue dial', 'Gold-tone / light dial', 'Dark-tone / dark dial', 'Silver-tone / green dial'],
  'tulip-bracelets': ['Pink and white', 'Warm neutrals', 'Pale pink', 'Blue and white', 'Multicolor', 'Red and white', 'Clear-tone'],
}
function variantOptions(item: Product) {
  const names = options[item.id]
  return names ? names.map((name, index) => ({ name, photo: index + (item.id === 'be-my-watch' ? 1 : 0) })) : []
}

function ProductPage({ item, saved, onSave, onAdd }: { item: Product; saved: boolean; onSave: () => void; onAdd: (option: number) => void }) {
  const variants = variantOptions(item)
  const [current, setCurrent] = useState(0)
  const [option, setOption] = useState(variants[0]?.photo ?? 0)
  const gallery = useRef<HTMLDivElement>(null)
  function go(index: number) {
    const element = gallery.current
    if (!element) return
    element.scrollTo({ left: index * element.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    setCurrent(index)
  }

  return <section className="shell product-page">
    <a className="underlined" href={categoryPath(item.category)}><ArrowLeft size={16} /> {item.category}</a>
    <div className="detail-layout">
      <div>
        <div ref={gallery} className="gallery" aria-label={item.name + ' photos'} onScroll={event => {
          const element = event.currentTarget
          if (element.clientWidth) setCurrent(Math.round(element.scrollLeft / element.clientWidth))
        }}>
          {item.photos.map((path, index) => <img key={path} src={photo(path)} loading={index === 0 ? 'eager' : 'lazy'} alt={`${item.name}, photo ${index + 1}`} />)}
        </div>
        {item.photos.length > 1 && <div className="gallery-controls"><button className="icon" type="button" aria-label="Previous photo" disabled={current === 0} onClick={() => go(current - 1)}><ChevronLeft size={22} /></button><span>{current + 1} / {item.photos.length}</span><button className="icon" type="button" aria-label="Next photo" disabled={current >= item.photos.length - 1} onClick={() => go(current + 1)}><ChevronRight size={22} /></button></div>}
        {item.photos.length > 1 && <div className="thumbnails">{item.photos.map((path, index) => <button type="button" key={path} aria-label={`Show photo ${index + 1}`} aria-pressed={current === index} onClick={() => go(index)}><img src={photo(path)} alt="" loading="lazy" /></button>)}</div>}
      </div>
      <div className="detail-copy"><p className="eyebrow">{item.category}</p><h1>{item.name}</h1><p className="price">{money(item.price)}</p><p>{item.description}</p>
        {variants.length > 0 && <label className="variant">Select a style<select value={option} onChange={event => { const index = Number(event.target.value); setOption(index); go(index) }}>{variants.map(variant => <option key={variant.photo} value={variant.photo}>{variant.name}</option>)}</select></label>}
        <div className="detail-actions"><button className="button" onClick={() => onAdd(option)}>Add to bag <ShoppingBag size={17} /></button><button className="icon detail-favorite" aria-label="Save to wishlist" aria-pressed={saved} onClick={onSave}><Heart size={21} /></button></div>
      </div>
    </div>
  </section>
}

function Empty({ title, message }: { title: string; message: string }) {
  return <div className="empty"><h2>{title}</h2><p>{message}</p><a className="button" href="#/shop">Explore jewelry <ArrowRight size={17} /></a></div>
}
function Summary({ total }: { total: number }) {
  return <><div className="summary-row"><span>Subtotal</span><span>{money(total)}</span></div><div className="summary-row"><span>Delivery (demo)</span><span>{money(0)}</span></div><div className="summary-row total"><strong>Total</strong><strong>{money(total)}</strong></div></>
}

createRoot(document.getElementById('root')!).render(<App />)
