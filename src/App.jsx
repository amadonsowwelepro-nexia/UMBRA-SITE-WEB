import React, { useState, useRef, useMemo, useReducer, useEffect } from 'react'
import {
  Play, BookOpen, Heart, MessageCircle, Share2, Twitter,
  ChevronRight, ChevronLeft, Lock, Send, Home, Users, Sparkles,
  Pause, CheckCheck, X as XIcon, CreditCard, Loader2, Rocket, Flame,
  Search, ArrowRight, Eye, TrendingUp, Clock, Star, Bell, Globe,
} from 'lucide-react'

/* ============================================================
   ⚙️  DATA
   ============================================================ */
const TOMES = [
  { id: 1, chapter: 12, releasedAt: 'il y a 2 j', views: '124K', gradient: 'from-amber-600 via-orange-700 to-red-900' },
  { id: 2, chapter: 24, releasedAt: 'il y a 5 j', views: '98K',  gradient: 'from-indigo-700 via-purple-800 to-slate-900' },
  { id: 3, chapter: 36, releasedAt: 'il y a 2 h', views: '156K', gradient: 'from-rose-600 via-pink-700 to-purple-900' },
  { id: 4, chapter: 48, releasedAt: 'à venir',   views: '—',    gradient: 'from-emerald-700 via-teal-800 to-cyan-900' },
  { id: 5, chapter: 60, releasedAt: 'à venir',   views: '—',    gradient: 'from-fuchsia-700 via-purple-800 to-violet-900' },
  { id: 6, chapter: 72, releasedAt: 'à venir',   views: '—',    gradient: 'from-orange-700 via-red-800 to-rose-900' },
  { id: 7, chapter: 84, releasedAt: 'à venir',   views: '—',    gradient: 'from-slate-600 via-zinc-800 to-black' },
].map((t) => ({
  ...t,
  title: `Tome ${t.id}`,
  subtitle: `Chapitres ${(t.id - 1) * 12 + 1}–${t.id * 12}`,
  isNew: t.id === 3,
  isRead: t.id === 1,
}))

const DEFAULT_UNLOCKED = [1, 2, 3]

const RANKING = [
  { tomeId: 3, label: 'Tome 3 · Le Royaume Fracturé', views: '156K' },
  { tomeId: 1, label: 'Tome 1 · Au Seuil des Mondes', views: '124K' },
  { tomeId: 2, label: 'Tome 2 · La Marche du Silence', views: '98K' },
  { tomeId: 4, label: 'Tome 4 · Les Cendres d\'Ehnar',  views: '78K' },
  { tomeId: 5, label: 'Tome 5 · Lame d\'Ombre',         views: '54K' },
]

const FILTERS = ['Tout', 'Nouveaux', 'Tendance', 'Action', 'Fantasy', 'Drama', 'Mystère']

const MANGA_META = {
  title: 'MONDES',
  author: 'Sow Wele',
  status: 'En Cours',
  type: 'Manga / Shōnen',
  year: '2026',
  publisher: 'Indépendant',
  categories: ['Action', 'Fantasy', 'Aventure', 'Drama', 'Mystère'],
  synopsis:
    "Dans un univers où plusieurs réalités cohabitent, un jeune homme découvre qu'il peut traverser les frontières entre les mondes. Alors qu'une menace ancienne s'éveille, il devra apprendre à maîtriser ce pouvoir avant que les royaumes ne s'effondrent les uns dans les autres. Une fresque épique entre action, mystère et émotions, signée Sow Wele.",
}

const PIRATE_NAMES = [
  'Roger', 'Kuro', 'Shanks', 'Mihawk', 'Ace', 'Buggy', 'Crocodile',
  'Doflamingo', 'Kaido', 'Whitebeard', 'Drake', 'Hawkins', 'Bonney',
  'Bege', 'Apoo', 'Urouge', 'Killer', 'Marco', 'Jinbei', 'Law',
]
const generatePiratePseudo = () => {
  const n = PIRATE_NAMES[Math.floor(Math.random() * PIRATE_NAMES.length)]
  return `@Pirate${n}_${Math.floor(Math.random() * 999)}`
}

const INITIAL_COMMENTS = [
  {
    id: 1, author: '@PirateRoger_777',
    text: "L'opening m'a donné des frissons ! Le worldbuilding de MONDES est juste incroyable, hâte de voir la suite 🔥",
    likes: 234, likedBy: [],
    replies: [{ id: 11, author: '@PirateKuro_42', text: "Pareil, j'ai relu 3 fois le chapitre 1", likes: 12, likedBy: [], replies: [], time: 'il y a 2h' }],
    time: 'il y a 4h',
  },
  {
    id: 2, author: '@PirateMihawk_19',
    text: "Sow Wele est un génie. Le style graphique mêlé à cette ambiance sombre, ça change vraiment du shonen classique.",
    likes: 187, likedBy: [], replies: [], time: 'il y a 6h',
  },
  {
    id: 3, author: '@PirateAce_88',
    text: "Quand sort le tome 4 ?? J'ai déjà fini les 3 premiers en une nuit 😭",
    likes: 156, likedBy: [],
    replies: [
      { id: 31, author: '@PirateShanks_01', text: 'Patience jeune padawan', likes: 24, likedBy: [], replies: [], time: 'il y a 1h' },
      { id: 32, author: '@PirateBuggy_33', text: '+1 même état', likes: 8, likedBy: [], replies: [], time: 'il y a 30min' },
    ],
    time: 'il y a 8h',
  },
  {
    id: 4, author: '@PirateDrake_55',
    text: "Le système de magie est tellement bien pensé. On sent qu'il y a une vraie logique derrière.",
    likes: 98, likedBy: [], replies: [], time: 'il y a 12h',
  },
  {
    id: 5, author: '@PirateBonney_77',
    text: "Cet opening avec sa musique m'a rappelé les meilleures intros de l'âge d'or des animés. Du gros boulot.",
    likes: 142, likedBy: [], replies: [], time: 'il y a 15h',
  },
]

const findTome = (id) => TOMES.find((t) => t.id === id)

/* ============================================================
   🎨  ATOMS
   ============================================================ */
const Btn = ({ children, variant = 'primary', className = '', ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-300 active:scale-95 active:duration-100 disabled:opacity-60 disabled:pointer-events-none'
  const v = {
    primary: 'bg-yellow-500 text-black hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/30 px-5 py-2.5',
    ghost:   'border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 px-5 py-2.5',
    dark:    'bg-zinc-800 text-white hover:bg-zinc-700 hover:shadow-lg hover:shadow-yellow-500/10 px-5 py-2.5',
    light:   'bg-white text-black hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/20 px-5 py-2.5',
    icon:    'w-10 h-10 bg-zinc-800 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-full',
  }[variant]
  return <button className={`${base} ${v} ${className}`} {...rest}>{children}</button>
}

const Toast = ({ message, show }) => (
  <div
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
      show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}
  >
    <div className="bg-yellow-500 text-black px-5 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-semibold">
      <CheckCheck className="w-5 h-5" />
      {message}
    </div>
  </div>
)

const SectionHeader = ({ icon: Icon, title, subtitle, onSeeAll }) => (
  <div className="flex items-end justify-between gap-4 mb-4">
    <div className="min-w-0">
      <h2 className="text-white text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />}
        {title}
      </h2>
      {subtitle && <p className="text-zinc-500 text-xs md:text-sm mt-0.5 truncate">{subtitle}</p>}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="group text-yellow-500 text-xs md:text-sm font-semibold inline-flex items-center gap-1 hover:text-yellow-400 transition-all duration-300 flex-shrink-0"
      >
        Voir tout
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    )}
  </div>
)

/* ============================================================
   🪟  MODAL
   ============================================================ */
const Modal = ({ open, onClose, children, maxWidth = 'max-w-4xl' }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-modal-fade overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} my-auto bg-zinc-900 border border-yellow-500/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-yellow-500/10 animate-modal-scale`}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-300 active:scale-90 z-10"
        >
          <XIcon className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

/* ============================================================
   💳  PAYWALL
   ============================================================ */
const PaywallModal = ({ open, tomeId, onClose, onUnlock, onUnlockAll, onShare }) => {
  const [loading, setLoading] = useState(null)
  const [success, setSuccess] = useState(null)
  const [referralUsed, setReferralUsed] = useState(false)

  useEffect(() => {
    if (open) { setLoading(null); setSuccess(null); setReferralUsed(false) }
  }, [open, tomeId])

  const finish = (label, action) => {
    setSuccess(label)
    setTimeout(() => { action(); onClose() }, 1100)
  }

  const mockPay = (kind) => {
    if (loading) return
    setLoading(kind)
    setSuccess(null)
    setTimeout(() => {
      setLoading(null)
      if (kind === 'single' && tomeId) finish('Paiement simulé réussi ! Activation du Tome…', () => onUnlock(tomeId))
      else if (kind === 'pack') finish('Paiement simulé réussi ! Activation du Pack Intégral…', () => onUnlockAll())
    }, 1500)
  }

  const handleAffiliation = () => {
    onShare()
    setReferralUsed(true)
    if (tomeId) setTimeout(() => finish('Lien copié — Tome débloqué grâce à ton invitation !', () => onUnlock(tomeId)), 600)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] mb-2">
          <Lock className="w-3 h-3" /> ACCÈS VERROUILLÉ
        </div>
        <h2 className="text-white text-xl md:text-2xl font-black leading-tight">Choisis ta méthode pour lire la suite</h2>
        <p className="text-zinc-500 text-sm mt-1">{tomeId ? `Tome ${tomeId}` : 'Pack'} · MONDES par Sow Wele</p>
      </div>

      {success && (
        <div className="mt-5 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center font-semibold flex items-center justify-center gap-2">
          <CheckCheck className="w-5 h-5" /> {success}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col">
          <div className="text-[10px] font-black text-green-400 tracking-[0.2em] mb-2">100% GRATUIT</div>
          <h3 className="text-white font-black text-lg leading-tight">Option Parrainage</h3>
          <p className="text-zinc-400 text-sm mt-2 flex-1">
            Débloque ce tome <span className="text-yellow-500 font-semibold">IMMÉDIATEMENT</span> en invitant 1 ami avec ton lien magique.
          </p>
          <Btn variant="ghost" onClick={handleAffiliation} disabled={referralUsed || !tomeId} className="mt-5 w-full">
            {referralUsed ? <><CheckCheck className="w-4 h-4" /> Lien généré</> : <><Rocket className="w-4 h-4" /> Générer mon lien magique</>}
          </Btn>
        </div>

        <div className="relative rounded-xl border-2 border-yellow-500 bg-gradient-to-b from-yellow-500/10 to-zinc-900/60 p-5 flex flex-col shadow-lg shadow-yellow-500/10">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap">
            <Flame className="w-3 h-3" /> LE PLUS POPULAIRE
          </span>
          <div className="text-[10px] font-black text-yellow-500 tracking-[0.2em] mb-2 mt-1">À L'UNITÉ</div>
          <h3 className="text-white font-black text-lg leading-tight">Acheter ce Tome</h3>
          <div className="mt-3 mb-2"><span className="text-white text-4xl font-black">0,99€</span></div>
          <p className="text-zinc-400 text-sm flex-1">Accès immédiat et illimité à ce tome.</p>
          <Btn onClick={() => mockPay('single')} disabled={loading || !tomeId} className="mt-5 w-full">
            {loading === 'single' ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</> : <><CreditCard className="w-4 h-4" /> Débloquer · Stripe / PayPal</>}
          </Btn>
        </div>

        <div className="relative rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 flex flex-col">
          <span className="absolute -top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse">PROMO -30%</span>
          <div className="text-[10px] font-black text-zinc-300 tracking-[0.2em] mb-2">PACK INTÉGRAL</div>
          <h3 className="text-white font-black text-lg leading-tight">Tomes 1 à 7</h3>
          <div className="mt-3 mb-2 flex items-baseline gap-2">
            <span className="text-white text-4xl font-black">4,99€</span>
            <span className="text-zinc-500 line-through text-sm">7,00€</span>
          </div>
          <p className="text-zinc-400 text-sm flex-1">Tout l'univers MONDES débloqué — économise 2,01€.</p>
          <Btn variant="light" onClick={() => mockPay('pack')} disabled={loading} className="mt-5 w-full">
            {loading === 'pack' ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</> : <><Flame className="w-4 h-4" /> Acheter le Pack Complet</>}
          </Btn>
        </div>
      </div>

      <p className="text-center text-zinc-600 text-xs mt-6">Paiement sécurisé · Annulation à tout moment · Soutien direct à l'auteur</p>
    </Modal>
  )
}

/* ============================================================
   🦸  HERO (MangaPlus-style featured banner + video)
   ============================================================ */
const Hero = ({ onRead, onScrollToComments }) => {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const togglePlay = () => {
    const v = videoRef.current
    setPlaying((p) => {
      const next = !p
      if (v) { try { next ? v.play() : v.pause() } catch {} }
      return next
    })
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800">
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(234,179,8,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-8 p-6 md:p-10 lg:p-12 items-center">
        {/* TEXT */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-yellow-500 text-black text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full tracking-wider">
              <Sparkles className="w-3 h-3" /> TENDANCE #1
            </span>
            <span className="text-zinc-500 text-xs">Latest 24h</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500 text-xs">Shōnen / Fantasy</span>
          </div>

          <h1 className="text-white font-black tracking-tight leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-[80px]">
            MONDES
          </h1>
          <p className="mt-3 text-zinc-300 text-sm md:text-base max-w-xl leading-relaxed">
            La fresque épique signée <span className="text-yellow-500 font-semibold">Sow Wele</span>. Quand les royaumes s'effondrent les uns dans les autres, un héros doit traverser les mondes pour les sauver.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-400 inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-yellow-500" /> 378K lectures</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400 inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> 4,9/5</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-400">7 tomes</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Btn onClick={onRead} className="!px-6 !py-3 text-base">
              <BookOpen className="w-5 h-5" /> Lire maintenant
            </Btn>
            <Btn variant="ghost" onClick={onScrollToComments}>
              <MessageCircle className="w-4 h-4" /> Voir les avis
            </Btn>
          </div>
        </div>

        {/* VIDEO */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-black/40 shadow-2xl bg-black mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex flex-col items-center justify-center">
            <div className="text-white/90 text-[10px] tracking-[0.5em] font-bold">MONDES</div>
            <div className="text-yellow-500 text-3xl md:text-4xl font-black mt-1 tracking-wider">OPENING</div>
            <div className="absolute bottom-2 left-3 right-3 text-zinc-600 text-[10px] text-center">
              Dépose ton fichier dans <code className="text-yellow-500">public/opening.mp4</code>
            </div>
          </div>

          <video
            ref={videoRef}
            src="/opening.mp4"
            loop
            playsInline
            muted
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />

          <button
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              playing ? 'bg-transparent opacity-0 hover:opacity-100 hover:bg-black/30' : 'bg-black/30 hover:bg-black/40'
            }`}
            aria-label={playing ? 'Mettre en pause' : 'Lire la vidéo'}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40 transition-transform duration-300 hover:scale-110 active:scale-95">
              {playing ? <Pause className="w-7 h-7 md:w-8 md:h-8 text-black fill-black" /> : <Play className="w-7 h-7 md:w-8 md:h-8 text-black fill-black ml-1" />}
            </div>
          </button>

          {playing && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
              <div className="h-full bg-yellow-500 animate-pulse" style={{ width: '34%' }} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   🏷️  FILTER CHIPS
   ============================================================ */
const FilterChips = ({ active, onChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
    {FILTERS.map((f) => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 active:scale-95 ${
          active === f
            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
        }`}
      >
        {f}
      </button>
    ))}
  </div>
)

/* ============================================================
   🎴  TOME CARD (grid version, MangaPlus style)
   ============================================================ */
const TomeCard = ({ tome, isUnlocked, justUnlocked, onClick }) => (
  <button
    onClick={() => onClick(tome)}
    className={`group text-left w-full transition-all duration-300 hover:-translate-y-1 active:scale-95 active:duration-100 ${justUnlocked ? 'animate-unlock' : ''}`}
  >
    <div className={`relative aspect-[2/3] rounded-md overflow-hidden bg-gradient-to-br ${tome.gradient} shadow-lg group-hover:shadow-xl group-hover:shadow-yellow-500/15 transition-all duration-300 ${!isUnlocked ? 'grayscale-[70%]' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div className="text-white/80 text-[9px] tracking-[0.4em] font-bold">MONDES</div>
          <div>
            <div className="text-white text-5xl md:text-6xl font-black drop-shadow-2xl leading-none">{tome.id}</div>
          </div>
        </div>

        {/* badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          {tome.isNew && isUnlocked && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">NEW</span>
          )}
          {tome.isRead && isUnlocked && (
            <span className="bg-green-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded ml-auto">LU</span>
          )}
        </div>

        {/* lock overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 group-hover:bg-black/35 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/40">
              <Lock className="w-4 h-4 text-black" />
            </div>
          </div>
        )}

        {/* hover read overlay */}
        {isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-3">
            <span className="text-yellow-500 text-xs font-bold inline-flex items-center gap-1">
              <Play className="w-3.5 h-3.5 fill-yellow-500" /> Lire
            </span>
          </div>
        )}
      </div>

      {/* meta */}
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white text-sm md:text-base font-bold truncate">{tome.title}</h3>
          {!isUnlocked && <Lock className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
        </div>
        <div className="flex items-center justify-between text-[11px] md:text-xs text-zinc-500 mt-0.5">
          <span className="truncate">Ch. {tome.chapter}</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" /> {tome.releasedAt}
          </span>
        </div>
      </div>
  </button>
)

/* ============================================================
   📊  LATEST GRID
   ============================================================ */
const LatestGrid = ({ unlocked, justUnlockedId, onTomeClick }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 md:gap-4">
    {TOMES.map((t) => (
      <TomeCard
        key={t.id}
        tome={t}
        isUnlocked={unlocked.includes(t.id)}
        justUnlocked={justUnlockedId === t.id}
        onClick={onTomeClick}
      />
    ))}
  </div>
)

/* ============================================================
   🏆  RANKING
   ============================================================ */
const RankingRow = ({ unlocked, onTomeClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
    {RANKING.map((r, i) => {
      const tome = findTome(r.tomeId)
      const isUnlocked = unlocked.includes(tome.id)
      const rankColor = i === 0 ? 'text-yellow-500' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-zinc-600'
      return (
        <button
          key={r.tomeId}
          onClick={() => onTomeClick(tome)}
          className="group flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-yellow-500/40 hover:bg-zinc-900 transition-all duration-300 active:scale-95 text-left"
        >
          <span className={`${rankColor} text-4xl lg:text-5xl font-black leading-none w-8 lg:w-10 text-center flex-shrink-0 drop-shadow`}>
            {i + 1}
          </span>
          <div className={`relative aspect-[2/3] w-12 lg:w-14 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br ${tome.gradient} ${!isUnlocked ? 'grayscale-[70%]' : ''}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">{tome.id}</div>
            {!isUnlocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Lock className="w-3 h-3 text-yellow-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white text-sm font-bold truncate group-hover:text-yellow-500 transition-colors duration-300">{r.label}</h3>
            <div className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
              <Eye className="w-3 h-3" /> {r.views}
            </div>
          </div>
        </button>
      )
    })}
  </div>
)

/* ============================================================
   📕  ABOUT MONDES (manga detail card)
   ============================================================ */
const AboutSection = ({ onRead, onScrollToComments, onShare }) => (
  <section className="rounded-2xl bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/80 border border-zinc-800 p-6 md:p-8">
    <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-8">
      {/* COVER */}
      <div className="mx-auto md:mx-0 w-44 md:w-full">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-yellow-600 via-amber-700 to-red-900 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-yellow-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_60%)]" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div>
              <div className="text-white/70 text-[10px] tracking-[0.4em] font-bold">SOW WELE</div>
              <div className="text-white text-2xl font-black mt-1">MONDES</div>
            </div>
            <div className="text-white text-7xl font-black drop-shadow-2xl text-right leading-none">1</div>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-400 tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {MANGA_META.status.toUpperCase()}
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500 text-xs">{MANGA_META.type}</span>
        </div>
        <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight">À propos de MONDES</h2>
        <p className="mt-3 text-zinc-300 text-sm md:text-base leading-relaxed">{MANGA_META.synopsis}</p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Auteur', MANGA_META.author],
            ['Année', MANGA_META.year],
            ['Édition', MANGA_META.publisher],
            ['Tomes', '7'],
          ].map(([k, v]) => (
            <div key={k} className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-600 text-[10px] uppercase tracking-wider font-bold">{k}</div>
              <div className="text-white text-sm font-semibold mt-0.5 truncate">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {MANGA_META.categories.map((c) => (
            <span
              key={c}
              className="text-xs px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-yellow-500 hover:text-yellow-500 hover:bg-yellow-500/5 transition-all duration-300 cursor-pointer"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Btn onClick={onRead}><BookOpen className="w-5 h-5" /> Lire le chapitre 1</Btn>
          <Btn variant="ghost" onClick={onScrollToComments}><MessageCircle className="w-4 h-4" /> Voir les avis</Btn>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <Btn variant="icon" className="w-10 h-10"><Twitter className="w-4 h-4" /></Btn>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noreferrer">
            <Btn variant="icon" className="w-10 h-10">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.6 6.3a4.8 4.8 0 0 1-3.8-1.8v9.7a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a3 3 0 1 0 2 2.8V2h2.8a4.8 4.8 0 0 0 3.8 4.3z" />
              </svg>
            </Btn>
          </a>
          <Btn variant="dark" onClick={onShare}><Share2 className="w-4 h-4" /> Partager mon lien</Btn>
        </div>
      </div>
    </div>
  </section>
)

/* ============================================================
   💬  COMMENT
   ============================================================ */
const Comment = ({ c, currentUser, onLike, onReply, depth = 0 }) => {
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const liked = c.likedBy.includes(currentUser)
  const submit = () => {
    if (!text.trim()) return
    onReply(c.id, text.trim())
    setText('')
    setReplying(false)
  }
  return (
    <div className={depth > 0 ? 'ml-6 md:ml-10 pl-4 border-l border-zinc-800' : ''}>
      <div className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-800 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-yellow-500 font-semibold text-sm">{c.author}</span>
          <span className="text-zinc-600 text-xs">{c.time}</span>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <button
            onClick={() => onLike(c.id)}
            className={`inline-flex items-center gap-1.5 transition-all duration-300 active:scale-90 ${liked ? 'text-red-500' : 'text-zinc-500 hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
            <span className="font-semibold">{c.likes}</span>
          </button>
          {depth === 0 && (
            <button onClick={() => setReplying((r) => !r)} className="text-zinc-500 hover:text-yellow-500 transition-all duration-300 inline-flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> Répondre
            </button>
          )}
        </div>
        {replying && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={`Répondre à ${c.author}...`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 transition-all duration-300"
            />
            <Btn onClick={submit} className="!px-3 !py-2"><Send className="w-4 h-4" /></Btn>
          </div>
        )}
      </div>
      {c.replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {c.replies.map((r) => (
            <Comment key={r.id} c={r} currentUser={currentUser} onLike={onLike} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const CommentBox = ({ currentUser, onPost }) => {
  const [text, setText] = useState('')
  const submit = () => {
    if (!text.trim()) return
    onPost(text.trim())
    setText('')
  }
  return (
    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
        <span>Tu publies en tant que <span className="text-yellow-500 font-semibold">{currentUser}</span></span>
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Partage ton ressenti sur MONDES..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 transition-all duration-300"
        />
        <Btn onClick={submit}><Send className="w-4 h-4" /> Publier</Btn>
      </div>
    </div>
  )
}

/* ============================================================
   🏠  HOME
   ============================================================ */
const HomePage = ({ state, dispatch, goto, currentUser, share, unlocked, justUnlockedId, onTomeClick }) => {
  const commentsRef = useRef(null)
  const [filter, setFilter] = useState('Tout')
  const scrollToComments = () => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const topComments = useMemo(() => [...state.comments].sort((a, b) => b.likes - a.likes).slice(0, 3), [state.comments])

  return (
    <div className="space-y-12 md:space-y-16">
      <Hero onRead={() => goto('reader')} onScrollToComments={scrollToComments} />

      <section>
        <SectionHeader
          icon={Sparkles}
          title="Dernières sorties"
          subtitle="Tous les tomes de MONDES — débloque la suite via le paywall"
          onSeeAll={() => goto('reader')}
        />
        <div className="mb-5">
          <FilterChips active={filter} onChange={setFilter} />
        </div>
        <LatestGrid unlocked={unlocked} justUnlockedId={justUnlockedId} onTomeClick={onTomeClick} />
      </section>

      <section>
        <SectionHeader
          icon={TrendingUp}
          title="Top 5 cette semaine"
          subtitle="Mis à jour il y a 2h · classement par lectures"
        />
        <RankingRow unlocked={unlocked} onTomeClick={onTomeClick} />
      </section>

      <AboutSection onRead={() => goto('reader')} onScrollToComments={scrollToComments} onShare={share} />

      <section ref={commentsRef}>
        <SectionHeader
          icon={MessageCircle}
          title="Espace Communauté"
          subtitle={`${state.comments.length} avis · accès libre, pseudo pirate anonyme`}
          onSeeAll={() => goto('community')}
        />
        <CommentBox currentUser={currentUser} onPost={(text) => dispatch({ type: 'POST', text, author: currentUser })} />
        <div className="space-y-3 mt-4">
          {topComments.map((c) => (
            <Comment
              key={c.id} c={c} currentUser={currentUser}
              onLike={(id) => dispatch({ type: 'LIKE', id, user: currentUser })}
              onReply={(parentId, text) => dispatch({ type: 'REPLY', parentId, text, author: currentUser })}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

/* ============================================================
   👥  COMMUNITY
   ============================================================ */
const CommunityPage = ({ state, dispatch, currentUser, goto }) => {
  const [sort, setSort] = useState('top')
  const sorted = useMemo(() => {
    const list = [...state.comments]
    return sort === 'top' ? list.sort((a, b) => b.likes - a.likes) : list.reverse()
  }, [state.comments, sort])
  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => goto('home')} className="text-zinc-500 hover:text-yellow-500 text-sm inline-flex items-center gap-1 transition-all duration-300">
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-white text-3xl md:text-4xl font-black mt-2 tracking-tight">Espace Communauté</h1>
        <p className="text-zinc-500 mt-1">Discute, vote, partage ton ressenti sur l'univers MONDES.</p>
      </div>
      <CommentBox currentUser={currentUser} onPost={(text) => dispatch({ type: 'POST', text, author: currentUser })} />
      <div className="flex items-center gap-1 border-b border-zinc-800">
        {[['top', 'Top Comments'], ['recent', 'Récents']].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`px-4 py-2.5 text-sm font-semibold transition-all duration-300 border-b-2 ${sort === k ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-zinc-500 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {sorted.map((c) => (
          <Comment
            key={c.id} c={c} currentUser={currentUser}
            onLike={(id) => dispatch({ type: 'LIKE', id, user: currentUser })}
            onReply={(parentId, text) => dispatch({ type: 'REPLY', parentId, text, author: currentUser })}
          />
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   📖  READER
   ============================================================ */
const ReaderPage = ({ goto, tomeId }) => (
  <div className="space-y-4">
    <button onClick={() => goto('home')} className="text-zinc-500 hover:text-yellow-500 text-sm inline-flex items-center gap-1 transition-all duration-300">
      <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
    </button>
    <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">MONDES — Tome {tomeId || 1} · Chapitre 1</h1>
    <div className="aspect-[3/4] max-w-2xl mx-auto rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-800 flex flex-col items-center justify-center text-zinc-500">
      <BookOpen className="w-16 h-16 mb-3" />
      <p className="text-sm">Player de scan — à intégrer ici</p>
      <p className="text-xs mt-1 text-zinc-600">(images de pages, navigation ←/→, zoom)</p>
    </div>
  </div>
)

/* ============================================================
   🔄  REDUCER
   ============================================================ */
const commentsReducer = (state, action) => {
  switch (action.type) {
    case 'POST':
      return { ...state, comments: [{ id: Date.now(), author: action.author, text: action.text, likes: 0, likedBy: [], replies: [], time: "à l'instant" }, ...state.comments] }
    case 'LIKE': {
      const toggle = (c) => {
        if (c.id !== action.id) return { ...c, replies: c.replies?.map(toggle) || [] }
        const liked = c.likedBy.includes(action.user)
        return { ...c, likes: c.likes + (liked ? -1 : 1), likedBy: liked ? c.likedBy.filter((u) => u !== action.user) : [...c.likedBy, action.user], replies: c.replies?.map(toggle) || [] }
      }
      return { ...state, comments: state.comments.map(toggle) }
    }
    case 'REPLY': {
      const add = (c) => c.id === action.parentId
        ? { ...c, replies: [...c.replies, { id: Date.now(), author: action.author, text: action.text, likes: 0, likedBy: [], replies: [], time: "à l'instant" }] }
        : c
      return { ...state, comments: state.comments.map(add) }
    }
    default: return state
  }
}

/* ============================================================
   🚀  APP
   ============================================================ */
export default function App() {
  const [view, setView] = useState('home')
  const [readerTomeId, setReaderTomeId] = useState(null)
  const [currentUser] = useState(() => generatePiratePseudo())
  const [state, dispatch] = useReducer(commentsReducer, { comments: INITIAL_COMMENTS })
  const [toast, setToast] = useState('')
  const [toastShow, setToastShow] = useState(false)
  const [unlockedTomes, setUnlockedTomes] = useState(DEFAULT_UNLOCKED)
  const [justUnlockedId, setJustUnlockedId] = useState(null)
  const [paywall, setPaywall] = useState({ open: false, tomeId: null })
  const [search, setSearch] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setToastShow(true)
    setTimeout(() => setToastShow(false), 2200)
  }

  const share = () => {
    const url = `https://mondes.com/share?ref=${currentUser.replace('@', '').toLowerCase()}`
    try { navigator.clipboard?.writeText(url); showToast('Lien copié !') } catch { showToast(url) }
  }

  const unlockTome = (id) => {
    setUnlockedTomes((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setJustUnlockedId(id)
    showToast(`Tome ${id} débloqué ! 🎉`)
    setTimeout(() => setJustUnlockedId(null), 800)
  }

  const unlockAllTomes = () => {
    setUnlockedTomes([1, 2, 3, 4, 5, 6, 7])
    showToast('Pack Intégral activé ! 🔥')
  }

  const handleTomeClick = (tome) => {
    if (unlockedTomes.includes(tome.id)) {
      setReaderTomeId(tome.id)
      goto('reader')
    } else {
      setPaywall({ open: true, tomeId: tome.id })
    }
  }

  const goto = (v) => {
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomePage state={state} dispatch={dispatch} goto={goto} currentUser={currentUser} share={share} unlocked={unlockedTomes} justUnlockedId={justUnlockedId} onTomeClick={handleTomeClick} />
      case 'community':
        return <CommunityPage state={state} dispatch={dispatch} currentUser={currentUser} goto={goto} />
      case 'reader':
        return <ReaderPage goto={goto} tomeId={readerTomeId} />
      /* 👇 Ajoute tes pages ici : case 'shop': return <ShopPage goto={goto} /> */
      default:
        return <HomePage state={state} dispatch={dispatch} goto={goto} currentUser={currentUser} share={share} unlocked={unlockedTomes} justUnlockedId={justUnlockedId} onTomeClick={handleTomeClick} />
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-yellow-500 selection:text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <button onClick={() => goto('home')} className="flex items-center gap-2 group transition-all duration-300 active:scale-95 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/30">M</div>
            <span className="hidden sm:inline text-white font-black text-lg tracking-[0.2em] group-hover:text-yellow-500 transition-all duration-300">MONDES</span>
          </button>

          {/* nav */}
          <nav className="flex items-center gap-1 mr-auto">
            {[
              ['home', Home, 'Accueil'],
              ['community', Users, 'Communauté'],
              ['reader', BookOpen, 'Lecture'],
            ].map(([k, Icon, label]) => (
              <button
                key={k}
                onClick={() => goto(k)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-300 active:scale-95 ${view === k ? 'bg-yellow-500/15 text-yellow-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* search */}
          <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-1 py-1 focus-within:border-yellow-500/50 transition-all duration-300 w-48 lg:w-64">
            <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>

          {/* share */}
          <button
            onClick={share}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-yellow-500 text-black hover:bg-yellow-400 transition-all duration-300 active:scale-95 shadow-lg shadow-yellow-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden lg:inline">Parrainage</span>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">{renderView()}</main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-black">M</div>
              <span className="text-white font-black text-lg tracking-[0.2em]">MONDES</span>
            </div>
            <p className="text-zinc-500 text-xs mt-3 leading-relaxed">Manga original français signé Sow Wele. Lecture en ligne, communauté ouverte, paywall doux.</p>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Explorer</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><button onClick={() => goto('home')} className="hover:text-yellow-500 transition-colors">Tomes</button></li>
              <li><button onClick={() => goto('community')} className="hover:text-yellow-500 transition-colors">Communauté</button></li>
              <li><button onClick={() => goto('reader')} className="hover:text-yellow-500 transition-colors">Lecture</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Suivre</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-yellow-500 transition-colors">Twitter / X</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-yellow-500 transition-colors">TikTok</a></li>
              <li><button onClick={share} className="hover:text-yellow-500 transition-colors">Parrainage</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Légal</h4>
            <ul className="space-y-2 text-zinc-500">
              <li><span className="hover:text-yellow-500 transition-colors cursor-pointer">CGU</span></li>
              <li><span className="hover:text-yellow-500 transition-colors cursor-pointer">Confidentialité</span></li>
              <li><span className="hover:text-yellow-500 transition-colors cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-900 py-5 text-center text-zinc-700 text-xs">© 2026 MONDES · Sow Wele · Tous droits réservés</div>
      </footer>

      <PaywallModal
        open={paywall.open}
        tomeId={paywall.tomeId}
        onClose={() => setPaywall({ open: false, tomeId: null })}
        onUnlock={unlockTome}
        onUnlockAll={unlockAllTomes}
        onShare={share}
      />

      <Toast message={toast} show={toastShow} />
    </div>
  )
}
