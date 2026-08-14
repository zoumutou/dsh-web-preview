/**
 * dsh-web-preview-panel — Host half.
 *
 * Serves the workspace directory over `/__dsh-preview/<sessionId>/...` for
 * iframe preview (Markdown rendered, code shown with line numbers, images
 * raw), and exposes a small JSON API on `POST /__dsh-preview/api` used by the
 * Client half (set-root / pages / project detect-run-status-stop /
 * resolve-path). Non-static projects (Cargo/package.json/go.mod/py) can be
 * spawned with output collected and URL auto-detected.
 */
export const name = 'dsh-web-preview-panel'

export const inject = ['webServer', 'fs', 'subprocess', 'timer']

export function apply(ctx) {
  const base = '/__dsh-preview'
  const MAX = 256 * 1024 * 1024

  /** sessionId -> { root, project } */
  const sessions = new Map()
  const getSession = (sid) => {
    const key = sid || '__root__'
    let s = sessions.get(key)
    if (!s) {
      s = { root: null, project: null }
      sessions.set(key, s)
    }
    return s
  }

  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.xml': 'text/xml; charset=utf-8',
    '.webmanifest': 'application/manifest+json'
  }

  const CODE_EXT = ['.rs', '.py', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.go', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.swift', '.kt', '.sh', '.bash', '.zsh', '.sql', '.vue', '.svelte', '.scss', '.less', '.ini', '.conf', '.log', '.env', '.css', '.toml', '.yaml', '.yml', '.txt']

  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const render404 = (res, rel, root) => {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>文件不存在</title><style>' +
      'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d1117;color:#e6edf3;font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
      '.card{max-width:560px;width:calc(100% - 48px);padding:28px 32px;background:#161b22;border:1px solid #30363d;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
      'h1{font-size:16px;color:#ff9d9d;margin:0 0 10px}' +
      'code{background:#21262d;border-radius:6px;padding:2px 8px;font-size:12px;word-break:break-all;color:#9fe8a8}' +
      'p{color:#8b949e;margin:8px 0;font-size:13px}' +
      '.root{color:#484f58;font-size:11px;word-break:break-all}' +
      '</style></head><body><div class="card"><h1>⚠ 文件不存在</h1>' +
      '<p><code>' + escHtml(rel || '/') + '</code></p>' +
      '<p>预览根目录中找不到该文件（可能尚未创建，或路径来自其他项目）。</p>' +
      '<p class="root">根目录：' + escHtml(root || '未设置') + '</p>' +
      '<p>提示：点面板 ⋮ 菜单 →「📁 根目录设置」可切换到文件所在目录；或让 AI 先生成该文件。</p>' +
      '</div></body></html>'
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  }

  const codePage = (name, content) => {
    const lines = String(content || '').split('\n')
    const body = lines.map((l, i) => '<span class="ln">' + String(i + 1).padStart(4, ' ') + '</span>' + escHtml(l)).join('\n')
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escHtml(name) + '</title><style>' +
      'body{margin:0;background:#0d1117;color:#e6edf3;font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}' +
      '.head{position:sticky;top:0;background:rgba(13,17,23,.92);backdrop-filter:blur(8px);padding:8px 14px;border-bottom:1px solid #21262d;color:#8b949e;font-size:12px}' +
      'pre{margin:0;padding:10px 14px 20px;white-space:pre;overflow:auto;tab-size:4}' +
      '.ln{display:inline-block;width:44px;color:#484f58;user-select:none;margin-right:12px;text-align:right}' +
      '</style></head><body><div class="head">📄 ' + escHtml(name) + ' · ' + lines.length + ' 行</div><pre>' + body + '</pre></body></html>'
  }

  const mdToHtml = (name, src) => {
    const inline = (s) => {
      let t = escHtml(s)
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
      t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      return t
    }
    const out = []
    let inCode = false
    let buf = []
    const flush = () => {
      if (buf.length) { out.push('<pre class="code">' + escHtml(buf.join('\n')) + '</pre>'); buf = [] }
    }
    for (const raw of String(src || '').split('\n')) {
      const t = raw.trim()
      if (/^```/.test(t)) {
        if (inCode) { flush(); inCode = false } else { flush(); inCode = true }
        continue
      }
      if (inCode) { buf.push(raw); continue }
      if (!t) { out.push(''); continue }
      if (/^###\s+/.test(t)) out.push('<h3>' + inline(t.replace(/^###\s+/, '')) + '</h3>')
      else if (/^##\s+/.test(t)) out.push('<h2>' + inline(t.replace(/^##\s+/, '')) + '</h2>')
      else if (/^#\s+/.test(t)) out.push('<h1>' + inline(t.replace(/^#\s+/, '')) + '</h1>')
      else if (/^>\s?/.test(t)) out.push('<blockquote>' + inline(t.replace(/^>\s?/, '')) + '</blockquote>')
      else if (/^[-*]\s+/.test(t)) out.push('<li>' + inline(t.replace(/^[-*]\s+/, '')) + '</li>')
      else if (/^\d+\.\s+/.test(t)) out.push('<li>' + inline(t.replace(/^\d+\.\s+/, '')) + '</li>')
      else out.push('<p>' + inline(t) + '</p>')
    }
    flush()
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escHtml(name) + '</title><style>' +
      'body{margin:0;background:#0d1117;color:#e6edf3;font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:0 0 40px}' +
      '.head{position:sticky;top:0;background:rgba(13,17,23,.92);backdrop-filter:blur(8px);padding:10px 18px;border-bottom:1px solid #21262d;color:#8b949e;font-size:13px}' +
      '.md{max-width:780px;margin:0 auto;padding:12px 22px}' +
      '.md h1{font-size:26px;border-bottom:1px solid #21262d;padding-bottom:8px}' +
      '.md h2{font-size:20px;margin-top:28px}' +
      '.md h3{font-size:16px}' +
      '.md code{background:#161b22;border:1px solid #21262d;border-radius:5px;padding:1px 6px;font:12px ui-monospace,Menlo,monospace}' +
      '.md pre.code{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:12px 14px;overflow:auto;font:12px/1.6 ui-monospace,Menlo,monospace}' +
      '.md pre.code code{background:none;border:none;padding:0}' +
      '.md blockquote{margin:10px 0;padding:2px 14px;border-left:3px solid #30363d;color:#8b949e}' +
      '.md li{margin:3px 0}' +
      '.md a{color:#58a6ff}' +
      '</style></head><body><div class="head">📝 ' + escHtml(name) + '</div><div class="md">' + out.join('\n') + '</div></body></html>'
  }

  const cleanSegments = (rel) => (rel || '').split('/').filter((s) => s && s !== '.' && s !== '..')

  async function tryStat(abs) {
    try {
      const t = await ctx.fs.resolve(abs)
      const info = await ctx.fs.stat(t)
      if (!info) return null
      return { t, info }
    } catch (e) {
      return null
    }
  }

  async function defaultRoot() {
    try {
      const sp = ctx.get('sandboxPolicy')
      const p = sp && sp.workspaceRoot
      if (p) {
        const e = await tryStat(p)
        if (e && e.info.type === 'directory') return p
      }
    } catch (e) { /* noop */ }
    return null
  }

  // ---------- 静态文件服务 ----------
  async function serveStatic(req, res, segs, sess) {
    const root = sess.root
    const abs = segs.length ? root + '/' + segs.join('/') : root
    let entry = await tryStat(abs)
    // 回退：相对路径找不到时，尝试根目录顶层同名文件
    if (!entry && segs.length > 1) {
      const alt = await tryStat(root + '/' + segs[segs.length - 1])
      if (alt && alt.info.type === 'file') entry = alt
    }
    if (!entry) {
      render404(res, segs.join('/') || '/', root)
      return
    }
    let target = entry.t
    let info = entry.info
    if (info.type === 'directory') {
      const idx = await tryStat(abs + '/index.html')
      if (!idx || idx.info.type !== 'file') {
        render404(res, segs.join('/') || '/', root)
        return
      }
      target = idx.t
      info = idx.info
    } else if (info.type !== 'file') {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('forbidden')
      return
    }
    const rootT = await ctx.fs.resolve(root)
    if (!ctx.fs.contains(rootT, target)) {
      render404(res, segs.join('/') || '/', root)
      return
    }
    const name = segs.length ? segs[segs.length - 1] : 'index.html'
    const dot = name.lastIndexOf('.')
    const ext = dot >= 0 ? name.slice(dot).toLowerCase() : ''

    if (ext === '.md' || ext === '.markdown') {
      try {
        const text = await ctx.fs.readText(target)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(mdToHtml(name, text))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('read failed')
      }
      return
    }
    if (CODE_EXT.indexOf(ext) !== -1) {
      try {
        const text = await ctx.fs.readText(target)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(codePage(name, text))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('read failed')
      }
      return
    }

    const type = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    try {
      const bytes = await ctx.fs.readBytes(target, undefined, MAX)
      res.end(bytes)
    } catch (e) {
      const code = String((e && (e.code || e.name)) || '')
      if (code.includes('TOO_LARGE')) {
        res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('file too large')
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('read failed')
      }
    }
  }

  // ---------- 项目检测 / 运行 ----------
  const detect = async (root) => {
    try {
      const t = await ctx.fs.resolve(root)
      const children = await ctx.fs.listDir(t)
      const names = (children || []).map((c) => c.name)
      const has = (p) => names.indexOf(p) !== -1
      if (has('Cargo.toml')) return { type: 'rust', name: 'Rust 项目', run: ['cargo', 'run'] }
      if (has('package.json')) {
        try {
          const pkgT = await ctx.fs.resolve(root + '/package.json')
          const pkg = JSON.parse(await ctx.fs.readText(pkgT))
          const scripts = pkg && pkg.scripts
          if (scripts && scripts.dev) return { type: 'node', name: 'Node 项目', run: ['npm', 'run', 'dev'] }
          if (scripts && scripts.start) return { type: 'node', name: 'Node 项目', run: ['npm', 'start'] }
        } catch (e) { /* noop */ }
        return { type: 'node', name: 'Node 项目', run: ['npm', 'start'] }
      }
      if (has('go.mod')) return { type: 'go', name: 'Go 项目', run: ['go', 'run', '.'] }
      if (has('manage.py')) return { type: 'python', name: 'Django 项目', run: ['python3', 'manage.py', 'runserver', '127.0.0.1:8081'] }
      if (has('app.py')) return { type: 'python', name: 'Python 项目', run: ['python3', 'app.py'] }
      if (has('pyproject.toml') || has('requirements.txt')) return { type: 'python', name: 'Python 项目', run: ['python3', '-m', 'http.server', '8081'] }
      return { type: 'static', name: '静态网页', run: null }
    } catch (e) {
      return { type: 'unknown', name: '未知', run: null }
    }
  }

  const api = {}

  api['set-root'] = async (args) => {
    const path = args && typeof args.path === 'string' && args.path.trim() ? args.path.trim() : ''
    let chosen = path
    if (!chosen) chosen = await defaultRoot()
    if (!chosen) return { ok: false, error: '未提供有效目录路径' }
    const e = await tryStat(chosen)
    if (!e || e.info.type !== 'directory') return { ok: false, error: '不是有效目录: ' + chosen }
    const sess = getSession(args && args.sid)
    if (sess.root && sess.root !== chosen && sess.project && sess.project.handle && !sess.project.exited) {
      try { sess.project.handle.terminate() } catch (err) { /* noop */ }
    }
    sess.root = chosen
    return { ok: true, root: chosen, base: base + '/' + (args && args.sid ? args.sid : '__root__') }
  }

  api['pages'] = async (args) => {
    const sess = getSession(args && args.sid)
    if (!sess.root) return { ok: false, error: '预览根目录未设置' }
    const dir = args && typeof args.dir === 'string' ? args.dir : ''
    const segs = cleanSegments(dir)
    const abs = segs.length ? sess.root + '/' + segs.join('/') : sess.root
    const e = await tryStat(abs)
    if (!e || e.info.type !== 'directory') return { ok: true, root: sess.root, dir: segs.join('/'), dirs: [], pages: [] }
    let children
    try {
      children = await ctx.fs.listDir(e.t)
    } catch (err) {
      return { ok: false, error: '目录读取失败: ' + String((err && err.message) || err) }
    }
    const dirs = []
    const pages = []
    for (const c of children || []) {
      if (c.type === 'directory') dirs.push({ name: c.name, rel: segs.concat(c.name).join('/') })
      else if (c.type === 'file' && /(\.html?|\.md|\.markdown|\.[A-Za-z0-9]{1,6})$/i.test(c.name)) pages.push({ name: c.name, rel: segs.concat(c.name).join('/') })
    }
    return { ok: true, root: sess.root, dir: segs.join('/'), dirs, pages }
  }

  api['resolve-path'] = async (args) => {
    const sess = getSession(args && args.sid)
    const path = args && typeof args.path === 'string' ? args.path.trim() : ''
    if (!sess.root || !path) return { ok: false, error: '路径无效' }
    if (path.indexOf(sess.root) === 0) {
      const rel = path.slice(sess.root.length).replace(/^\/+/, '')
      if (rel) {
        const e = await tryStat(sess.root + '/' + rel)
        if (e && e.info.type === 'file') return { ok: true, url: base + '/' + (args && args.sid ? args.sid : '__root__') + '/' + rel }
      }
    }
    const name = path.split(/[\\/]/).pop()
    if (name) {
      const e = await tryStat(sess.root + '/' + name)
      if (e && e.info.type === 'file') return { ok: true, url: base + '/' + (args && args.sid ? args.sid : '__root__') + '/' + name }
    }
    return { ok: false, error: '文件不在预览根目录内: ' + path }
  }

  api['detect-project'] = async (args) => {
    const sess = getSession(args && args.sid)
    if (!sess.root) return { ok: false, error: '预览根目录未设置' }
    const d = await detect(sess.root)
    return { ok: true, type: d.type, name: d.name, run: d.run }
  }

  api['run-project'] = async (args) => {
    const sess = getSession(args && args.sid)
    if (!sess.root) return { ok: false, error: '预览根目录未设置' }
    if (sess.project && sess.project.handle && !sess.project.exited) {
      return { ok: true, running: true, kind: sess.project.kind, cmd: sess.project.cmd }
    }
    const d = await detect(sess.root)
    if (!d.run) return { ok: false, error: '静态项目无需运行，可直接预览本地文件' }
    let handle
    try {
      handle = ctx.subprocess.spawn({
        argv: d.run,
        cwd: sess.root,
        stdio: { stdin: 'ignore', stdout: { maxBytes: 2000000 }, stderr: { maxBytes: 2000000 } },
        graceMs: 8000
      })
    } catch (e) {
      return { ok: false, error: '启动失败: ' + String((e && e.message) || e) }
    }
    const entry = {
      handle,
      kind: d.type,
      cmd: d.run.join(' '),
      log: [],
      url: null,
      exited: false,
      exitCode: null,
      offOut: 0,
      offErr: 0
    }
    sess.project = entry
    handle.done.then((out) => {
      entry.exited = true
      entry.exitCode = out && out.exitCode === undefined ? null : (out && out.exitCode)
    }).catch(() => {
      entry.exited = true
      entry.exitCode = null
    })
    ctx.interval(() => {
      if (!sess.project || sess.project !== entry) return
      try {
        const rOut = entry.handle.collected.stdout
        const rErr = entry.handle.collected.stderr
        if (rOut) {
          const rd = rOut.readFrom(entry.offOut)
          entry.offOut = rd.nextOffset
          if (rd.text) entry.log.push(...rd.text.split(/\r?\n/).filter((l) => l.trim() !== ''))
        }
        if (rErr) {
          const rd = rErr.readFrom(entry.offErr)
          entry.offErr = rd.nextOffset
          if (rd.text) entry.log.push(...rd.text.split(/\r?\n/).filter((l) => l.trim() !== ''))
        }
      } catch (e) { /* noop */ }
      if (entry.log.length > 400) entry.log.splice(0, entry.log.length - 400)
      if (!entry.url) {
        const all = entry.log.join('\n')
        const mm = all.match(/https?:\/\/[A-Za-z0-9.:\[\]-]+/)
        if (mm) entry.url = mm[0].replace(/\.$/, '')
        else {
          const port = all.match(/localhost:(\d+)/)
          if (port) entry.url = 'http://localhost:' + port[1]
          else {
            const port2 = all.match(/127\.0\.0\.1:(\d+)/)
            if (port2) entry.url = 'http://127.0.0.1:' + port2[1]
          }
        }
      }
    }, 500)
    return { ok: true, starting: true, kind: d.type, cmd: d.run.join(' ') }
  }

  api['project-status'] = async (args) => {
    const sess = getSession(args && args.sid)
    const e = sess && sess.project
    if (!e) return { ok: true, running: false, log: [], url: null, kind: null, cmd: null, exitCode: null }
    return { ok: true, running: !e.exited, log: e.log.slice(-150), url: e.url, kind: e.kind, cmd: e.cmd, exitCode: e.exitCode }
  }

  api['stop-project'] = async (args) => {
    const sess = getSession(args && args.sid)
    const e = sess && sess.project
    if (e && e.handle && !e.exited) {
      try { e.handle.terminate() } catch (err) { /* noop */ }
      e.exited = true
    }
    return { ok: true }
  }

  api['state'] = async (args) => {
    const sess = getSession(args && args.sid)
    return { ok: true, root: sess.root, base: base + '/' + (args && args.sid ? args.sid : '__root__') }
  }

  // ---------- 统一入口：GET/HEAD 静态服务；POST /api JSON RPC ----------
  async function handle(req, res) {
    const raw = (req.url || '/').split('?')[0].split('#')[0]
    let decoded
    try {
      decoded = decodeURIComponent(raw)
    } catch (e) {
      decoded = raw
    }
    const isApi = req.method === 'POST' && /\/api\/?$/.test(decoded)
    if (isApi) {
      let body = ''
      req.setEncoding('utf8')
      for await (const chunk of req) body += chunk
      let payload = {}
      try {
        payload = body ? JSON.parse(body) : {}
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: '请求体不是合法 JSON' }))
        return
      }
      const method = payload.method
      const handler = api[method]
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: '未知 API 方法: ' + String(method) }))
        return
      }
      try {
        const result = await handler(payload.args || {})
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(result))
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }))
      }
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('method not allowed')
      return
    }
    let rel = decoded.startsWith(base) ? decoded.slice(base.length) : decoded
    const m = rel.match(/^\/([^/]+)(\/.*)?$/)
    const sid = m ? m[1] : ''
    const sub = m && m[2] ? m[2] : ''
    const segs = cleanSegments(sub)
    const sess = sessions.get(sid)
    if (!sess || !sess.root) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('preview root is not set')
      return
    }
    await serveStatic(req, res, segs, sess)
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: base, handler: handle }))

  // 插件卸载时终止所有运行中的项目进程
  ctx.effect(() => () => {
    for (const s of sessions.values()) {
      if (s.project && s.project.handle && !s.project.exited) {
        try { s.project.handle.terminate() } catch (e) { /* noop */ }
      }
    }
  })
}
