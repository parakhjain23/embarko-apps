// Serves docs/*.md to people (HTML) and agents (markdown, JSON, llms.txt).
// One markdown source. Everything else is generated at request time.
// Node stdlib only.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, 'docs');
const PORT = Number(process.env.PORT) || 4600;

// The three generated paragraphs every topic page opens with. Change the
// wording here and only here.
const ROUTE_PRIORITY = [
  'An Embarko connector in your tools (MCP). No token, works from a blocked sandbox.',
  'The embarko-deploy skill, if `scripts/deploy.sh` is present. Run it.',
  'Raw HTTP, as on this page.',
  'A JSON body on the same endpoint when you cannot upload a file (see [deploy](deploy)).',
];
const REPLY_TO_PERSON =
  'One to three plain sentences: what happened, what is still running, what you need only if something is needed. ' +
  'No commands, headers or tokens unless they ask. See [rules](rules).';

function parse(name) {
  const file = path.join(DOCS, `${name}.md`);
  if (!/^[a-z0-9-]+$/i.test(name) || !fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      const key = line.slice(0, i).trim();
      let value = line.slice(i + 1).trim();
      if (value.startsWith('[')) value = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      meta[key] = value;
    }
  }
  const body = m ? raw.slice(m[0].length) : raw;
  return { topic: name, title: meta.title || name, requires: meta.requires || [], check: meta.check || null, body };
}

function generatedBlock(doc) {
  const before = doc.requires.length
    ? doc.requires.map((r) => {
        const dep = parse(r);
        const check = dep && dep.check ? ` Check: \`${dep.check}\`` : '';
        return `- [${r}](${r}) done.${check}`;
      }).join('\n')
    : '- Nothing. This page stands alone.';
  const route = ROUTE_PRIORITY.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `**Before this**\n\n${before}\n\n**Route priority** (use the first available)\n\n${route}\n\n**Reply to the person**\n\n${REPLY_TO_PERSON}\n`;
}

// Full markdown for a topic: title, generated block, then the page.
function render(doc) {
  if (doc.topic === 'README') return doc.body.trim() + '\n';
  const lines = doc.body.trim().split('\n');
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  const head = lines.slice(0, h1 + 1).join('\n');
  const rest = lines.slice(h1 + 1).join('\n');
  return `${head}\n\n${generatedBlock(doc)}${rest}\n`;
}

function topics() {
  return fs.readdirSync(DOCS).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.slice(0, -3)).sort();
}

// Reading order = link order on the contents page.
function readingOrder() {
  const readme = parse('README').body;
  const seen = new Set();
  for (const m of readme.matchAll(/\]\(([a-z0-9-]+)\)/g)) seen.add(m[1]);
  for (const t of topics()) seen.add(t);
  return [...seen].filter((t) => fs.existsSync(path.join(DOCS, `${t}.md`)));
}

function headings(md) {
  return [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function html(doc, md) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${doc.topic === 'README' ? 'Embarko for agents' : esc(doc.title) + ' · Embarko for agents'}</title>
<style>
:root{--bg:#fff;--fg:#1b1b1b;--muted:#666;--line:#e4e4e4;--code:#f4f4f4;--link:#0a58ca}
@media(prefers-color-scheme:dark){:root{--bg:#121212;--fg:#e6e6e6;--muted:#9a9a9a;--line:#2a2a2a;--code:#1e1e1e;--link:#7ab4ff}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 64px}
nav{font-size:14px;color:var(--muted);margin-bottom:16px}nav a{color:var(--link);text-decoration:none}
a{color:var(--link)}h1{font-size:28px;margin:.2em 0 .6em}h2{font-size:20px;margin:1.6em 0 .5em;border-top:1px solid var(--line);padding-top:.8em}
code{background:var(--code);padding:1px 5px;border-radius:4px;font-size:.92em}pre{background:var(--code);padding:12px;border-radius:6px;overflow:auto}pre code{padding:0;background:none}
table{border-collapse:collapse;width:100%;font-size:14.5px;display:block;overflow:auto}th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
</style></head><body><main>
<nav><a href="/">Contents</a> · <a href="/${doc.topic === 'README' ? 'llms.txt' : doc.topic + '.md'}">markdown</a>${doc.topic === 'README' ? '' : ` · <a href="/${doc.topic}.json">json</a>`} · <a href="/llms-full.txt">everything</a></nav>
<div id="out"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
<script>
// Placeholders like <url> and <date> are text, not HTML: render raw HTML as escaped text.
const escText = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
marked.use({ renderer: { html: (t) => escText(typeof t === 'string' ? t : t.text) } });
document.getElementById('out').innerHTML = marked.parse(${JSON.stringify(md).replace(/</g, '\\u003c')});
</script>
</main></body></html>`;
}

function wantsHtml(req) {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  const accept = String(req.headers.accept || '');
  if (/curl|wget|python|node|go-http|java|httpie|libwww|okhttp|axios/.test(ua)) return false;
  return accept.includes('text/html');
}

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  let p = url.pathname.replace(/\/+$/, '') || '/';

  if (p === '/llms-full.txt') {
    const all = readingOrder().map((t) => render(parse(t))).join('\n---\n\n');
    return send(res, 200, 'text/markdown; charset=utf-8', render(parse('README')) + '\n---\n\n' + all);
  }

  let name = p === '/' || p === '/llms.txt' ? 'README' : p.slice(1);
  let format = 'auto';
  for (const ext of ['md', 'json', 'html']) {
    if (name.endsWith('.' + ext)) { name = name.slice(0, -(ext.length + 1)); format = ext; }
  }
  if (p === '/llms.txt') format = 'md';

  const doc = parse(name);
  if (!doc) {
    return send(res, 404, 'application/json', JSON.stringify({
      error: `No topic named "${name}".`, code: 'unknown_topic', topics: topics(), contents: '/llms.txt',
    }));
  }
  const md = render(doc);
  if (format === 'json') {
    return send(res, 200, 'application/json', JSON.stringify({
      topic: doc.topic, title: doc.title, requires: doc.requires, check: doc.check, headings: headings(md), markdown: md,
    }));
  }
  if (format === 'html' || (format === 'auto' && wantsHtml(req))) {
    return send(res, 200, 'text/html; charset=utf-8', html(doc, md));
  }
  return send(res, 200, 'text/markdown; charset=utf-8', md);
}

if (require.main === module) {
  http.createServer(handle).listen(PORT, () => console.log(`embarko-agent-docs on http://localhost:${PORT}`));
}

module.exports = { handle, parse, render, topics, readingOrder };
