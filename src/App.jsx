import React, { useState, useRef, useMemo, useReducer, useEffect } from 'react'

/* ============================================================
   🎨 DESIGN TOKENS (from Umbra.dc.html)
   ============================================================ */
const C = {
  bg:        '#08080A',
  surface:   '#0C0C0F',
  surface2:  '#0D0D11',
  surface3:  '#0E0E12',
  surfaceD:  '#0A0A0C',
  cardIn:    '#101014',
  cardInDk:  '#0A1016',
  cardBlue:  '#0B1218',
  cardBlue2: '#0B1520',
  border:    '#1B1B21',
  border2:   '#1F1F26',
  border3:   '#23232B',
  borderB:   '#1B2B3A',
  borderB2:  '#23323F',
  borderB3:  '#2A3A4A',
  blue:      '#3B8FCB',
  blueLt:    '#7CB9E3',
  blueLk:    '#4E9BD4',
  blueDk:    '#1E5F8F',
  blueHov:   '#5BA6DC',
  blueDeep:  '#12405F',
  ink:       '#06131F',
  text:      '#F2F0EC',
  textB:     '#E4E1DA',
  textM:     '#DAD7D0',
  textM2:    '#D6D3CC',
  textM3:    '#C9C6BF',
  muted:     '#B5B1A9',
  muted2:    '#A8A49C',
  muted3:    '#9C9891',
  muted4:    '#8B877F',
  muted5:    '#74716A',
  muted6:    '#6B6862',
  muted7:    '#57544F',
  muted8:    '#4E4B47',
  muted9:    '#3F3C38',
  green:     '#4ADE80',
  red:       '#E5484D',
  orange:    '#E8590C',
}

/* ============================================================
   📊 DATA
   ============================================================ */
const COVERS = [
  'linear-gradient(150deg,#3B8FCB,#12405F)',
  'linear-gradient(150deg,#6B4DF6,#3A1FA8)',
  'linear-gradient(150deg,#F0327A,#8E1046)',
  'linear-gradient(150deg,#2E3C4A,#141A20)',
  'linear-gradient(150deg,#4A2E5C,#1E1226)',
  'linear-gradient(150deg,#5C2E2E,#241010)',
  'linear-gradient(150deg,#2E4A44,#101E1B)',
]
const AVATARS = [
  'linear-gradient(140deg,#7CB9E3,#1E5F8F)',
  'linear-gradient(140deg,#6B4DF6,#2A1B7A)',
  'linear-gradient(140deg,#F0327A,#7A0F3C)',
  'linear-gradient(140deg,#4ADE80,#12703C)',
  'linear-gradient(140deg,#38BDF8,#0C4A6E)',
  'linear-gradient(140deg,#F0761E,#7A3208)',
]
const NAMES = ['Whitebeard','Roger','Kuro','Mihawk','Ace','Shanks','Buggy','Zoro','Nami','Law','Robin','Doflamingo','Sabo','Jinbe','Vivi','Marco','Drake','Kaido']

const TOMES = [
  { id: 1, num: 1, title: 'Tome 1 — Éveil', subtitle: 'Le passage entre les mondes s\'ouvre.', chapters: 6, price: 0,    paid: false, released: true,  isHot: true },
  { id: 2, num: 2, title: 'Tome 2 — Fractures', subtitle: 'Les royaumes commencent à se toucher.', chapters: 6, price: 3.99, paid: true,  released: true,  isHot: false },
  { id: 3, num: 3, title: 'Tome 3 — Marches Grises', subtitle: 'Le héros n\'est pas le premier.', chapters: 6, price: 3.99, paid: true,  released: true,  isHot: false },
  { id: 4, num: 4, title: 'Tome 4 — Cendres', subtitle: 'La ville engloutie parle.', chapters: 6, price: 3.99, paid: true,  released: false, isHot: false },
  { id: 5, num: 5, title: 'Tome 5 — Le Serment', subtitle: 'À paraître.', chapters: 6, price: 3.99, paid: true,  released: false, isHot: false },
  { id: 6, num: 6, title: 'Tome 6 — Ombres Longues', subtitle: 'À paraître.', chapters: 6, price: 3.99, paid: true,  released: false, isHot: false },
  { id: 7, num: 7, title: 'Tome 7 — Finale', subtitle: 'À paraître.', chapters: 6, price: 3.99, paid: true,  released: false, isHot: false },
].map((t, i) => ({ ...t, cover: COVERS[i % COVERS.length], reads: t.released ? 12000 + Math.round(Math.random() * 50000) : 0, likes: t.released ? 400 + Math.round(Math.random() * 2500) : 0 }))

const CHAPTERS_BY_TOME = TOMES.reduce((acc, t) => {
  acc[t.id] = Array.from({ length: t.chapters }, (_, i) => ({
    id: `${t.id}-${i + 1}`, num: i + 1,
    title: `Chapitre ${(t.id - 1) * 6 + i + 1}`,
    pages: 18 + Math.round(Math.random() * 8),
    locked: !t.released || (t.paid && t.id !== 1),
    likes: 40 + Math.round(Math.random() * 300),
    comments: 5 + Math.round(Math.random() * 40),
  }))
  return acc
}, {})

const CTXT = [
  "L'opening m'a donné des frissons. Le worldbuilding d'UMBRA est incroyable, hâte de voir la suite.",
  "Le style graphique mêlé à cette ambiance sombre, ça change vraiment du shonen classique.",
  "Quand sort le tome suivant ? J'ai déjà tout fini en une nuit.",
  "La double page du combat final est une claque. Sow Wele au sommet.",
  "Petit détail que personne ne relève : les symboles sur les murs annoncent la suite.",
  "Le rythme du chapitre est parfait, aucune page de remplissage.",
  "J'ai relu trois fois la scène du passage entre les mondes, le découpage est fou.",
  "Le personnage secondaire mérite son propre arc, franchement.",
]
const RTXT = ["Pareil, j'ai relu 3 fois.", 'Patience jeune padawan.', '+1 même état', 'Exactement ce que je pensais.', "T'as vu le détail page 34 ?", 'Grosse théorie, ça tient debout.']
const THEORIES = [
  "Théorie : les symboles gravés sur les murs du tome 2 annoncent déjà le retournement du tome 5.",
  "Théorie : le héros n'est pas le premier à traverser. Les fresques montrent quatre silhouettes.",
  "Théorie : les mondes ne s'effondrent pas, ils fusionnent. Les cases se superposent à chaque saut.",
  "Théorie : le mentor est le grand méchant du tome 6, regardez ses mains dans chaque plan.",
  "Théorie : la fille du chapitre 12 est la version adulte de la gamine du prologue.",
]

/* ============================================================
   🔧 HELPERS
   ============================================================ */
const uid = () => Math.random().toString(36).slice(2, 9)
const handleGen = () => '@Umbra' + NAMES[Math.floor(Math.random() * NAMES.length)] + '_' + Math.floor(100 + Math.random() * 900)
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K' : String(n))
const eur = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.00', '') + ' €'
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const mkPost = (i, isTheory = false) => ({
  id: uid(),
  author: handleGen(),
  avatar: AVATARS[i % AVATARS.length],
  text: isTheory ? pick(THEORIES) : pick(CTXT),
  time: pick(['il y a 2h', 'il y a 5h', 'il y a 1j', 'il y a 3j', 'il y a 12h']),
  likes: 4 + Math.round(Math.random() * 220),
  likedBy: [],
  isTheory,
  replies: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
    id: uid(),
    author: handleGen(),
    avatar: AVATARS[(i + j + 1) % AVATARS.length],
    text: pick(RTXT),
    time: 'il y a 1h',
    likes: Math.round(Math.random() * 30),
    likedBy: [],
  })),
})

const INITIAL_POSTS = [
  mkPost(0, false),
  mkPost(1, true),
  mkPost(2, false),
  mkPost(3, false),
  mkPost(4, true),
  mkPost(5, false),
  mkPost(6, false),
]

const mkChapterComments = (n) => Array.from({ length: n }, (_, i) => ({
  id: uid(),
  author: handleGen(),
  avatar: AVATARS[i % AVATARS.length],
  badge: i === 0 ? 'PREMIER' : 'LECTEUR',
  text: pick(CTXT),
  time: pick(['à l\'instant', 'il y a 5min', 'il y a 1h', 'il y a 3h']),
  likes: Math.round(Math.random() * 80),
  likedBy: [],
  replies: [],
}))

/* ============================================================
   🎯 ATOMS
   ============================================================ */
const Btn = ({ variant = 'primary', className = '', style, children, ...rest }) => {
  const base = 'btn-hover inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none'
  const v = {
    primary: { background: C.blue, color: C.ink, padding: '13px 22px', fontSize: 13.5, fontWeight: 800 },
    ghost:   { background: 'transparent', color: C.text, padding: '13px 22px', fontSize: 13.5, fontWeight: 700, border: `1px solid ${C.borderB3}` },
    outline: { background: 'transparent', color: C.blueLt, padding: '11px 18px', fontSize: 13, fontWeight: 800, border: `1px solid ${C.blue}` },
    light:   { background: C.text, color: '#11151A', padding: '13px 22px', fontSize: 13.5, fontWeight: 800 },
    danger:  { background: 'transparent', color: C.red, padding: '11px 18px', fontSize: 13, fontWeight: 700, border: `1px solid ${C.red}` },
  }[variant]
  return (
    <button className={`${base} ${className}`} style={{ ...v, ...style }} {...rest}
      onMouseEnter={(e) => { if (variant === 'primary' || variant === 'light') e.currentTarget.style.background = variant === 'primary' ? C.blueHov : '#FFFFFF' }}
      onMouseLeave={(e) => { if (variant === 'primary' || variant === 'light') e.currentTarget.style.background = variant === 'primary' ? C.blue : C.text }}
    >{children}</button>
  )
}

const Chip = ({ active, onClick, children }) => (
  <div
    onClick={onClick}
    className="btn-hover"
    style={{
      padding: '8px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
      color: active ? C.text : C.muted2,
      background: active ? '#16161A' : 'transparent',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#16161A'; e.currentTarget.style.color = C.text }}
    onMouseLeave={(e) => { e.currentTarget.style.background = active ? '#16161A' : 'transparent'; e.currentTarget.style.color = active ? C.text : C.muted2 }}
  >{children}</div>
)

const Toast = ({ message, show }) => (
  <div style={{
    position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 95,
    padding: '13px 22px', borderRadius: 999, background: C.blue, color: C.ink,
    fontSize: 13, fontWeight: 800, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
    opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none',
    transition: 'opacity 220ms ease',
  }}>{message}</div>
)

/* ============================================================
   🪟 MODAL WRAPPER
   ============================================================ */
const Modal = ({ open, onClose, children, width = 460, zIndex = 90 }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="animate-modal-fade" onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(4,6,10,.84)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, overflow: 'auto' }}>
      <div className="animate-modal-scale" onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%', borderRadius: 20, border: `1px solid ${C.borderB2}`, background: '#0D1218', padding: 28 }}>
        {children}
      </div>
    </div>
  )
}

/* ============================================================
   🧭 LEFT DOCK
   ============================================================ */
const LeftDock = ({ onSupport }) => (
  <div style={{ position: 'fixed', left: 18, top: '50%', transform: 'translateY(-50%)', zIndex: 60, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Compte X"
      style={{ width: 46, height: 46, borderRadius: 999, border: `1px solid ${C.borderB2}`, background: '#0D131A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: C.blueLt }}>𝕏</a>
    <a href="https://tiktok.com" target="_blank" rel="noreferrer" title="Compte TikTok"
      style={{ width: 46, height: 46, borderRadius: 999, border: `1px solid ${C.borderB2}`, background: '#0D131A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: C.blueLt }}>♪</a>
    <div onClick={onSupport} title="Cagnotte soutien créateur"
      style={{ width: 46, height: 46, borderRadius: 999, background: C.blue, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>€</div>
  </div>
)

/* ============================================================
   🎩 HEADER
   ============================================================ */
const Header = ({ view, goto, handle, isSignedIn, onOpenAuth, search, onSearch }) => {
  const isActive = (k) => view === k
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,10,.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 10, columnGap: 18 }}>
        <div onClick={() => goto('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div className="font-display" style={{ width: 30, height: 30, borderRadius: 8, background: C.blue, color: C.ink, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>U</div>
          <div className="font-display" style={{ fontSize: 17, letterSpacing: '.14em' }}>UMBRA</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Chip active={isActive('home')} onClick={() => goto('home')}>Accueil</Chip>
          <Chip active={isActive('community') || isActive('thread')} onClick={() => goto('community')}>Communauté</Chip>
          <Chip active={isActive('library') || isActive('reader')} onClick={() => goto('library')}>Lecture</Chip>
        </div>
        <div style={{ flex: '1 1 12px', minWidth: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher…"
            style={{ flex: '0 1 210px', minWidth: 0, width: 210, padding: '9px 14px', borderRadius: 999, border: `1px solid ${C.border3}`, background: C.cardIn, color: C.text, fontSize: 13, outline: 'none' }} />
          <div onClick={() => goto('referral')} className="btn-hover"
            style={{ padding: '9px 16px', borderRadius: 999, background: C.blue, color: C.ink, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.blueHov)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.blue)}>Parrainage</div>
          <div onClick={onOpenAuth} className="btn-hover"
            style={{ padding: '9px 14px', borderRadius: 999, border: `1px solid ${isSignedIn ? C.blue : C.border3}`, color: isSignedIn ? C.blueLt : C.text, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isSignedIn ? handle : 'Se connecter'}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   🏠 HOME SCREEN
   ============================================================ */
const HomeScreen = ({ goto, tomes, onTomeClick, posts, videoRef, playing, togglePlay, onSupport, meta }) => {
  const topChapters = useMemo(() => {
    const all = Object.values(CHAPTERS_BY_TOME).flat().map((c) => ({ ...c, tomeId: Number(c.id.split('-')[0]) }))
    return all.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 5)
  }, [])

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px 0' }}>
      {/* HERO */}
      <div style={{ borderRadius: 20, border: `1px solid ${C.border2}`, background: 'linear-gradient(115deg, #0B1520 0%, #0C0C0F 55%, #0A0A0C 100%)', padding: 34, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 34, alignItems: 'center' }} className="hero-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '5px 11px', borderRadius: 999, background: C.blue, color: C.ink, fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em' }}>TENDANCE #1</div>
            <div style={{ fontSize: 12, color: C.muted6, letterSpacing: '.04em' }}>Latest 24h · Shōnen / Fantasy</div>
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: '.16em', color: C.muted6, marginBottom: 10 }}>UNE ŒUVRE UMBRA</div>
          <div className="font-display" style={{ fontSize: 'clamp(46px, 7.5vw, 68px)', lineHeight: .92, letterSpacing: '-.01em' }}>UMBRA</div>
          <div style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.6, color: C.muted, maxWidth: 460 }}>
            La fresque de <span style={{ color: C.blueLt, fontWeight: 700 }}>Sow Wele</span> : quand les royaumes s'effondrent les uns dans les autres, un jeune homme doit apprendre à traverser les mondes.
          </div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 22, fontSize: 12.5, color: C.muted4, flexWrap: 'wrap' }}>
            <div><span style={{ color: C.text, fontWeight: 800 }}>{fmt(meta.reads)}</span> lectures cumulées</div>
            <div><span style={{ color: C.text, fontWeight: 800 }}>{fmt(meta.likes)}</span> likes</div>
            <div><span style={{ color: C.text, fontWeight: 800 }}>{fmt(meta.videoViews)}</span> vues vidéo</div>
            <div>{tomes.length} tomes</div>
          </div>
          <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn onClick={() => onTomeClick(tomes[0])}>Lire le tome 1</Btn>
            <Btn variant="ghost" onClick={() => goto('community')}>Voir les avis</Btn>
          </div>
        </div>

        {/* VIDEO */}
        <div style={{ borderRadius: 19, padding: 3, background: 'linear-gradient(150deg, #7CB9E3 0%, #3B8FCB 42%, #1E5F8F 100%)', boxShadow: '0 0 0 1px rgba(59,143,203,.35), 0 18px 50px rgba(30,95,143,.28)' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#0B0B0E', aspectRatio: '16/9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} src="/opening.mp4" loop playsInline preload="metadata"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => (e.currentTarget.style.display = 'none')} />
            <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
              style={{ position: 'absolute', inset: 0, background: playing ? 'transparent' : 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, cursor: 'pointer', opacity: playing ? 0 : 1, transition: 'opacity 200ms ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = playing ? 0 : 1)}>
              <div className="animate-umbra-pulse" style={{ width: 62, height: 62, borderRadius: 999, background: C.blue, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>{playing ? '⏸' : '▶'}</div>
            </button>
            <div style={{ position: 'absolute', bottom: 10, right: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(6,12,20,.78)', fontSize: 11, fontWeight: 700, color: C.blueLt }}>{fmt(meta.videoViews)} vues</div>
          </div>
        </div>
      </div>

      {/* DERNIÈRES SORTIES */}
      <div style={{ marginTop: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div className="font-display" style={{ fontSize: 24 }}>Dernières sorties</div>
          <div style={{ marginTop: 6, fontSize: 13, color: C.muted4 }}>{tomes.filter((t) => t.released).length} tomes disponibles · {tomes.length - tomes.filter((t) => t.released).length} à venir</div>
        </div>
        <div onClick={() => goto('library')} style={{ fontSize: 13, fontWeight: 700, color: C.blueLk, cursor: 'pointer' }}>Voir tout →</div>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))', gap: 14 }}>
        {tomes.map((t) => (
          <TomeCard key={t.id} tome={t} onClick={() => onTomeClick(t)} />
        ))}
      </div>

      {/* TOP 5 */}
      <div style={{ marginTop: 44 }}>
        <div className="font-display" style={{ fontSize: 24 }}>Top 5 des chapitres les plus commentés</div>
        <div style={{ marginTop: 6, fontSize: 13, color: C.muted4 }}>Classement automatique — likes + commentaires · mis à jour il y a 2h</div>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {topChapters.map((ch, i) => {
          const rankColors = [C.blue, '#B5B1A9', '#E8590C', C.muted5, C.muted5]
          const tome = TOMES.find((t) => t.id === ch.tomeId)
          return (
            <div key={ch.id} onClick={() => onTomeClick(tome)} className="card-hover"
              style={{ borderRadius: 14, border: `1px solid ${C.border2}`, background: C.surface3, padding: 14, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
              <div className="font-display" style={{ fontSize: 30, color: rankColors[i], lineHeight: 1 }}>{i + 1}</div>
              <div style={{ width: 38, height: 54, borderRadius: 7, background: tome.cover, flex: 'none' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</div>
                <div style={{ marginTop: 5, fontSize: 11, color: C.muted5 }}>♡ {ch.likes} · 💬 {ch.comments}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* AD */}
      <div style={{ marginTop: 28, borderRadius: 14, border: `1px dashed #26262E`, background: '#0B0B0E', padding: 22, textAlign: 'center' }}>
        <div className="font-mono-um" style={{ fontSize: 11, color: C.muted7, letterSpacing: '.06em' }}>Emplacement pub Google AdSense — 970×250 desktop / 300×250 mobile</div>
      </div>

      {/* À PROPOS */}
      <div style={{ marginTop: 44, borderRadius: 20, border: `1px solid ${C.border2}`, background: C.surface, padding: 28, display: 'grid', gridTemplateColumns: 'minmax(0, 260px) 1fr', gap: 32 }} className="about-grid">
        <div style={{ borderRadius: 14, aspectRatio: '2/3', background: COVERS[0], position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 16, left: 18 }} className="font-display">
            <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'rgba(255,255,255,.8)' }}>SOW WELE</div>
          </div>
          <div className="font-display" style={{ position: 'absolute', top: 34, left: 18, fontSize: 22, color: '#fff' }}>UMBRA</div>
          <div className="font-display" style={{ position: 'absolute', bottom: 8, right: 18, fontSize: 64, color: 'rgba(255,255,255,.92)', lineHeight: 1 }}>1</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, letterSpacing: '.08em' }}>
            <div style={{ color: C.green, fontWeight: 800 }}>● EN COURS</div>
            <div style={{ color: C.muted5 }}>Shōnen · Action · Fantasy · Drama</div>
          </div>
          <div className="font-display" style={{ marginTop: 12, fontSize: 30 }}>À propos d'UMBRA</div>
          <div style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.7, color: C.muted }}>
            Dans un univers où plusieurs réalités cohabitent, un jeune homme découvre qu'il peut traverser les frontières entre les mondes. Alors qu'une menace ancienne s'éveille, il devra apprendre à maîtriser ce pouvoir avant que les royaumes ne s'effondrent les uns dans les autres.
          </div>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {[['AUTEUR', 'Sow Wele'], ['ANNÉE', '2026'], ['ÉDITION', 'Indépendant'], ['TOMES', String(tomes.length)]].map(([k, v]) => (
              <div key={k} style={{ borderRadius: 10, border: `1px solid ${C.border2}`, background: C.cardIn, padding: '12px 14px' }}>
                <div style={{ fontSize: 9.5, letterSpacing: '.12em', color: C.muted6 }}>{k}</div>
                <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Action', 'Fantasy', 'Aventure', 'Drama', 'Mystère'].map((g) => (
              <div key={g} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.border3}`, fontSize: 11.5, color: C.muted2 }}>{g}</div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn onClick={() => onTomeClick(tomes[0])}>Lire le tome 1</Btn>
            <Btn variant="ghost" onClick={() => goto('referral')}>Partager mon lien</Btn>
          </div>
        </div>
      </div>

      {/* COMMUNAUTÉ APERÇU */}
      <div style={{ marginTop: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div className="font-display" style={{ fontSize: 24 }}>Espace Communauté</div>
          <div style={{ marginTop: 6, fontSize: 13, color: C.muted4 }}>{posts.length} posts · accès libre, pseudo anonyme</div>
        </div>
        <div onClick={() => goto('community')} style={{ fontSize: 13, fontWeight: 700, color: C.blueLk, cursor: 'pointer' }}>Voir tout →</div>
      </div>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {posts.slice(0, 3).map((p) => (
          <div key={p.id} onClick={() => goto('community')} className="card-hover"
            style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface3, padding: '16px 18px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 999, background: p.avatar }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: C.blueLt }}>{p.author}</div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11, color: C.muted6 }}>{p.time}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: C.textM }}>{p.text}</div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: C.muted5 }}>♡ {p.likes} · 💬 {p.replies.length}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   🎴 TOME CARD (grid)
   ============================================================ */
const TomeCard = ({ tome, onClick }) => (
  <div onClick={onClick} className="btn-hover" style={{ cursor: 'pointer' }}>
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '2/3', background: tome.cover, border: `1px solid ${C.border2}` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,0) 42%, rgba(0,0,0,.62) 100%)' }} />
      <div className="font-display" style={{ position: 'absolute', top: 9, left: 10, fontSize: 8.5, letterSpacing: '.16em', color: 'rgba(255,255,255,.82)' }}>UMBRA</div>
      <div className="font-display" style={{ position: 'absolute', bottom: 4, right: 10, fontSize: 40, color: 'rgba(255,255,255,.94)', lineHeight: 1 }}>{tome.num}</div>
      {tome.locked && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,8,12,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: C.blue, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🔒</div>
        </div>
      )}
      {tome.isHot && !tome.locked && (
        <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '3px 8px', borderRadius: 5, background: C.orange, color: '#FFF', fontSize: 9, fontWeight: 800, letterSpacing: '.1em' }}>HOT</div>
      )}
    </div>
    <div style={{ marginTop: 9, fontSize: 13, fontWeight: 700 }}>{tome.title}</div>
    <div style={{ marginTop: 3, fontSize: 11, color: C.muted5 }}>{tome.chapters} chapitres · {tome.subtitle}</div>
    <div className="font-mono-um" style={{ marginTop: 5, display: 'flex', gap: 9, fontSize: 10.5, color: '#6E7B87' }}>
      <div>♡ {fmt(tome.likes)}</div>
      <div>👁 {fmt(tome.reads)}</div>
    </div>
    <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700, color: !tome.released ? C.muted6 : tome.paid ? C.blueLt : C.green }}>
      {!tome.released ? 'À VENIR' : tome.paid ? eur(tome.price) : 'GRATUIT'}
    </div>
  </div>
)

/* ============================================================
   📚 LIBRARY SCREEN
   ============================================================ */
const LibraryScreen = ({ tomes, onTomeClick, onChapterClick }) => (
  <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0' }}>
    <div className="font-display" style={{ fontSize: 'clamp(28px, 6vw, 34px)' }}>Tous les tomes</div>
    <div style={{ marginTop: 8, fontSize: 13.5, color: C.muted4 }}>{tomes.filter((t) => t.released).length} tomes disponibles · série en cours</div>
    <div style={{ marginTop: 26, display: 'grid', gap: 14 }}>
      {tomes.map((t) => (
        <div key={t.id} style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface2, padding: 18, display: 'grid', gridTemplateColumns: '78px 1fr auto', gap: 20, alignItems: 'center' }}>
          <div style={{ borderRadius: 9, aspectRatio: '2/3', background: t.cover, position: 'relative', overflow: 'hidden' }}>
            <div className="font-display" style={{ position: 'absolute', bottom: 2, right: 7, fontSize: 26, color: 'rgba(255,255,255,.94)', lineHeight: 1 }}>{t.num}</div>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{t.title}</div>
            <div style={{ marginTop: 5, fontSize: 12.5, color: C.muted4 }}>{t.subtitle}</div>
            <div className="font-mono-um" style={{ marginTop: 7, fontSize: 11, color: '#6E7B87' }}>👁 {fmt(t.reads)} lectures · ♡ {fmt(t.likes)}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CHAPTERS_BY_TOME[t.id].slice(0, 3).map((ch) => (
                <div key={ch.id} onClick={(e) => { e.stopPropagation(); onChapterClick(t, ch) }} className="btn-hover"
                  style={{ padding: '8px 13px', borderRadius: 9, border: `1px solid ${C.border3}`, background: C.cardIn, fontSize: 12, fontWeight: 600, color: C.textM2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div>Ch. {ch.num}</div>
                  <div style={{ fontSize: 10.5, color: C.muted6 }}>{ch.locked ? '🔒' : '·'}</div>
                </div>
              ))}
              {CHAPTERS_BY_TOME[t.id].length > 3 && (
                <div style={{ padding: '8px 13px', fontSize: 12, color: C.muted6 }}>+ {CHAPTERS_BY_TOME[t.id].length - 3} autres</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: !t.released ? C.muted5 : t.paid ? C.blueLk : C.green }}>
              {!t.released ? 'À VENIR' : t.paid ? eur(t.price) : 'GRATUIT'}
            </div>
            <div onClick={() => onTomeClick(t)} className="btn-hover"
              style={{ marginTop: 10, padding: '10px 18px', borderRadius: 10, background: C.blue, color: C.ink, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.blueHov)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.blue)}>
              {t.locked ? 'Débloquer' : 'Lire'}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

/* ============================================================
   📖 READER SCREEN
   ============================================================ */
const ReaderScreen = ({ goto, tome, chapter, mode, setMode, page, setPage, zoom, setZoom, bright, setBright, comments, onComment, onLikeComment, currentUser, onOpenSupport, onNextChapter }) => {
  if (!tome || !chapter) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 0', color: C.muted4 }}>
        <div onClick={() => goto('library')} style={{ fontSize: 13, fontWeight: 700, color: C.muted4, cursor: 'pointer' }}>← Bibliothèque</div>
        <div className="font-display" style={{ marginTop: 20, fontSize: 24 }}>Sélectionne un chapitre depuis la bibliothèque.</div>
      </div>
    )
  }

  const [draft, setDraft] = useState('')
  const pageCount = chapter.pages
  const zoomWidth = `${Math.round(zoom * 720)}px`
  const brightFilter = `brightness(${bright}%)`

  const submit = () => {
    if (!draft.trim()) return
    onComment(draft.trim())
    setDraft('')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div onClick={() => goto('library')} style={{ fontSize: 13, fontWeight: 700, color: C.muted4, cursor: 'pointer' }}>← Bibliothèque</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', borderRadius: 999, border: `1px solid ${C.border3}`, overflow: 'hidden' }}>
          <div onClick={() => setMode('paged')} style={{ padding: '8px 15px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: mode === 'paged' ? C.blue : 'transparent', color: mode === 'paged' ? C.ink : C.textM2 }}>Page par page</div>
          <div onClick={() => setMode('scroll')} style={{ padding: '8px 15px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: mode === 'scroll' ? C.blue : 'transparent', color: mode === 'scroll' ? C.ink : C.textM2 }}>Scroll continu</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: '.1em', color: C.muted6 }}>{tome.title.toUpperCase()}</div>
        <div className="font-display" style={{ marginTop: 6, fontSize: 30 }}>{chapter.title}</div>
        <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted4 }}>{pageCount} pages · {chapter.likes} likes · {chapter.comments} commentaires</div>
      </div>

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 92px', gap: 18, alignItems: 'start' }}>
        <div style={{ filter: brightFilter }}>
          {mode === 'scroll' ? (
            <div style={{ display: 'block', overflowX: 'auto' }}>
              {Array.from({ length: pageCount }, (_, i) => (
                <div key={i} style={{ width: zoomWidth, margin: '0 auto 8px', borderRadius: 6, overflow: 'hidden', background: C.surface2, border: `1px solid #17171C` }}>
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'repeating-linear-gradient(135deg, #0E0E12 0 14px, #111117 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="font-mono-um" style={{ fontSize: 11, color: C.muted7, letterSpacing: '.08em' }}>Page {i + 1} / {pageCount}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'block', overflowX: 'auto' }}>
                <div onClick={() => setPage(Math.min(page + 1, pageCount))} title="Cliquer pour la page suivante"
                  style={{ width: zoomWidth, margin: '0 auto', borderRadius: 8, overflow: 'hidden', background: C.surface2, border: `1px solid #17171C`, cursor: 'pointer' }}>
                  <div style={{ width: '100%', aspectRatio: '2/3', background: 'repeating-linear-gradient(135deg, #0E0E12 0 14px, #111117 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="font-mono-um" style={{ fontSize: 12, color: C.muted7, letterSpacing: '.08em' }}>Page {page} / {pageCount}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div onClick={() => setPage(Math.max(page - 1, 1))} className="btn-hover"
                  style={{ width: 46, height: 46, borderRadius: 999, border: `1px solid ${C.borderB3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: C.text, cursor: 'pointer' }}>←</div>
                <div className="font-mono-um" style={{ fontSize: 13, color: C.muted2, minWidth: 90, textAlign: 'center' }}>{page} / {pageCount}</div>
                <div onClick={() => setPage(Math.min(page + 1, pageCount))} className="btn-hover"
                  style={{ width: 46, height: 46, borderRadius: 999, border: `1px solid ${C.borderB3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: C.text, cursor: 'pointer' }}>→</div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR OUTILS */}
        <div style={{ position: 'sticky', top: 90, borderRadius: 14, border: `1px solid ${C.border}`, background: 'linear-gradient(180deg, #101015, #0A0A0D)', padding: '12px 8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: '100%', textAlign: 'center', fontSize: 8.5, letterSpacing: '.12em', color: C.muted6, padding: '3px 0', background: '#131318', borderRadius: 5 }}>DÉFILEMENT</div>
          <div onClick={() => setMode('scroll')} title="Défilement vertical" style={{ width: 40, height: 34, borderRadius: 8, border: `1px solid ${mode === 'scroll' ? C.blue : C.borderB3}`, color: mode === 'scroll' ? C.blueLt : C.textM2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer' }}>↕</div>
          <div onClick={() => setMode('paged')} title="Page par page" style={{ width: 40, height: 34, borderRadius: 8, border: `1px solid ${mode === 'paged' ? C.blue : C.borderB3}`, color: mode === 'paged' ? C.blueLt : C.textM2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer' }}>↔</div>

          <div style={{ width: '100%', textAlign: 'center', fontSize: 8.5, letterSpacing: '.12em', color: C.muted6, padding: '3px 0', background: '#131318', borderRadius: 5 }}>ZOOM</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} title="Réduire" style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.borderB3}`, color: C.textM2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer' }}>−</div>
            <div onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} title="Agrandir" style={{ width: 22, height: 22, borderRadius: 6, background: C.blue, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+</div>
          </div>
          <div onClick={() => setZoom(0.8)} className="font-mono-um" style={{ fontSize: 10, color: '#6E7B87', cursor: 'pointer' }}>{Math.round(zoom * 100)}%</div>

          <div style={{ width: '100%', textAlign: 'center', fontSize: 8.5, letterSpacing: '.12em', color: C.muted6, padding: '3px 0', background: '#131318', borderRadius: 5 }}>LUMINOSITÉ</div>
          <input type="range" min="60" max="130" value={bright} onChange={(e) => setBright(Number(e.target.value))} style={{ width: 60 }} />
          <div className="font-mono-um" style={{ fontSize: 9.5, color: C.muted7 }}>{bright}%</div>
        </div>
      </div>

      {/* ACTIONS BAS */}
      <div style={{ marginTop: 34, borderRadius: 16, border: `1px solid ${C.border2}`, background: C.surface, padding: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ padding: '11px 18px', borderRadius: 11, border: `1px solid ${C.borderB3}`, color: C.text, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>♡ J'aime ce chapitre</div>
        <div style={{ fontSize: 12.5, color: C.muted4 }}>{chapter.likes} likes · {chapter.comments} commentaires</div>
        <div style={{ flex: 1 }} />
        <div onClick={onOpenSupport} style={{ padding: '11px 18px', borderRadius: 11, border: `1px solid ${C.blue}`, color: C.blueLt, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>♥ Soutenir l'auteur</div>
        <Btn onClick={onNextChapter}>Chapitre suivant →</Btn>
      </div>

      {/* DONATION LIBRE */}
      <div style={{ marginTop: 18, borderRadius: 16, border: `1px solid ${C.borderB}`, background: 'linear-gradient(120deg, #0B1520, #0C0C0F)', padding: 22, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Ce chapitre t'a plu ?</div>
          <div style={{ marginTop: 6, fontSize: 13, color: C.muted4, maxWidth: 520, lineHeight: 1.55 }}>Le prix est libre. Tu donnes ce que tu veux, et le total rejoint la cagnotte publique du créateur.</div>
        </div>
        <div style={{ flex: 1 }} />
        <Btn onClick={onOpenSupport}>Donner ce que je veux</Btn>
      </div>

      {/* COMMENTAIRES */}
      <div style={{ marginTop: 34 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <div className="font-display" style={{ fontSize: 22 }}>Commentaires du chapitre</div>
          <div style={{ fontSize: 12.5, color: C.muted5 }}>{comments.length} avis</div>
        </div>
        <div style={{ marginTop: 16, borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface3, padding: 16 }}>
          <div style={{ fontSize: 12, color: C.muted4 }}>Tu publies en tant que <span style={{ color: C.blueLt, fontWeight: 700 }}>{currentUser}</span></div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Ton commentaire sur ce chapitre…"
              style={{ flex: 1, padding: '12px 15px', borderRadius: 10, border: `1px solid ${C.border3}`, background: C.cardIn, color: C.text, fontSize: 13.5, outline: 'none' }} />
            <Btn onClick={submit}>Publier</Btn>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          {comments.map((c) => {
            const liked = c.likedBy.includes(currentUser)
            return (
              <div key={c.id} style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface3, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 999, background: c.avatar }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.blueLt }}>{c.author}</div>
                  <div style={{ padding: '2px 7px', borderRadius: 5, background: '#17171C', fontSize: 10, color: C.muted5, fontWeight: 700 }}>{c.badge}</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 11, color: C.muted6 }}>{c.time}</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: C.textM }}>{c.text}</div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div onClick={() => onLikeComment(c.id)} style={{ fontSize: 12, fontWeight: 700, color: liked ? C.red : C.muted5, cursor: 'pointer' }}>♡ {c.likes}{liked ? ' • Aimé' : ''}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted5, cursor: 'pointer' }}>Répondre</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   👥 COMMUNITY SCREEN
   ============================================================ */
const CommunityScreen = ({ posts, dispatch, currentUser, goto, sort, setSort, onOpenSupport, onRegenHandle }) => {
  const [draft, setDraft] = useState('')
  const [isTheory, setIsTheory] = useState(false)

  const sorted = useMemo(() => {
    const list = [...posts]
    if (sort === 'popular') return list.sort((a, b) => b.likes - a.likes)
    if (sort === 'theory') return list.filter((p) => p.isTheory)
    return list
  }, [posts, sort])

  const submit = () => {
    if (!draft.trim()) return
    dispatch({ type: 'POST', author: currentUser, text: draft.trim(), isTheory })
    setDraft('')
    setIsTheory(false)
  }

  const topComments = useMemo(() => [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3), [posts])
  const topChapters = useMemo(() => {
    const all = Object.values(CHAPTERS_BY_TOME).flat()
    return all.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 5)
  }, [])

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 28, alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <div className="font-display" style={{ fontSize: 'clamp(28px, 6vw, 34px)' }}>Espace Communauté</div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: C.muted4 }}>{posts.length} posts · sans compte · pseudo anonyme généré automatiquement</div>

        <div style={{ position: 'sticky', top: 78, zIndex: 30, paddingTop: 14, background: 'linear-gradient(180deg, #08080A 72%, rgba(8,8,10,0) 100%)' }}>
          <div style={{ borderRadius: 16, border: `1px solid ${C.borderB}`, background: C.cardBlue, padding: 18, display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: 'linear-gradient(140deg, #7CB9E3, #1E5F8F)' }} />
            <div>
              <div style={{ fontSize: 12, color: C.muted4 }}>Tu publies en tant que <span style={{ color: C.blueLt, fontWeight: 700 }}>{currentUser}</span></div>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Quoi de neuf sur UMBRA ?" rows={2}
                style={{ marginTop: 10, width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.borderB2}`, background: C.cardInDk, color: C.text, fontSize: 15, lineHeight: 1.55, outline: 'none', resize: 'vertical' }} />
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div onClick={() => setIsTheory((v) => !v)}
                  style={{ padding: '7px 13px', borderRadius: 999, border: `1px solid ${isTheory ? C.blue : C.borderB2}`, color: isTheory ? C.blueLt : C.muted4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>Theory Space</div>
                <div style={{ fontSize: 11.5, color: C.muted6 }}>{draft.length}/500</div>
                <div style={{ flex: 1 }} />
                <Btn onClick={submit} style={{ borderRadius: 999, padding: '10px 22px' }}>Publier</Btn>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            {[['popular', 'Populaire'], ['theory', 'Theory Space'], ['recent', 'Récent']].map(([k, label]) => (
              <div key={k} onClick={() => setSort(k)}
                style={{ padding: '13px 20px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', color: sort === k ? C.text : C.muted4, borderBottom: `2px solid ${sort === k ? C.blue : 'transparent'}` }}>{label}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid' }}>
          {sorted.map((p) => {
            const liked = p.likedBy.includes(currentUser)
            return (
              <div key={p.id} style={{ borderBottom: `1px solid #16161B`, padding: '18px 4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: p.avatar }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div onClick={() => goto('thread', p.id)} style={{ fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>{p.author}</div>
                      <div style={{ fontSize: 12, color: C.muted6 }}>· {p.time}</div>
                      {p.isTheory && <div style={{ padding: '2px 8px', borderRadius: 5, background: '#12202C', fontSize: 10, fontWeight: 800, color: C.blueLt }}>THEORY</div>}
                    </div>
                    <div onClick={() => goto('thread', p.id)} style={{ marginTop: 6, fontSize: 15, lineHeight: 1.6, color: C.textB, cursor: 'pointer' }}>{p.text}</div>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 26 }}>
                      <div onClick={() => dispatch({ type: 'LIKE', postId: p.id, user: currentUser })} style={{ fontSize: 12.5, fontWeight: 700, color: liked ? C.red : C.muted5, cursor: 'pointer' }}>♡ {p.likes}</div>
                      <div onClick={() => goto('thread', p.id)} style={{ fontSize: 12.5, fontWeight: 700, color: C.muted5, cursor: 'pointer' }}>💬 {p.replies.length}</div>
                      <div onClick={() => goto('thread', p.id)} style={{ fontSize: 12.5, fontWeight: 700, color: C.muted5, cursor: 'pointer' }}>Répondre</div>
                    </div>
                    {p.replies.slice(0, 1).map((r) => (
                      <div key={r.id} style={{ marginTop: 12, borderLeft: `2px solid #1F2A33`, paddingLeft: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 999, background: r.avatar }} />
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.blueLk }}>{r.author}</div>
                          <div style={{ fontSize: 11, color: C.muted7 }}>· {r.time}</div>
                        </div>
                        <div style={{ marginTop: 7, fontSize: 13.5, lineHeight: 1.55, color: C.textM3 }}>{r.text}</div>
                      </div>
                    ))}
                    {p.replies.length > 1 && (
                      <div onClick={() => goto('thread', p.id)} style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: C.blueLk, cursor: 'pointer', paddingLeft: 16 }}>Voir les {p.replies.length - 1} autres réponses →</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <div style={{ borderRadius: 14, border: `1px dashed ${C.border2}`, background: '#0B0B0E', padding: '34px 24px', textAlign: 'center', marginTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.textM2 }}>Personne n'a encore parlé</div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.6, color: C.muted7 }}>Sois le premier à publier une réaction ou une théorie sur UMBRA.</div>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ display: 'grid', gap: 16, position: 'sticky', top: 96 }}>
        <div style={{ borderRadius: 16, border: `1px solid ${C.borderB}`, background: C.cardBlue, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Commentaires les plus engageants</div>
          <div style={{ marginTop: 6, fontSize: 12, color: C.muted5, lineHeight: 1.5 }}>Classé par likes et réponses.</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {topComments.map((tc) => (
              <div key={tc.id} onClick={() => goto('thread', tc.id)} className="card-hover"
                style={{ borderRadius: 12, border: `1px solid ${C.borderB}`, background: C.cardInDk, padding: '12px 13px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="font-mono-um" style={{ fontSize: 11, color: C.blueLt }}>{tc.author}</div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontSize: 11, color: C.muted5 }}>♡ {tc.likes}</div>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.55, color: C.textM2 }}>{tc.text.length > 90 ? tc.text.slice(0, 88) + '…' : tc.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Chapitres les plus commentés</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {topChapters.map((c, i) => (
              <div key={c.id} className="card-hover" style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
                <div className="font-display" style={{ fontSize: 17, color: [C.blue, '#B5B1A9', '#E8590C', C.muted5, C.muted5][i], width: 18 }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                  <div style={{ marginTop: 3, fontSize: 11, color: C.muted5 }}>♡ {c.likes} · 💬 {c.comments}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 16, border: `1px solid ${C.borderB}`, background: C.cardBlue, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Cagnotte soutien créateur</div>
          <div className="font-display" style={{ marginTop: 10, fontSize: 28, color: C.blueLt }}>142 €</div>
          <div style={{ marginTop: 6, fontSize: 11.5, color: C.muted6 }}>28 dons · lancé le 12 août</div>
          <div onClick={onOpenSupport} className="btn-hover"
            style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: C.blue, color: C.ink, fontSize: 12.5, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.blueHov)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.blue)}>Soutenir</div>
        </div>

        <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface, padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Ton pseudo anonyme</div>
          <div className="font-mono-um" style={{ marginTop: 10, fontSize: 13, color: C.blueLt }}>{currentUser}</div>
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.55, color: C.muted5 }}>Généré automatiquement. Personne ne voit ton identité réelle.</div>
          <div onClick={onRegenHandle} className="btn-hover"
            style={{ marginTop: 12, padding: '9px 14px', borderRadius: 9, border: `1px solid ${C.borderB2}`, fontSize: 12, fontWeight: 700, color: C.textM2, textAlign: 'center', cursor: 'pointer' }}>Changer de pseudo</div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   💬 THREAD SCREEN
   ============================================================ */
const ThreadScreen = ({ post, goto, dispatch, currentUser }) => {
  const [draft, setDraft] = useState('')
  if (!post) return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 24px 0' }}>
      <div onClick={() => goto('community')} style={{ fontSize: 13, fontWeight: 700, color: C.muted4, cursor: 'pointer' }}>← Espace Communauté</div>
      <div style={{ marginTop: 24, color: C.muted5 }}>Fil introuvable.</div>
    </div>
  )
  const submit = () => {
    if (!draft.trim()) return
    dispatch({ type: 'REPLY', postId: post.id, author: currentUser, text: draft.trim() })
    setDraft('')
  }
  const liked = post.likedBy.includes(currentUser)
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '26px 24px 0' }}>
      <div onClick={() => goto('community')} style={{ fontSize: 13, fontWeight: 700, color: C.muted4, cursor: 'pointer' }}>← Espace Communauté</div>
      <div style={{ marginTop: 20, borderRadius: 16, border: `1px solid ${C.borderB}`, background: C.cardBlue, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 999, background: post.avatar }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{post.author}</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted6 }}>{post.time}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 19, lineHeight: 1.55, color: C.text }}>{post.text}</div>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.borderB}`, display: 'flex', alignItems: 'center', gap: 26 }}>
          <div onClick={() => dispatch({ type: 'LIKE', postId: post.id, user: currentUser })} style={{ fontSize: 13, fontWeight: 800, color: liked ? C.red : C.muted5, cursor: 'pointer' }}>♡ {post.likes}{liked ? ' Aimé' : ''}</div>
          <div style={{ fontSize: 13, color: C.muted5 }}>💬 {post.replies.length} réponses</div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Répondre à ce post…"
          style={{ flex: 1, padding: '13px 16px', borderRadius: 999, border: `1px solid ${C.borderB2}`, background: C.cardInDk, color: C.text, fontSize: 14, outline: 'none' }} />
        <Btn onClick={submit} style={{ borderRadius: 999 }}>Répondre</Btn>
      </div>
      <div style={{ marginTop: 18, display: 'grid' }}>
        {post.replies.map((r) => (
          <div key={r.id} style={{ borderBottom: `1px solid #16161B`, padding: '16px 2px', display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: r.avatar }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{r.author}</div>
                <div style={{ fontSize: 11.5, color: C.muted6 }}>· {r.time}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 14.5, lineHeight: 1.6, color: C.textM }}>{r.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   🚀 REFERRAL SCREEN
   ============================================================ */
const ReferralScreen = ({ currentUser, onCopy, refCount, refClicks, affiliateUnlocked, onOpenSupport }) => {
  const refLink = `https://umbra.site/?ref=${currentUser.replace('@', '').toLowerCase()}`
  const shareX = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Découvre UMBRA, le nouveau manga de Sow Wele : " + refLink)}`
  const shareWa = `https://wa.me/?text=${encodeURIComponent("UMBRA — le manga de Sow Wele : " + refLink)}`
  const shareMail = `mailto:?subject=${encodeURIComponent("UMBRA — manga de Sow Wele")}&body=${encodeURIComponent(refLink)}`

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 0' }}>
      <div className="font-display" style={{ fontSize: 'clamp(28px, 6vw, 34px)' }}>Parrainage</div>
      <div style={{ marginTop: 8, fontSize: 14, color: C.muted4, lineHeight: 1.6 }}>Partage ton lien. Le <span style={{ color: C.blueLt, fontWeight: 700 }}>Tome 3</span> se débloque automatiquement dès qu'une personne ouvre ton lien.</div>

      <div style={{ marginTop: 26, borderRadius: 18, border: `1px solid ${C.borderB2}`, background: 'linear-gradient(120deg, #0B1520, #0C0C0F)', padding: 26 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: C.muted6 }}>TON LIEN</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="font-mono-um" style={{ flex: 1, minWidth: 260, padding: '14px 16px', borderRadius: 11, border: `1px solid ${C.borderB3}`, background: C.surfaceD, fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLink}</div>
          <Btn onClick={() => onCopy(refLink)}>Copier</Btn>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={shareX} target="_blank" rel="noreferrer" style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.borderB3}`, fontSize: 12.5, fontWeight: 700, color: C.textM2, textDecoration: 'none' }}>Partager sur X</a>
          <a href={shareWa} target="_blank" rel="noreferrer" style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.borderB3}`, fontSize: 12.5, fontWeight: 700, color: C.textM2, textDecoration: 'none' }}>WhatsApp</a>
          <a href={shareMail} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.borderB3}`, fontSize: 12.5, fontWeight: 700, color: C.textM2, textDecoration: 'none' }}>E-mail</a>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface2, padding: 18 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '.12em', color: C.muted6 }}>FILLEULS</div>
          <div className="font-display" style={{ marginTop: 8, fontSize: 30 }}>{refCount}</div>
        </div>
        <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface2, padding: 18 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '.12em', color: C.muted6 }}>CLICS SUR TON LIEN</div>
          <div className="font-display" style={{ marginTop: 8, fontSize: 30 }}>{refClicks}</div>
        </div>
        <div style={{ borderRadius: 14, border: `1px solid ${C.border}`, background: C.surface2, padding: 18 }}>
          <div style={{ fontSize: 10.5, letterSpacing: '.12em', color: C.muted6 }}>TOME 3</div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800, color: affiliateUnlocked ? C.green : C.muted5 }}>
            {affiliateUnlocked ? 'DÉBLOQUÉ' : 'À DÉBLOQUER (1 filleul)'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, borderRadius: 18, border: `1px solid ${C.borderB}`, background: 'linear-gradient(120deg, #0B1520, #0C0C0F)', padding: 26 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.12em', color: C.muted6 }}>CAGNOTTE — SOUTIEN CRÉATEUR</div>
            <div className="font-display" style={{ marginTop: 10, fontSize: 46, color: C.blueLt, lineHeight: 1 }}>142 €</div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted4 }}>28 dons cumulés</div>
          </div>
          <div style={{ flex: 1 }} />
          <Btn onClick={onOpenSupport}>Participer à la cagnotte</Btn>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   ✅ SUCCESS SCREEN
   ============================================================ */
const SuccessScreen = ({ goto, tomeBought }) => (
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 999, background: C.blueDk, color: '#EAF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>✓</div>
      <div>
        <div className="font-display" style={{ fontSize: 'clamp(24px, 6vw, 32px)', lineHeight: 1.1 }}>Paiement confirmé</div>
        <div style={{ marginTop: 6, fontSize: 13, color: C.muted4 }}>{tomeBought ? `Accès accordé au ${tomeBought.title}` : 'Ton pack est activé'}</div>
      </div>
    </div>
    <div onClick={() => goto('library')} className="btn-hover"
      style={{ marginTop: 26, padding: 18, borderRadius: 14, background: C.blue, color: C.ink, fontSize: 15.5, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.blueHov)}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.blue)}>Lire directement sur le site</div>
    <div style={{ marginTop: 8, fontSize: 12, color: C.muted6, textAlign: 'center' }}>Accès instantané. Le tome reste dans ta bibliothèque à vie.</div>
  </div>
)

/* ============================================================
   💳 PAYWALL MODAL
   ============================================================ */
const PaywallModal = ({ open, tome, onClose, onPay, onCopy, currentUser, mode = 'paid' }) => {
  const [choice, setChoice] = useState('single')
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  useEffect(() => { if (open) { setLoading(false); setChoice('single'); setCardNumber(''); setCardExp(''); setCardCvc('') } }, [open, tome])

  const pay = () => {
    if (!cardNumber || !cardExp || !cardCvc) { return }
    setLoading(true)
    setTimeout(() => { setLoading(false); onPay(tome, choice) }, 1200)
  }

  const refLink = `https://umbra.site/?ref=${currentUser.replace('@', '').toLowerCase()}`

  const offers = [
    { key: 'single', title: `${tome?.title || 'Ce tome'}`, sub: 'Accès immédiat et à vie', price: eur(tome?.price || 3.99) },
    { key: 'pack', title: 'Pack intégral (7 tomes)', sub: 'Économise 40%', price: '19,99 €' },
  ]

  return (
    <Modal open={open} onClose={onClose} width={460}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: C.muted6 }}>{mode === 'soon' ? 'À VENIR' : 'PAYWALL — DÉBLOQUER'}</div>
        <div style={{ flex: 1 }} />
        <div onClick={onClose} style={{ fontSize: 18, color: C.muted6, cursor: 'pointer' }}>✕</div>
      </div>
      <div className="font-display" style={{ marginTop: 12, fontSize: 25 }}>{mode === 'soon' ? 'Ce tome n\'est pas encore sorti' : `Débloque le ${tome?.title}`}</div>
      <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: C.muted4 }}>
        {mode === 'soon' ? "Suis Sow Wele sur X pour recevoir les dates de sortie et un rappel à la parution." : "Paiement sécurisé Stripe. Accès à vie et sans DRM."}
      </div>

      {mode === 'paid' && (
        <>
          <div style={{ marginTop: 18, display: 'grid', gap: 9 }}>
            {offers.map((of) => {
              const sel = choice === of.key
              return (
                <div key={of.key} onClick={() => setChoice(of.key)}
                  style={{ borderRadius: 12, border: `1px solid ${sel ? C.blue : C.borderB2}`, background: sel ? C.cardBlue2 : C.surfaceD, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 17, height: 17, borderRadius: 999, border: `2px solid ${sel ? C.blue : C.muted6}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: 999, background: sel ? C.blueLt : 'transparent' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{of.title}</div>
                    <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted5 }}>{of.sub}</div>
                  </div>
                  <div className="font-display" style={{ fontSize: 18, color: C.blueLt, whiteSpace: 'nowrap' }}>{of.price}</div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>NUMÉRO DE CARTE</div>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242"
                className="font-mono-um" style={{ marginTop: 6, width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 13.5, outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>EXPIRATION</div>
                <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/AA"
                  className="font-mono-um" style={{ marginTop: 6, width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 13.5, outline: 'none' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>CVC</div>
                <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123"
                  className="font-mono-um" style={{ marginTop: 6, width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 13.5, outline: 'none' }} />
              </div>
            </div>
          </div>

          <div onClick={pay} className="btn-hover"
            style={{ marginTop: 18, padding: 15, borderRadius: 12, background: loading ? C.borderB3 : C.blue, color: loading ? C.muted4 : C.ink, fontSize: 14, fontWeight: 800, textAlign: 'center', cursor: loading ? 'default' : 'pointer' }}>
            {loading ? 'Traitement…' : `Payer ${choice === 'pack' ? '19,99 €' : eur(tome?.price || 3.99)}`}
          </div>
          <div style={{ marginTop: 12, borderRadius: 11, border: `1px solid ${C.borderB}`, background: C.cardInDk, padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 13, color: C.blueLt }}>🔒</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.6, color: C.muted4 }}>Transaction sécurisée par <span style={{ color: C.text, fontWeight: 700 }}>Stripe</span> — apparaît sous le libellé <span className="font-mono-um" style={{ color: C.textM2 }}>UMBRA</span> sur votre relevé bancaire.</div>
          </div>

          {/* AFFILIATION */}
          <div style={{ marginTop: 18, borderRadius: 12, border: `1px solid #1E4A6B`, background: '#0A1520', padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.blueLt }}>Ou débloque-le gratuitement</div>
            <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.6, color: C.muted4 }}>Invite 1 personne à découvrir UMBRA. Dès qu'elle ouvre ton lien, le Tome 3 se débloque.</div>
            <div className="font-mono-um" style={{ marginTop: 12, padding: '11px 13px', borderRadius: 9, background: '#06101A', border: `1px solid #1E4A6B`, fontSize: 11.5, color: C.textM2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLink}</div>
            <div onClick={() => onCopy(refLink)} style={{ marginTop: 10, padding: 11, borderRadius: 10, border: `1px solid ${C.blue}`, color: C.blueLt, fontSize: 12.5, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}>Copier le lien</div>
          </div>
        </>
      )}

      {mode === 'soon' && (
        <>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ marginTop: 18, display: 'block', padding: 15, borderRadius: 12, background: C.blue, color: C.ink, fontSize: 13.5, fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}>Voir les dates de sortie sur X</a>
        </>
      )}

      <div className="font-mono-um" style={{ marginTop: 14, fontSize: 10.5, color: C.muted7, textAlign: 'center', lineHeight: 1.7 }}>Paiement simulé — brancher Stripe Checkout ici.</div>
    </Modal>
  )
}

/* ============================================================
   ♥ SUPPORT MODAL
   ============================================================ */
const SupportModal = ({ open, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const presets = ['3', '5', '10', '20']
  useEffect(() => { if (open) { setAmount(''); setLoading(false) } }, [open])
  const confirm = () => {
    const n = Number(amount)
    if (!n || n <= 0) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onConfirm(n) }, 900)
  }
  return (
    <Modal open={open} onClose={onClose} width={420} zIndex={92}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: C.muted6 }}>CAGNOTTE — SOUTIEN CRÉATEUR</div>
        <div style={{ flex: 1 }} />
        <div onClick={onClose} style={{ fontSize: 18, color: C.muted6, cursor: 'pointer' }}>✕</div>
      </div>
      <div className="font-display" style={{ marginTop: 12, fontSize: 24 }}>Donne ce que tu veux</div>
      <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6, color: C.muted4 }}>Le montant est libre. Chaque don s'ajoute au total public de la cagnotte.</div>
      <div style={{ marginTop: 18, display: 'flex', gap: 9 }}>
        {presets.map((p) => (
          <div key={p} onClick={() => setAmount(p)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${amount === p ? C.blue : C.borderB2}`, background: amount === p ? C.cardBlue2 : C.surfaceD, color: amount === p ? C.blueLt : C.text, fontSize: 14, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}>{p} €</div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>MONTANT LIBRE (€)</div>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex. 7" type="number" min="1"
          className="font-mono-um" style={{ marginTop: 6, width: '100%', padding: '13px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 15, outline: 'none' }} />
      </div>
      <div onClick={confirm} style={{ marginTop: 18, padding: 14, borderRadius: 12, background: loading ? C.borderB3 : C.blue, color: loading ? C.muted4 : C.ink, fontSize: 14, fontWeight: 800, textAlign: 'center', cursor: loading ? 'default' : 'pointer' }}>{loading ? 'Traitement…' : `Donner ${amount || '0'} €`}</div>
    </Modal>
  )
}

/* ============================================================
   🔐 AUTH MODAL
   ============================================================ */
const AuthModal = ({ open, onClose, onSignIn, isSignedIn, accountEmail, onSignOut, currentUser }) => {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  useEffect(() => { if (open) { setMode('signin'); setEmail(''); setPass('') } }, [open])
  const submit = () => {
    if (!email || !pass) return
    onSignIn(email, mode === 'signin' ? 'password' : 'signup')
  }
  return (
    <Modal open={open} onClose={onClose} width={420} zIndex={94}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', color: C.muted6 }}>COMPTE UMBRA</div>
        <div style={{ flex: 1 }} />
        <div onClick={onClose} style={{ fontSize: 18, color: C.muted6, cursor: 'pointer' }}>✕</div>
      </div>

      {isSignedIn ? (
        <>
          <div className="font-display" style={{ marginTop: 14, fontSize: 22 }}>Mon compte</div>
          <div style={{ marginTop: 16, borderRadius: 12, border: `1px solid ${C.borderB}`, background: C.cardInDk, padding: 16, display: 'grid', gap: 7 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{accountEmail}</div>
            <div style={{ fontSize: 12, color: C.muted5 }}>Connecté par mot de passe</div>
            <div style={{ fontSize: 12, color: C.blueLt }}>Lecteur</div>
            <div style={{ fontSize: 12, color: C.muted5 }}>Pseudo public : {currentUser}</div>
          </div>
          <div onClick={onSignOut} style={{ marginTop: 16, padding: 14, borderRadius: 12, border: `1px solid ${C.borderB3}`, color: C.textM2, fontSize: 13.5, fontWeight: 700, textAlign: 'center', cursor: 'pointer' }}>Se déconnecter</div>
        </>
      ) : (
        <>
          <div className="font-display" style={{ marginTop: 14, fontSize: 23 }}>{mode === 'signin' ? 'Se connecter' : 'Créer un compte'}</div>
          <div style={{ marginTop: 9, fontSize: 13, lineHeight: 1.6, color: C.muted4 }}>Un compte sert à retrouver tes tomes achetés, commenter et suivre la communauté.</div>
          <div onClick={() => onSignIn('user@google.example', 'google')} style={{ marginTop: 18, padding: 14, borderRadius: 12, background: C.text, color: '#11151A', fontSize: 13.5, fontWeight: 800, textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div className="font-display" style={{ fontSize: 15, color: '#1A73E8' }}>G</div>
            <div>Continuer avec Google</div>
          </div>
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: C.borderB }} />
            <div style={{ fontSize: 11, color: C.muted7 }}>ou</div>
            <div style={{ flex: 1, height: 1, background: C.borderB }} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>E-MAIL</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com"
                style={{ marginTop: 6, width: '100%', padding: '13px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 13.5, outline: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.12em', color: C.muted6 }}>MOT DE PASSE</div>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••"
                style={{ marginTop: 6, width: '100%', padding: '13px 14px', borderRadius: 10, border: `1px solid ${C.borderB2}`, background: C.surfaceD, color: C.text, fontSize: 13.5, outline: 'none' }} />
            </div>
          </div>
          <div onClick={submit} style={{ marginTop: 16, padding: 15, borderRadius: 12, background: email && pass ? C.blue : C.borderB3, color: email && pass ? C.ink : C.muted4, fontSize: 13.5, fontWeight: 800, textAlign: 'center', cursor: email && pass ? 'pointer' : 'default' }}>
            {mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
          </div>
          <div onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: C.blueLt, textAlign: 'center', cursor: 'pointer' }}>
            {mode === 'signin' ? 'Créer un compte à la place' : 'J\'ai déjà un compte'}
          </div>
        </>
      )}
    </Modal>
  )
}

/* ============================================================
   🍪 CONSENT BANNER
   ============================================================ */
const ConsentBanner = ({ show, onEssential, onAll }) => {
  if (!show) return null
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 96, padding: 12, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(880px, 100%)', borderRadius: 16, border: `1px solid ${C.borderB2}`, background: 'rgba(11,14,18,.97)', backdropFilter: 'blur(12px)', padding: 20, boxShadow: '0 18px 60px rgba(0,0,0,.6)', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Cookies et publicité</div>
          <div style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.65, color: C.muted4 }}>UMBRA utilise des cookies essentiels au fonctionnement du site, et des cookies publicitaires Google AdSense pour financer la série. Tu peux refuser la publicité personnalisée à tout moment.</div>
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', flex: '1 1 240px' }}>
          <div onClick={onEssential} style={{ flex: 1, minWidth: 130, padding: '13px 14px', borderRadius: 11, border: `1px solid ${C.borderB3}`, color: C.textM2, fontSize: 12.5, fontWeight: 700, textAlign: 'center', cursor: 'pointer' }}>Essentiels seulement</div>
          <div onClick={onAll} style={{ flex: 1, minWidth: 130, padding: '13px 14px', borderRadius: 11, background: C.blue, color: C.ink, fontSize: 12.5, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}>Tout accepter</div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   🦶 FOOTER
   ============================================================ */
const Footer = ({ goto, onOpenConsent }) => (
  <div style={{ maxWidth: 1120, margin: '56px auto 0', padding: '26px 24px 0', borderTop: `1px solid #16161B` }}>
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 220px', minWidth: 200 }}>
        <div className="font-display" style={{ fontSize: 14, letterSpacing: '.14em' }}>UMBRA</div>
        <div style={{ marginTop: 8, fontSize: 12, color: C.muted7, lineHeight: 1.7 }}>Manga original signé Sow Wele. Lecture en ligne, communauté ouverte, monétisation douce.</div>
      </div>
      <div style={{ flex: '0 1 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: '.14em', color: C.muted8 }}>INFORMATIONS LÉGALES</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Mentions légales', 'CGV', 'Politique de confidentialité'].map((label) => (
            <div key={label} style={{ fontSize: 12.5, color: C.muted5, cursor: 'pointer' }}>{label}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: '0 1 auto' }}>
        <div style={{ fontSize: 10, letterSpacing: '.14em', color: C.muted8 }}>CRÉATEUR</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div onClick={() => goto('referral')} style={{ fontSize: 12.5, color: C.muted5, cursor: 'pointer' }}>Parrainage</div>
          <div onClick={onOpenConsent} style={{ fontSize: 12.5, color: C.muted5, cursor: 'pointer' }}>Préférences cookies</div>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid #131317`, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
      <div className="font-mono-um" style={{ fontSize: 10.5, color: C.muted9 }}>Paiements traités par Stripe · Publicité Google AdSense</div>
      <div style={{ flex: 1 }} />
      <div className="font-mono-um" style={{ fontSize: 10.5, color: C.muted9 }}>© 2026 UMBRA · Sow Wele</div>
    </div>
  </div>
)

/* ============================================================
   🔄 POSTS REDUCER
   ============================================================ */
const postsReducer = (state, action) => {
  switch (action.type) {
    case 'POST':
      return [
        { id: uid(), author: action.author, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], text: action.text, time: 'à l\'instant', likes: 0, likedBy: [], isTheory: action.isTheory, replies: [] },
        ...state,
      ]
    case 'LIKE':
      return state.map((p) => {
        if (p.id !== action.postId) return p
        const liked = p.likedBy.includes(action.user)
        return { ...p, likes: p.likes + (liked ? -1 : 1), likedBy: liked ? p.likedBy.filter((u) => u !== action.user) : [...p.likedBy, action.user] }
      })
    case 'REPLY':
      return state.map((p) => p.id !== action.postId ? p : { ...p, replies: [...p.replies, { id: uid(), author: action.author, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], text: action.text, time: 'à l\'instant', likes: 0, likedBy: [] }] })
    default: return state
  }
}

/* ============================================================
   🚀 APP
   ============================================================ */
export default function App() {
  const [view, setView] = useState('home')
  const [threadId, setThreadId] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => handleGen())
  const [search, setSearch] = useState('')

  const [posts, dispatchPosts] = useReducer(postsReducer, INITIAL_POSTS)
  const [sort, setSort] = useState('popular')

  // Reader
  const [readerTome, setReaderTome] = useState(null)
  const [readerChapter, setReaderChapter] = useState(null)
  const [mode, setMode] = useState('paged')
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(0.8)
  const [bright, setBright] = useState(100)
  const [chapterComments, setChapterComments] = useState(mkChapterComments(4))

  // Unlocked tomes
  const [unlocked, setUnlocked] = useState([1])
  const [affiliateUnlocked, setAffiliateUnlocked] = useState(false)
  const [refCount, setRefCount] = useState(0)
  const [refClicks, setRefClicks] = useState(0)

  // Auth
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')

  // Modals
  const [showPaywall, setShowPaywall] = useState({ open: false, tome: null, mode: 'paid' })
  const [showSupport, setShowSupport] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showConsent, setShowConsent] = useState(true)

  // Toast
  const [toast, setToast] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const showToast = (m) => { setToast(m); setToastShow(true); setTimeout(() => setToastShow(false), 2400) }

  // Meta
  const meta = { reads: 378000, likes: 24500, videoViews: 89200 }

  // Video
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const togglePlay = () => {
    const v = videoRef.current
    setPlaying((p) => {
      const next = !p
      if (v) { try { next ? v.play() : v.pause() } catch {} }
      return next
    })
  }

  // TOMES with unlock state
  const tomesWithState = useMemo(() => TOMES.map((t) => ({
    ...t,
    locked: !t.released || (t.paid && !unlocked.includes(t.id) && !(t.id === 3 && affiliateUnlocked)),
  })), [unlocked, affiliateUnlocked])

  // Handlers
  const goto = (v, arg = null) => {
    if (v === 'thread') setThreadId(arg)
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onTomeClick = (t) => {
    const tome = tomesWithState.find((x) => x.id === t.id)
    if (!tome.released) { setShowPaywall({ open: true, tome, mode: 'soon' }); return }
    if (tome.locked) { setShowPaywall({ open: true, tome, mode: 'paid' }); return }
    // ouvrir premier chapitre
    const ch = CHAPTERS_BY_TOME[tome.id][0]
    setReaderTome(tome); setReaderChapter(ch); setPage(1); setChapterComments(mkChapterComments(4))
    goto('reader')
  }

  const onChapterClick = (t, ch) => {
    const tome = tomesWithState.find((x) => x.id === t.id)
    if (tome.locked) { setShowPaywall({ open: true, tome, mode: tome.released ? 'paid' : 'soon' }); return }
    setReaderTome(tome); setReaderChapter(ch); setPage(1); setChapterComments(mkChapterComments(4))
    goto('reader')
  }

  const onNextChapter = () => {
    if (!readerTome || !readerChapter) return
    const list = CHAPTERS_BY_TOME[readerTome.id]
    const i = list.findIndex((c) => c.id === readerChapter.id)
    if (i < list.length - 1) {
      setReaderChapter(list[i + 1]); setPage(1); setChapterComments(mkChapterComments(4))
    } else {
      goto('library')
      showToast('Fin du tome — retour à la bibliothèque')
    }
  }

  const onCopyLink = (url) => {
    try {
      navigator.clipboard?.writeText(url)
      showToast('Lien copié !')
      setRefClicks((c) => c + 1)
      if (!affiliateUnlocked) {
        setAffiliateUnlocked(true)
        setRefCount((c) => c + 1)
        setTimeout(() => showToast('🎉 Tome 3 débloqué grâce à ton lien !'), 1400)
      }
    } catch { showToast(url) }
  }

  const onPay = (tome, choice) => {
    if (choice === 'pack') {
      setUnlocked([1, 2, 3, 4, 5, 6, 7])
      showToast('🔥 Pack intégral activé !')
    } else if (tome) {
      setUnlocked((u) => (u.includes(tome.id) ? u : [...u, tome.id]))
      showToast(`Tome ${tome.id} débloqué !`)
    }
    setShowPaywall({ open: false, tome: null, mode: 'paid' })
    goto('success')
  }

  const onSupportConfirm = (amount) => {
    setShowSupport(false)
    showToast(`Merci pour ton don de ${amount} € !`)
  }

  const onSignIn = (email, method) => {
    setIsSignedIn(true); setAccountEmail(email); setShowAuth(false); showToast('Connecté à UMBRA')
  }
  const onSignOut = () => { setIsSignedIn(false); setAccountEmail(''); showToast('Déconnecté') }

  const onCommentChapter = (text) => {
    setChapterComments((cs) => [{ id: uid(), author: currentUser, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], badge: 'LECTEUR', text, time: 'à l\'instant', likes: 0, likedBy: [], replies: [] }, ...cs])
  }
  const onLikeChapterComment = (id) => {
    setChapterComments((cs) => cs.map((c) => {
      if (c.id !== id) return c
      const liked = c.likedBy.includes(currentUser)
      return { ...c, likes: c.likes + (liked ? -1 : 1), likedBy: liked ? c.likedBy.filter((u) => u !== currentUser) : [...c.likedBy, currentUser] }
    }))
  }

  const currentThread = threadId ? posts.find((p) => p.id === threadId) : null

  const renderScreen = () => {
    switch (view) {
      case 'home': return <HomeScreen goto={goto} tomes={tomesWithState} onTomeClick={onTomeClick} posts={posts} videoRef={videoRef} playing={playing} togglePlay={togglePlay} onSupport={() => setShowSupport(true)} meta={meta} />
      case 'library': return <LibraryScreen tomes={tomesWithState} onTomeClick={onTomeClick} onChapterClick={onChapterClick} />
      case 'reader': return <ReaderScreen goto={goto} tome={readerTome} chapter={readerChapter} mode={mode} setMode={setMode} page={page} setPage={setPage} zoom={zoom} setZoom={setZoom} bright={bright} setBright={setBright} comments={chapterComments} onComment={onCommentChapter} onLikeComment={onLikeChapterComment} currentUser={currentUser} onOpenSupport={() => setShowSupport(true)} onNextChapter={onNextChapter} />
      case 'community': return <CommunityScreen posts={posts} dispatch={dispatchPosts} currentUser={currentUser} goto={goto} sort={sort} setSort={setSort} onOpenSupport={() => setShowSupport(true)} onRegenHandle={() => { setCurrentUser(handleGen()); showToast('Nouveau pseudo généré') }} />
      case 'thread': return <ThreadScreen post={currentThread} goto={goto} dispatch={dispatchPosts} currentUser={currentUser} />
      case 'referral': return <ReferralScreen currentUser={currentUser} onCopy={onCopyLink} refCount={refCount} refClicks={refClicks} affiliateUnlocked={affiliateUnlocked} onOpenSupport={() => setShowSupport(true)} />
      case 'success': return <SuccessScreen goto={goto} tomeBought={readerTome} />
      default: return <HomeScreen goto={goto} tomes={tomesWithState} onTomeClick={onTomeClick} posts={posts} videoRef={videoRef} playing={playing} togglePlay={togglePlay} onSupport={() => setShowSupport(true)} meta={meta} />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, position: 'relative' }}>
      <LeftDock onSupport={() => setShowSupport(true)} />

      <Header view={view} goto={goto} handle={currentUser} isSignedIn={isSignedIn} onOpenAuth={() => setShowAuth(true)} search={search} onSearch={setSearch} />

      <div style={{ minHeight: 'calc(100vh - 200px)', padding: '0 0 80px' }}>
        {renderScreen()}
      </div>

      <Footer goto={goto} onOpenConsent={() => setShowConsent(true)} />

      <PaywallModal open={showPaywall.open} tome={showPaywall.tome} mode={showPaywall.mode} onClose={() => setShowPaywall({ open: false, tome: null, mode: 'paid' })} onPay={onPay} onCopy={onCopyLink} currentUser={currentUser} />
      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} onConfirm={onSupportConfirm} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSignIn={onSignIn} isSignedIn={isSignedIn} accountEmail={accountEmail} onSignOut={onSignOut} currentUser={currentUser} />
      <ConsentBanner show={showConsent} onEssential={() => { setShowConsent(false); showToast('Cookies essentiels uniquement') }} onAll={() => { setShowConsent(false); showToast('Tous les cookies acceptés') }} />

      <Toast message={toast} show={toastShow} />
    </div>
  )
}
