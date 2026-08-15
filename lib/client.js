window.__ModuleLoader__.load({
	id: "dsh-web-preview-panel",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
/**
 * dsh-web-preview-panel — Client half.
 *
 * Bundled by build.mjs into the ModuleLoader format (see lib/client.js).
 * Plain browser JS + React (provided by the loader's require). Talks to the
 * Host half exclusively through `POST /__dsh-preview/api` JSON RPC.
 */
const inject = ['timer']

const PANEL_CSS = `
.wvp-play { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:transparent; border:none; color:var(--dsw-alias-label-secondary, #9aa0a6); cursor:pointer; }
.wvp-play:hover { background:var(--dsw-alias-bg-layer-1, rgba(128,128,128,.15)); color:var(--dsw-alias-label-primary, #e8eaed); }
.wvp-play.is-active { color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-play svg { width:15px; height:15px; flex:none; }
.wvp-root { position:fixed; top:10px; right:10px; bottom:10px; z-index:1000; display:flex; flex-direction:column; border-radius:14px; overflow:hidden; background:color-mix(in srgb, var(--dsw-alias-bg-overlay, #171a21) 30%, transparent); -webkit-backdrop-filter:blur(34px) saturate(200%); backdrop-filter:blur(34px) saturate(200%); border:1px solid rgba(255,255,255,.10); box-shadow:0 12px 40px rgba(0,0,0,.20), inset 0 0 0 1px rgba(255,255,255,.03); color:var(--dsw-alias-label-primary, #e8eaed); font-size:13px; }
.wvp-root::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; z-index:6; background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), rgba(255,255,255,.12), rgba(255,255,255,.35), transparent); }
.wvp-handle { position:absolute; left:0; top:0; bottom:0; width:10px; margin-left:-5px; cursor:col-resize; z-index:5; touch-action:none; }
.wvp-handle::after { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:12px; height:36px; border-radius:10px; background:rgba(255,255,255,.35); border:1px solid rgba(255,255,255,.25); opacity:0; transition:opacity .15s; -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }
.wvp-root:hover .wvp-handle::after, .wvp-handle:hover::after, .wvp-handle[data-dragging='true']::after { opacity:1; }
.wvp-toolbar { position:relative; display:flex; align-items:center; gap:5px; padding:10px 10px 8px; border-bottom:1px solid rgba(255,255,255,.07); background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0) 60%); }
.wvp-toolbar::after { content:''; position:absolute; top:0; left:16px; right:16px; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,.35), rgba(255,255,255,.1), rgba(255,255,255,.35), transparent); }
.wvp-toolbar .wvp-input { flex:1; min-width:0; }
.wvp-icobtn { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:8px; background:transparent; border:none; color:var(--dsw-alias-label-secondary, #9aa0a6); cursor:pointer; font-size:14px; line-height:1; padding:0; }
.wvp-icobtn:hover { background:rgba(255,255,255,.10); color:var(--dsw-alias-label-primary, #e8eaed); }
.wvp-icobtn.is-active { color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-input { background:color-mix(in srgb, var(--dsw-alias-bg-base, #0d1117) 35%, transparent); color:var(--dsw-alias-label-primary, #e8eaed); border:1px solid rgba(255,255,255,.12); border-radius:8px; padding:4px 9px; font-size:12px; outline:none; -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
.wvp-input:focus { border-color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-btn { background:rgba(255,255,255,.08); color:var(--dsw-alias-label-primary, #e8eaed); border:1px solid rgba(255,255,255,.14); border-radius:8px; padding:4px 10px; cursor:pointer; font-size:12px; white-space:nowrap; }
.wvp-btn:hover { border-color:var(--dsw-alias-brand-primary, #4f8cff); color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-btn.primary { background:var(--dsw-alias-brand-primary, #4f8cff); border-color:transparent; color:#fff; }
.wvp-btn.primary:hover { opacity:.9; color:#fff; }
.wvp-btn.danger { color:var(--dsw-alias-state-error-primary, #ff6b6b); }
.wvp-menu-wrap { position:relative; }
.wvp-menu { position:absolute; right:0; top:calc(100% + 6px); min-width:196px; border-radius:12px; padding:5px; z-index:1100; display:flex; flex-direction:column; gap:1px; background:color-mix(in srgb, var(--dsw-alias-bg-overlay, #171a21) 62%, transparent); -webkit-backdrop-filter:blur(30px) saturate(200%); backdrop-filter:blur(30px) saturate(200%); border:1px solid rgba(255,255,255,.12); box-shadow:0 12px 36px rgba(0,0,0,.28); }
.wvp-menu-item { display:flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px; cursor:pointer; font-size:12px; color:var(--dsw-alias-label-primary, #e8eaed); background:transparent; border:none; text-align:left; width:100%; }
.wvp-menu-item:hover { background:rgba(255,255,255,.08); }
.wvp-menu-item.danger { color:var(--dsw-alias-state-error-primary, #ff6b6b); }
.wvp-menu-sep { height:1px; background:rgba(255,255,255,.10); margin:3px 6px; }
.wvp-menu-root { display:flex; gap:6px; padding:4px 8px 8px; }
.wvp-menu-root .wvp-input { flex:1; min-width:0; font-size:11px; }
.wvp-pages-body { padding:8px 10px 10px; display:flex; flex-direction:column; gap:7px; max-height:26%; overflow:auto; background:rgba(255,255,255,.04); border-bottom:1px solid rgba(255,255,255,.07); }
.wvp-proj { padding:6px 10px; display:flex; flex-direction:column; gap:5px; border-bottom:1px solid rgba(255,255,255,.07); background:rgba(255,255,255,.04); }
.wvp-proj-row { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--dsw-alias-label-secondary, #9aa0a6); flex-wrap:wrap; }
.wvp-proj-name { color:var(--dsw-alias-label-primary, #e8eaed); font-weight:600; }
.wvp-proj-log { max-height:110px; overflow:auto; background:rgba(0,0,0,.35); border-radius:8px; padding:6px 8px; font:10px/1.5 ui-monospace,Menlo,monospace; color:#9fe8a8; white-space:pre-wrap; word-break:break-all; }
.wvp-error { color:var(--dsw-alias-state-error-primary, #ff6b6b); font-size:11px; word-break:break-all; padding:5px 10px; }
.wvp-hint { color:var(--dsw-alias-brand-primary, #4f8cff); font-size:11px; padding:5px 10px; }
.wvp-crumbs { display:flex; flex-wrap:wrap; gap:4px; align-items:center; color:var(--dsw-alias-label-secondary, #9aa0a6); font-size:11px; }
.wvp-crumb { cursor:pointer; color:var(--dsw-alias-label-secondary, #9aa0a6); }
.wvp-crumb:hover { color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-chips { display:flex; flex-wrap:wrap; gap:5px; }
.wvp-chip { cursor:pointer; padding:3px 9px; border-radius:999px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:var(--dsw-alias-label-primary, #e8eaed); font-size:11px; }
.wvp-chip:hover { border-color:var(--dsw-alias-brand-primary, #4f8cff); color:var(--dsw-alias-brand-primary, #4f8cff); }
.wvp-chip.dir { border-style:dashed; color:var(--dsw-alias-label-secondary, #9aa0a6); }
.wvp-sel { padding:7px 10px; display:flex; flex-direction:column; gap:5px; background:rgba(255,255,255,.05); border-bottom:1px solid rgba(255,255,255,.07); }
.wvp-sel-sel { color:var(--dsw-alias-label-secondary, #9aa0a6); font-family:ui-monospace,Menlo,monospace; font-size:10px; word-break:break-all; }
.wvp-sel-text { font-size:11px; max-height:52px; overflow:auto; word-break:break-all; }
.wvp-sel-actions { display:flex; gap:5px; flex-wrap:wrap; }
.wvp-noteinput { background:color-mix(in srgb, var(--dsw-alias-bg-base, #0d1117) 40%, transparent); color:var(--dsw-alias-label-primary, #e8eaed); border:1px solid rgba(255,255,255,.12); border-radius:6px; padding:3px 7px; font-size:11px; outline:none; flex:1; min-width:120px; }
.wvp-anns { display:flex; flex-direction:column; gap:3px; }
.wvp-ann { display:flex; gap:6px; align-items:flex-start; font-size:11px; }
.wvp-ann-sel { color:var(--dsw-alias-label-secondary, #9aa0a6); font-family:ui-monospace,Menlo,monospace; font-size:10px; word-break:break-all; max-width:40%; }
.wvp-ann-text { flex:1; word-break:break-all; }
.wvp-frame-wrap { flex:1; min-height:0; position:relative; background:#fff; }
.wvp-frame { width:100%; height:100%; border:none; display:block; background:#fff; }
.wvp-empty { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--dsw-alias-label-secondary, #9aa0a6); }
.wvp-textlink { color:var(--dsw-alias-brand-primary, #4f8cff); text-decoration:underline dotted; text-decoration-thickness:1px; text-underline-offset:2px; cursor:pointer; }
.wvp-textlink:hover { text-decoration-style:solid; opacity:.85; }
`

function injectStyles(css) {
  const el = document.createElement('style')
  el.textContent = css
  document.head.appendChild(el)
  return () => { el.remove() }
}

function apply(ctx) {
  const slots = ctx.get('slots')
  if (slots === undefined) return

  ctx.effect(() => injectStyles(PANEL_CSS))

  // ---------- 按会话隔离的面板状态 ----------
  const makeStore = () => {
    let open = false
    const subs = new Set()
    return {
      get: () => open,
      set: (v) => { if (v !== open) { open = v; subs.forEach((f) => f()) } },
      toggle: () => { open = !open; subs.forEach((f) => f()) },
      sub: (f) => { subs.add(f); return () => subs.delete(f) }
    }
  }
  const makeModel = () => {
    const state = {
      sid: '', base: '', root: null, dir: '', dirs: [], pages: [], url: '', error: null,
      marking: false, selected: null, annotationText: '', annotations: [], pendingSend: null,
      width: 480, pagesOpen: false,
      project: { kind: null, name: '', cmd: null, running: false, starting: false, log: [], url: null, exitCode: null, detectError: null }
    }
    const subs = new Set()
    return {
      get: () => state,
      set: (patch) => { Object.assign(state, patch); subs.forEach((f) => f()) },
      sub: (f) => { subs.add(f); return () => subs.delete(f) }
    }
  }
  const panels = new Map()
  const getPanel = (sid) => {
    const key = sid || '__root__'
    let p = panels.get(key)
    if (!p) {
      const store = makeStore()
      const model = makeModel()
      model.set({ sid: key, base: '/__dsh-preview/' + key })
      p = { sid: key, store, model }
      panels.set(key, p)
    }
    return p
  }
  let activePanel = null
  let currentSid = '__root__'

  // 当前会话所属工作区路径（根目录默认值）
  const workspacePathFor = (sid, items, recentId) => {
    if (items && items.length) {
      const bySession = items.find((w) => w.sessionIds && w.sessionIds.indexOf(sid) !== -1)
      if (bySession && bySession.path) return bySession.path
      const byRecent = items.find((w) => w.workspaceId === recentId)
      if (byRecent && byRecent.path) return byRecent.path
      if (items[0] && items[0].path) return items[0].path
    }
    return ''
  }

  // ---------- Host JSON API ----------
  async function api(method, args) {
    const res = await fetch('/__dsh-preview/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, args: args || {} })
    })
    return await res.json()
  }

  const call = async (method, args) => {
    try {
      const res = await api(method, args)
      if (res && typeof res === 'object' && res.ok === false) throw new Error(res.error || '操作失败')
      return res || {}
    } catch (e) {
      throw new Error(String((e && e.message) || e))
    }
  }

  const resolveUrl = (text, base) => {
    const s = (text || '').trim()
    if (!s) return null
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/')) return base + s
    if (/^[\w\-.]+(\.html?)?$/i.test(s)) return base + '/' + s
    return 'http://' + s
  }

  // 外部站点（GitHub 等可能拒绝 iframe 嵌入）→ 走本机代理预览
  const isExternal = (u) => {
    try {
      const url = new URL(u)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
      const host = url.hostname
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
      if (url.origin === window.location.origin) return false
      return true
    } catch (e) {
      return false
    }
  }
  const toProxy = (u) => {
    try {
      const url = new URL(u)
      const b64 = btoa(url.origin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      return '/__dsh-preview-proxy/' + b64 + url.pathname + url.search
    } catch (e) {
      return u
    }
  }

  // ---------- 对话内纯文本路径 → 可点击链接 ----------
  const TEXTLINK_RE = /(?<![\w@.])(?:(?:\/Users\/|\/home\/|~\/|[A-Za-z]:[\\/]|\.{0,2}\/)?[\w@][\w@./-]*\.(?:md|markdown|html?|mjs|cjs|jsx?|tsx?|rs|py|go|json|css|scss|sass|less|png|jpe?g|gif|svg|webp|ico|txt|toml|ya?ml|sh|bash|zsh|sql|pdf|xml|log|vue|svelte|java|c|cpp|h|hpp|php|rb|swift|kt|cs|ini|conf|env|webmanifest))(?![\w@./-])/g

  const hasTextlinkAncestor = (el) => {
    let n = el
    while (n && n.nodeType === 1) {
      if (n.classList && (n.classList.contains('wvp-textlink') || n.classList.contains('wvp-root'))) return true
      n = n.parentElement
    }
    return false
  }

  const convertTextNode = (textNode) => {
    const text = textNode.nodeValue
    TEXTLINK_RE.lastIndex = 0
    if (!text || !TEXTLINK_RE.test(text)) return
    TEXTLINK_RE.lastIndex = 0
    const frag = document.createDocumentFragment()
    let last = 0
    let m
    let changed = false
    while ((m = TEXTLINK_RE.exec(text))) {
      changed = true
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
      const a = document.createElement('a')
      a.href = m[0]
      a.className = 'wvp-textlink'
      a.title = '在侧边预览中打开 '
      a.textContent = m[0]
      frag.appendChild(a)
      last = m.index + m[0].length
    }
    if (!changed) return
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
    const parent = textNode.parentNode
    if (parent && parent.nodeType === 1 && !hasTextlinkAncestor(parent)) {
      parent.replaceChild(frag, textNode)
    }
  }

  const processNode = (node) => {
    if (!node || !node.isConnected) return
    if (node.nodeType === 3) {
      const parent = node.parentNode
      if (!parent || parent.nodeType !== 1) return
      if (hasTextlinkAncestor(parent)) return
      convertTextNode(node)
      return
    }
    if (node.nodeType !== 1) return
    const tag = (node.tagName || '').toLowerCase()
    if (/^(a|pre|code|script|style|svg|textarea|input|button|select)$/.test(tag)) return
    if (node.classList && (node.classList.contains('wvp-root') || node.classList.contains('wvp-textlink'))) return
    const targets = []
    const walker = document.createTreeWalker(node, 4)
    while (walker.nextNode()) {
      const tn = walker.currentNode
      TEXTLINK_RE.lastIndex = 0
      if (tn.nodeValue && TEXTLINK_RE.test(tn.nodeValue)) targets.push(tn)
    }
    for (const tn of targets) {
      const parent = tn.parentNode
      if (!parent || parent.nodeType !== 1) continue
      if (hasTextlinkAncestor(parent)) continue
      convertTextNode(tn)
    }
  }

  let linkObserver = null
  try {
    const pending = new Set()
    let timer = null
    linkObserver = new MutationObserver((muts) => {
      for (const mu of muts) {
        if (mu.type === 'characterData' && mu.target && mu.target.parentNode) {
          pending.add(mu.target.parentNode)
        } else if (mu.addedNodes) {
          for (const n of mu.addedNodes) pending.add(n)
        }
      }
      if (pending.size && !timer) {
        timer = requestAnimationFrame(() => {
          timer = null
          const arr = Array.from(pending)
          pending.clear()
          for (const n of arr) {
            try { processNode(n) } catch (e) { /* noop */ }
          }
        })
      }
    })
    linkObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
  } catch (e) { /* noop */ }
  ctx.effect(() => () => { if (linkObserver) linkObserver.disconnect() })

  // ---------- 接管页面链接点击 ----------
  const isLocalAbsPath = (h) =>
    /^\/(Users|home|tmp|private|Volumes|opt|etc|var|usr|Applications|Library|System|dev)\//.test(h) ||
    /^~[\/]/.test(h) ||
    /^[A-Za-z]:[\\/]/.test(h)

  const onDocClick = (e) => {
    if (!e || e.defaultPrevented) return
    if (e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const t = e.target
    if (!t || !t.closest) return
    if (t.closest('.wvp-root')) return
    const a = t.closest('a[href]')
    if (!a) return
    const href = (a.getAttribute('href') || '').trim()
    const pp = getPanel(currentSid)
    const base = pp.model.get().base || ('/__dsh-preview/' + currentSid)
    let url = null
    if (/^https?:\/\//i.test(href)) {
      url = href
    } else if (href.indexOf('/__dsh-preview') === 0) {
      url = href
    } else if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) {
      return
    } else if (isLocalAbsPath(href)) {
      const name = href.split(/[\\/]/).pop().split('?')[0].split('#')[0]
      if (!name) return
      url = base + '/' + name
      call('resolve-path', { sid: currentSid, path: href }).then((res) => {
        if (res && res.ok && res.url) {
          const p2 = getPanel(currentSid)
          p2.model.set({ url: res.url, error: null })
        } else if (res && !res.ok && res.error) {
          const p2 = getPanel(currentSid)
          p2.model.set({ error: res.error })
        }
      }).catch(() => { /* noop */ })
    } else if (!href.startsWith('/') && !href.includes('://')) {
      const rel = href.split('?')[0].split('#')[0].replace(/^\.?\//, '')
      if (rel) url = base + '/' + rel
      else return
    } else {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    pp.model.set({ url, error: null, selected: null })
    if (!pp.store.get()) pp.store.set(true)
  }
  document.addEventListener('click', onDocClick, true)
  ctx.effect(() => () => document.removeEventListener('click', onDocClick, true))

  // ---------- 项目运行状态轮询 ----------
  ctx.interval(async () => {
    const p = activePanel
    if (!p) return
    const pr = p.model.get().project
    if (!pr || !pr.running) return
    try {
      const res = await call('project-status', { sid: p.sid })
      if (!res || !res.ok) {
        p.model.set({ project: { ...p.model.get().project, running: false, starting: false } })
        return
      }
      const next = {
        ...p.model.get().project,
        running: !!res.running,
        starting: false,
        log: res.log || [],
        url: res.url || null,
        exitCode: res.exitCode === undefined || res.exitCode === null ? null : res.exitCode
      }
      p.model.set({ project: next })
      if (res.url && p.model.get().url !== res.url) p.model.set({ url: res.url })
    } catch (e) { /* noop */ }
  }, 1000)

  // ---------- 布局测量与停靠挤压（带护栏与自愈） ----------
  const MIN_PANEL = 320
  const CENTER_FLOOR = 400
  const CENTER_SAFE = 140
  const SIDEBAR_FALLBACK = 280
  const clampNum = (v, lo, hi) => {
    const x = Number(v)
    if (!Number.isFinite(x)) return lo
    return Math.max(lo, Math.min(x, hi))
  }

  const findCenterCol = () => {
    try {
      return document.querySelector('[class*="centerCol"]')
    } catch (e) {
      return null
    }
  }

  const measureSidebar = () => {
    try {
      const el = findCenterCol()
      if (el) return Math.max(Math.round(el.getBoundingClientRect().left), 0)
    } catch (e) { /* noop */ }
    try {
      const el = document.querySelector('[class*="sidebarCol"]')
      if (el) return Math.max(Math.round(el.getBoundingClientRect().width), 0)
    } catch (e) { /* noop */ }
    return SIDEBAR_FALLBACK
  }

  const applyDock = (w) => {
    try {
      const sb = measureSidebar()
      const vw = window.innerWidth
      const maxDock = Math.max(vw - sb - CENTER_FLOOR, 0)
      let pad = clampNum(w, 0, maxDock)
      pad = Math.min(pad, vw - sb - CENTER_SAFE)
      if (pad < 0) pad = 0
      const el = findCenterCol()
      if (el) {
        const rect = el.getBoundingClientRect()
        if (Number.isFinite(rect.width) && rect.width > 0 && rect.width - pad < CENTER_SAFE) {
          pad = Math.max(rect.width - CENTER_SAFE, 0)
        }
        el.style.marginRight = pad > 0 ? pad + 'px' : ''
      }
    } catch (e) { /* noop */ }
  }

  const clearDock = () => {
    try {
      const el = findCenterCol()
      if (el) el.style.marginRight = ''
    } catch (e) { /* noop */ }
  }

  // ---------- 网页标记 ----------
  let iframeEl = null
  let markDisposer = null
  const INTERNAL_CLASSES = ['wvp-mark-hover', 'wvp-mark-active', 'wvp-note', 'wvp-note-x']
  const FRAME_CSS = `
.wvp-marking { cursor:crosshair !important; }
.wvp-marking .wvp-mark-hover { cursor:pointer !important; }
.wvp-marking a, .wvp-marking button, .wvp-marking [role='button'] { cursor:pointer !important; }
.wvp-mark-hover { outline:2px dashed #ff9800 !important; outline-offset:2px; }
.wvp-mark-active { outline:2px solid #4f8cff !important; outline-offset:2px; background:rgba(79,140,255,.12) !important; }
.wvp-note { position:absolute; top:-26px; left:0; z-index:2147483647; background:#ffd54a; color:#3a2f00; font:12px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:2px 8px; border-radius:4px; white-space:pre-wrap; max-width:280px; box-shadow:0 1px 6px rgba(0,0,0,.35); }
.wvp-note-x { cursor:pointer; margin-left:8px; font-weight:700; color:#7a5d00; }
`

  const safeDoc = () => {
    try {
      return iframeEl && iframeEl.contentDocument
    } catch (e) {
      return null
    }
  }

  const esc = (s) => String(s).replace(/([^a-zA-Z0-9_\-\u00a0-\uffff])/g, (c) => '\\' + c)

  const classesOf = (node) => {
    if (!node.classList || node.classList.length === 0) return []
    return Array.from(node.classList).filter((c) => INTERNAL_CLASSES.indexOf(c) === -1)
  }

  const getSelector = (el, doc) => {
    const parts = []
    let node = el
    while (node && node.nodeType === 1 && node !== doc.body && node !== doc.documentElement) {
      let part = node.tagName.toLowerCase()
      if (node.id) {
        part = '#' + esc(node.id)
        parts.unshift(part)
        break
      }
      const cls = classesOf(node)
      if (cls.length > 0) {
        part += cls.slice(0, 3).map((c) => '.' + esc(c)).join('')
      }
      const parent = node.parentElement
      if (parent) {
        const same = Array.from(parent.children).filter((s) => s.tagName === node.tagName)
        if (same.length > 1) {
          part += ':nth-child(' + (Array.from(parent.children).indexOf(node) + 1) + ')'
        }
      }
      parts.unshift(part)
      node = parent
    }
    return parts.join(' > ')
  }

  const stripInternalClasses = (node) => {
    const walk = (n) => {
      if (n.classList) {
        for (const c of INTERNAL_CLASSES) {
          if (n.classList.contains(c)) n.classList.remove(c)
        }
        if (n.classList.length === 0) n.removeAttribute('class')
      }
      const kids = n.children ? Array.from(n.children) : []
      for (const k of kids) walk(k)
    }
    walk(node)
    return node
  }

  const clearHover = (doc) => {
    const els = doc.querySelectorAll('.wvp-mark-hover')
    for (const e of Array.from(els)) e.classList.remove('wvp-mark-hover')
  }
  const clearActive = (doc) => {
    const els = doc.querySelectorAll('.wvp-mark-active')
    for (const e of Array.from(els)) e.classList.remove('wvp-mark-active')
  }

  const selectElement = (el, doc) => {
    clearActive(doc)
    el.classList.add('wvp-mark-active')
    const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 600)
    const clone = el.cloneNode(true)
    stripInternalClasses(clone)
    const html = (clone.outerHTML || '').slice(0, 3000)
    const rect = el.getBoundingClientRect()
    const p = activePanel
    if (p) {
      p.model.set({
        selected: {
          selector: getSelector(el, doc),
          tag: el.tagName.toLowerCase(),
          text,
          html,
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
        }
      })
    }
  }

  const attachMarking = (doc) => {
    if (!doc.head.querySelector('#wvp-mark-style')) {
      const style = doc.createElement('style')
      style.id = 'wvp-mark-style'
      style.textContent = FRAME_CSS
      doc.head.appendChild(style)
    }
    doc.documentElement.classList.add('wvp-marking')
    const onOver = (e) => {
      const t = e.target
      const el = t && t.closest ? t.closest('body *') : null
      if (!el || el === doc.body) return
      clearHover(doc)
      el.classList.add('wvp-mark-hover')
    }
    const onOut = () => clearHover(doc)
    const onClick = (e) => {
      const t = e.target
      if (t && t.closest && t.closest('.wvp-note')) return
      const el = t && t.closest ? t.closest('body *') : null
      if (!el || el === doc.body) return
      e.preventDefault()
      e.stopPropagation()
      selectElement(el, doc)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const p = activePanel
        if (p) p.model.set({ marking: false })
      }
    }
    doc.addEventListener('mouseover', onOver, true)
    doc.addEventListener('mouseout', onOut, true)
    doc.addEventListener('click', onClick, true)
    doc.addEventListener('keydown', onKey, true)
    return () => {
      doc.documentElement.classList.remove('wvp-marking')
      doc.removeEventListener('mouseover', onOver, true)
      doc.removeEventListener('mouseout', onOut, true)
      doc.removeEventListener('click', onClick, true)
      doc.removeEventListener('keydown', onKey, true)
      clearHover(doc)
      clearActive(doc)
    }
  }

  const ensureMarking = (doc) => {
    if (markDisposer) { markDisposer(); markDisposer = null }
    markDisposer = attachMarking(doc)
  }

  const renderAnnotation = (doc, ann) => {
    const el = doc.querySelector(ann.selector)
    if (!el) return
    const style = doc.defaultView.getComputedStyle(el)
    if (style.position === 'static') el.style.position = 'relative'
    const note = doc.createElement('div')
    note.className = 'wvp-note'
    note.dataset.wvpId = ann.id
    const span = doc.createElement('span')
    span.textContent = ann.text
    const x = doc.createElement('span')
    x.className = 'wvp-note-x'
    x.textContent = '✕'
    x.onclick = () => {
      removeAnnotation(ann.id)
      if (note.parentNode) note.parentNode.removeChild(note)
    }
    note.appendChild(span)
    note.appendChild(x)
    el.appendChild(note)
  }

  const replayAnnotations = (doc) => {
    if (!doc) return
    const olds = doc.querySelectorAll('.wvp-note')
    for (const n of Array.from(olds)) n.remove()
    const p = activePanel
    if (!p) return
    for (const a of p.model.get().annotations) renderAnnotation(doc, a)
  }

  const removeAnnotation = (id) => {
    const p = activePanel
    if (!p) return
    p.model.set({ annotations: p.model.get().annotations.filter((a) => a.id !== id) })
    const doc = safeDoc()
    if (doc) {
      const n = doc.querySelector('.wvp-note[data-wvp-id="' + id + '"]')
      if (n && n.parentNode) n.parentNode.removeChild(n)
    }
  }

  const addAnnotation = () => {
    const p = activePanel
    if (!p) return
    const sel = p.model.get().selected
    const text = p.model.get().annotationText.trim()
    if (!sel || !sel.selector || !text) return
    const id = 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36)
    const ann = { id, selector: sel.selector, text }
    p.model.set({ annotations: p.model.get().annotations.concat([ann]), annotationText: '' })
    const doc = safeDoc()
    if (doc) renderAnnotation(doc, ann)
  }

  const buildPayload = (sel, annText) => {
    const p = activePanel
    const lines = []
    lines.push('网页元素标记（预览 ' + ((p && p.model.get().url) || '') + '）：')
    if (sel.selector) lines.push('- 选择器: ' + sel.selector)
    if (sel.tag) lines.push('- 标签: <' + sel.tag + '>')
    if (sel.text) lines.push('- 文本: ' + sel.text)
    if (sel.html) lines.push('- HTML: ' + sel.html)
    if (annText) lines.push('- 批注: ' + annText)
    return lines.join('\n')
  }

  const requestSend = (submitNow) => {
    const p = activePanel
    if (!p) return
    const sel = p.model.get().selected
    if (!sel) return
    const annText = p.model.get().annotationText.trim()
    const payload = buildPayload(sel, annText)
    p.model.set({ pendingSend: { payload, submit: submitNow } })
  }

  // ---------- 右上角 Play 按钮 ----------
  const PlayButton = (props) => {
    const p = getPanel(props.sessionId)
    useSub(p.store)
    useSub(p.model)
    const open = p.store.get()
    const draft = props.useInput((s) => s.draft)
    const pending = p.model.get().pendingSend
    React.useEffect(() => {
      if (!pending) return
      p.model.set({ pendingSend: null })
      const next = draft ? draft.replace(/\s+$/, '') + '\n\n' + pending.payload : pending.payload
      props.inputActions.setDraft(next)
      if (pending.submit) props.inputActions.submit()
    }, [pending])
    return React.createElement('button', {
      className: 'wvp-play' + (open ? ' is-active' : ''),
      title: open ? '关闭网页预览' : '打开网页预览',
      'aria-label': '网页预览',
      onClick: () => p.store.toggle()
    },
      open
        ? React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
            React.createElement('rect', { x: '6', y: '6', width: '12', height: '12', rx: '1' }))
        : React.createElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
            React.createElement('path', { d: 'M8 5v14l11-7z' }))
    )
  }

  const useSub = (pub) => {
    const [, force] = React.useState(0)
    React.useEffect(() => pub.sub(() => force((x) => x + 1)), [pub])
  }

  // ---------- 预览面板 ----------
  const PreviewPanel = (props) => {
    const current = props.useSessions((s) => s.current)
    const sid = current || '__root__'
    const p = getPanel(sid)
    activePanel = p
    currentSid = sid
    useSub(p.store)
    useSub(p.model)
    const open = p.store.get()
    const m = p.model.get()
    const items = props.useWorkspaces((s) => s.items)
    const recentId = props.useWorkspaces((s) => s.recentWorkspaceId)
    const [input, setInput] = React.useState('')
    const [rootInput, setRootInput] = React.useState('')
    const [reload, setReload] = React.useState(0)
    const [dragging, setDragging] = React.useState(false)
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [rootOpen, setRootOpen] = React.useState(false)
    const dragRef = React.useRef(null)

    React.useEffect(() => {
      if (!menuOpen) return
      const onDown = (e) => {
        if (e.target && e.target.closest && e.target.closest('.wvp-menu-wrap')) return
        setMenuOpen(false)
      }
      document.addEventListener('mousedown', onDown)
      return () => document.removeEventListener('mousedown', onDown)
    }, [menuOpen])

    React.useEffect(() => {
      if (m.url) setInput(m.url)
    }, [m.url, sid])

    React.useEffect(() => {
      if (!open) return
      const sb = measureSidebar()
      const maxW = Math.max(window.innerWidth - sb - 20, MIN_PANEL)
      p.model.set({ width: clampNum(m.width || 480, MIN_PANEL, maxW) })
      const onResize = () => {
        const s2 = measureSidebar()
        const max2 = Math.max(window.innerWidth - s2 - 20, MIN_PANEL)
        p.model.set({ width: clampNum(p.model.get().width || 480, MIN_PANEL, max2) })
      }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [open, sid])

    React.useEffect(() => {
      if (!open) {
        clearDock()
        return
      }
      applyDock(m.width || 480)
      return () => clearDock()
    }, [open, sid, m.width])

    const init = async (force) => {
      try {
        // 根目录默认 = 当前会话所属工作区目录
        const hint = workspacePathFor(sid, items, recentId)
        const res = await call('set-root', { path: hint, sid })
        p.model.set({ root: res.root, base: res.base, error: null })
        if (rootInput === '' || (rootInput && hint && rootInput !== res.root)) setRootInput(res.root || '')
        const [pages, det] = await Promise.all([
          call('pages', { dir: '', sid }),
          call('detect-project', { sid }).catch(() => ({ ok: true, type: 'static', name: '' }))
        ])
        p.model.set({ dir: pages.dir || '', dirs: pages.dirs || [], pages: pages.pages || [], error: null })
        if (det && det.ok && det.type !== 'static') {
          p.model.set({ project: { ...p.model.get().project, kind: det.type, name: det.name || '', cmd: det.run ? det.run.join(' ') : null } })
        } else if (det && det.ok) {
          p.model.set({ project: { ...p.model.get().project, kind: null, name: '', cmd: null, running: false, log: [], url: null } })
        }
        if (force || !p.model.get().url) {
          const t = pages.pages.find((x) => x.name === 'index.html') || pages.pages[0]
          if (t) p.model.set({ url: p.model.get().base + '/' + t.rel })
        }
      } catch (e) {
        p.model.set({ error: e.message })
      }
    }

    React.useEffect(() => {
      if (open) init(false)
    }, [open, sid])

    React.useEffect(() => {
      if (!open || !m.marking) {
        if (markDisposer) { markDisposer(); markDisposer = null }
        return
      }
      const doc = safeDoc()
      if (!doc) {
        p.model.set({ marking: false, error: '当前页面跨域，无法标记；请预览本地页面后再试' })
        return
      }
      ensureMarking(doc)
    }, [open, sid, m.marking])

    if (!open) {
      if (activePanel === p) activePanel = null
      return null
    }

    const startDrag = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const sb = measureSidebar()
      dragRef.current = {
        startX: e.clientX,
        startW: m.width || 480,
        maxW: Math.max(window.innerWidth - sb - 20, MIN_PANEL)
      }
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* noop */ }
      setDragging(true)
    }
    const moveDrag = (e) => {
      const d = dragRef.current
      if (!d) return
      const w = clampNum(d.startW + (d.startX - e.clientX), MIN_PANEL, d.maxW)
      p.model.set({ width: w })
    }
    const endDrag = () => {
      dragRef.current = null
      setDragging(false)
    }

    const go = () => {
      const u = resolveUrl(input, m.base)
      if (u) { p.model.set({ url: u, error: null }); setReload((r) => r + 1) }
    }

    const openPage = (rel) => {
      p.model.set({ url: m.base + '/' + rel, error: null })
      setReload((r) => r + 1)
    }

    const openDir = async (rel) => {
      try {
        const pp = await call('pages', { dir: rel, sid })
        p.model.set({ dir: pp.dir || rel, dirs: pp.dirs || [], pages: pp.pages || [] })
      } catch (e) {
        p.model.set({ error: e.message })
      }
    }

    const applyRoot = async () => {
      try {
        const res = await call('set-root', { path: rootInput, sid })
        p.model.set({ root: res.root, base: res.base, error: null })
        const pp = await call('pages', { dir: '', sid })
        p.model.set({ dir: pp.dir || '', dirs: pp.dirs || [], pages: pp.pages || [] })
        const t = pp.pages.find((x) => x.name === 'index.html') || pp.pages[0]
        if (t) p.model.set({ url: p.model.get().base + '/' + t.rel })
        else p.model.set({ url: p.model.get().base + '/' })
        setReload((r) => r + 1)
        setMenuOpen(false)
        setRootOpen(false)
      } catch (e) {
        p.model.set({ error: e.message })
      }
    }

    const toggleMarking = () => {
      if (!m.marking) {
        const doc = safeDoc()
        if (!doc) {
          p.model.set({ error: '当前页面跨域，无法标记；请预览本地页面后再试' })
          return
        }
      }
      p.model.set({ marking: !m.marking, error: null })
    }

    const runProject = async () => {
      try {
        await call('run-project', { sid })
        p.model.set({ project: { ...p.model.get().project, running: true, starting: true, log: [], url: null } })
      } catch (e) {
        p.model.set({ error: e.message })
      }
    }

    const stopProject = async () => {
      try {
        await call('stop-project', { sid })
        p.model.set({ project: { ...p.model.get().project, running: false, starting: false } })
      } catch (e) {
        p.model.set({ error: e.message })
      }
    }

    const sendLogToChat = () => {
      const pr = m.project
      const body = (pr.log || []).slice(-120).join('\n').slice(0, 2500)
      const payload = '项目运行日志（' + (pr.cmd || '') + '）：\n```\n' + body + '\n```\n请根据日志诊断问题；如有报错请给出修复方案。'
      p.model.set({ pendingSend: { payload, submit: true } })
    }

    const onFrameLoad = () => {
      const doc = safeDoc()
      if (!doc) return
      replayAnnotations(doc)
      if (m.marking) ensureMarking(doc)
    }

    const safeW = clampNum(m.width || 480, MIN_PANEL, Math.max(window.innerWidth - 30, MIN_PANEL))
    const segs = m.dir ? m.dir.split('/') : []
    const pr = m.project || {}
    return React.createElement('div', { className: 'wvp-root', style: { width: safeW + 'px' } },
      React.createElement('div', {
        className: 'wvp-handle',
        'data-dragging': dragging ? 'true' : 'false',
        title: '拖动调整宽度',
        onPointerDown: startDrag,
        onPointerMove: moveDrag,
        onPointerUp: endDrag,
        onPointerCancel: endDrag
      }),
      React.createElement('div', { className: 'wvp-toolbar' },
        React.createElement('button', {
          className: 'wvp-icobtn' + (m.marking ? ' is-active' : ''),
          title: m.marking ? '退出标记模式 (Esc)' : '标记模式：点击页面元素选取并批注',
          onClick: toggleMarking
        }, '🖉'),
        React.createElement('input', {
          className: 'wvp-input',
          value: input,
          placeholder: '地址或搜索，回车前往',
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => { if (e.key === 'Enter') go() }
        }),
        React.createElement('button', { className: 'wvp-icobtn', title: '重新加载预览', onClick: () => setReload((r) => r + 1) }, '⟳'),
        React.createElement('div', { className: 'wvp-menu-wrap' },
          React.createElement('button', {
            className: 'wvp-icobtn' + (menuOpen ? ' is-active' : ''),
            title: '更多选项',
            onClick: (e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }
          }, '⋮'),
          menuOpen ? React.createElement('div', { className: 'wvp-menu' },
            React.createElement('button', {
              className: 'wvp-menu-item',
              onClick: (e) => { e.stopPropagation(); p.model.set({ pagesOpen: !p.model.get().pagesOpen }) }
            }, '📄 本地页面', React.createElement('span', { style: { marginLeft: 'auto' } }, m.pagesOpen ? '▾' : '▸')),
            React.createElement('a', {
              className: 'wvp-menu-item',
              href: m.url || undefined,
              target: '_blank',
              rel: 'noreferrer'
            }, '↗ 新窗口打开'),
            React.createElement('button', { className: 'wvp-menu-item', onClick: () => { init(true); setMenuOpen(false) } }, '⟳ 刷新页面列表'),
            React.createElement('button', {
              className: 'wvp-menu-item',
              onClick: (e) => { e.stopPropagation(); setRootOpen(!rootOpen) }
            }, '📁 根目录设置' + (rootOpen ? ' ▴' : ' ▾')),
            rootOpen ? React.createElement('div', { className: 'wvp-menu-root', onClick: (e) => e.stopPropagation() },
              React.createElement('input', {
                className: 'wvp-input',
                value: rootInput,
                placeholder: '本地目录绝对路径',
                onChange: (e) => setRootInput(e.target.value),
                onKeyDown: (e) => { if (e.key === 'Enter') applyRoot() }
              }),
              React.createElement('button', { className: 'wvp-btn', onClick: applyRoot }, '应用')
            ) : null,
            React.createElement('div', { className: 'wvp-menu-sep' }),
            React.createElement('button', { className: 'wvp-menu-item danger', onClick: () => p.store.set(false) }, '× 关闭面板')
          ) : null
        ),
        React.createElement('button', { className: 'wvp-icobtn', title: '关闭', onClick: () => p.store.set(false) }, '×')
      ),
      pr.kind ? React.createElement('div', { className: 'wvp-proj' },
        React.createElement('div', { className: 'wvp-proj-row' },
          React.createElement('span', { className: 'wvp-proj-name' }, '⚙ ' + (pr.name || pr.kind)),
          pr.running
            ? React.createElement('span', null, pr.starting ? '启动中…' : (pr.url ? '运行中 · ' + pr.url : '运行中…'))
            : React.createElement('span', null, (pr.exitCode === null ? '未运行' : '已退出 (' + pr.exitCode + ')')),
          React.createElement('span', { style: { flex: 1 } }),
          !pr.running ? React.createElement('button', { className: 'wvp-btn primary', onClick: runProject }, '▶ 运行') : null,
          pr.running ? React.createElement('button', { className: 'wvp-btn danger', onClick: stopProject }, '⏹ 停止') : null,
          (pr.log && pr.log.length > 0) ? React.createElement('button', { className: 'wvp-btn', onClick: sendLogToChat }, '日志→对话') : null
        ),
        pr.running && pr.log && pr.log.length > 0 ? React.createElement('div', { className: 'wvp-proj-log' }, pr.log.slice(-60).join('\n')) : null
      ) : null,
      m.pagesOpen ? React.createElement('div', { className: 'wvp-pages-body' },
        React.createElement('div', { className: 'wvp-crumbs' },
          React.createElement('span', { className: 'wvp-crumb', onClick: () => openDir('') }, '⌂'),
          segs.map((s, i) => React.createElement('span', { key: i }, ' / ', React.createElement('span', { className: 'wvp-crumb', onClick: () => openDir(segs.slice(0, i + 1).join('/')) }, s)))
        ),
        React.createElement('div', { className: 'wvp-chips' },
          m.dirs.map((d) => React.createElement('span', { key: 'd' + d.rel, className: 'wvp-chip dir', onClick: () => openDir(d.rel) }, d.name + '/')),
          m.pages.map((pg) => React.createElement('span', { key: 'p' + pg.rel, className: 'wvp-chip', onClick: () => openPage(pg.rel) }, pg.name))
        )
      ) : null,
      m.error ? React.createElement('div', { className: 'wvp-error' }, String(m.error)) : null,
      m.marking ? React.createElement('div', { className: 'wvp-hint' }, '标记模式：悬停高亮元素，点击选取；Esc 退出') : null,
      m.selected ? React.createElement('div', { className: 'wvp-sel' },
        React.createElement('span', { className: 'wvp-sel-sel' }, m.selected.selector),
        React.createElement('span', { className: 'wvp-sel-text' }, (m.selected.text || '(无文本)').slice(0, 300)),
        React.createElement('div', { className: 'wvp-sel-actions' },
          React.createElement('input', { className: 'wvp-noteinput', value: m.annotationText, placeholder: '批注，如「标题改红色 28px」', onChange: (e) => p.model.set({ annotationText: e.target.value }) }),
          React.createElement('button', { className: 'wvp-btn', onClick: addAnnotation }, '批注'),
          React.createElement('button', { className: 'wvp-btn', onClick: () => requestSend(false) }, '填入'),
          React.createElement('button', { className: 'wvp-btn primary', onClick: () => requestSend(true) }, '发送')
        ),
        m.annotations.length > 0 ? React.createElement('div', { className: 'wvp-anns' },
          m.annotations.map((a) => React.createElement('div', { key: a.id, className: 'wvp-ann' },
            React.createElement('span', { className: 'wvp-ann-sel', title: a.selector }, a.selector),
            React.createElement('span', { className: 'wvp-ann-text' }, a.text),
            React.createElement('button', { className: 'wvp-icobtn', title: '删除批注', onClick: () => removeAnnotation(a.id) }, '✕')
          ))
        ) : null
      ) : null,
      React.createElement('div', { className: 'wvp-frame-wrap' },
        m.url ? React.createElement('iframe', {
          key: reload,
          src: m.url && isExternal(m.url) ? toProxy(m.url) : m.url,
          className: 'wvp-frame',
          sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads',
          title: '网页预览',
          ref: (el) => { iframeEl = el },
          onLoad: onFrameLoad
        })
          : React.createElement('div', { className: 'wvp-empty' }, '未加载页面')
      )
    )
  }

  slots.inject('conversation.session.header.utilities', () => slots.register(
    { name: 'conversation.session.header.utilities', id: 'webpreview-play', label: '网页预览', order: 10 },
    (props) => React.createElement(PlayButton, props)
  ))

  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'webpreview-panel', order: 10 },
    (props) => React.createElement(PreviewPanel, props)
  ))
}

		exports.apply = apply;
		if (typeof inject !== "undefined") exports.inject = inject;
		return module.exports;
	}
});
