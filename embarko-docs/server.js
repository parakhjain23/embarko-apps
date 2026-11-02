// Serves guide/*.md three ways:
//   /quickstart        HTML page with sidebar (for people)
//   /quickstart.md     raw markdown (for agents, curl)
//   /quickstart.json   { topic, title, covers, headings, markdown }
//   /                  contents (README) · /llms.txt same as markdown · /llms-full.txt everything
// Markdown is the only source. Nothing is copied.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const DIR = path.join(__dirname, 'guide');
const PORT = process.env.PORT || 4300;
const VERSION = new Date().toISOString().slice(0, 10);

const raw = (t) => fs.readFileSync(path.join(DIR, (t === 'index' ? 'README' : t) + '.md'), 'utf8');
// Frontmatter: `requires: [deploy, claim]` is the only field pages declare.
const parse = (src) => {
	const m = src.match(/^---\n([\s\S]*?)\n---\n+/);
	const fm = {};
	if (m) for (const line of m[1].split('\n')) { const [k, ...v] = line.split(':'); fm[k.trim()] = v.join(':').trim(); }
	const requires = (fm.requires || '').replace(/[\[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
	return { requires, body: m ? src.slice(m[0].length) : src };
};
// The same context block on every topic, generated, so an agent that lands
// on /showcase directly still sees what must be true first and how to behave.
const header = (t, requires) => {
	if (t === 'index' || t === 'prerequisites') return '';
	const needs = requires.length ? `**Before this:** ${requires.map((r) => `[${r}](${r}.md)`).join(' → ')} must be done.` : '**Before this:** nothing.';
	// One runnable check per requirement, so the agent can confirm instead of assume.
	const CHECK = { deploy: '`status: "live"`', claim: '`claimed: true`' };
	const checks = requires.filter((r) => CHECK[r]).map((r) => CHECK[r]);
	const confirm = checks.length ? ` Confirm: \`GET https://ship.embarko.ai/apps/<name>/status\` returns ${checks.join(' and ')}. If not, do those first.` : '';
	return [
		'> ' + needs + confirm,
		'> **Route priority:** Embarko connector in your tools → MCP URL → the skill (`npx skills add embarko-ai/skill --skill embarko-deploy -g`) → raw API. Use the first you have.',
		'> **Reply to the person:** 1 to 2 plain sentences, no commands or tokens unless asked. All rules: [prerequisites](prerequisites.md).' + (t === 'quickstart' ? '' : ' Lost? [quickstart](quickstart.md).'),
		'',
		'',
	].join('\n');
};
const read = (t) => { const { requires, body } = parse(raw(t)); return header(t, requires) + body; };
const meta = (t) => parse(raw(t)).requires;
const topics = () => {
	// Order = the README's contents table, so llms-full.txt and the sidebar read in reading order.
	const listed = [...raw('index').matchAll(/^\| [^|]* \| \[([a-z-]+)\]/gm)].map((m) => m[1]);
	const all = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.slice(0, -3));
	return [...listed.filter((t) => all.includes(t)), ...all.filter((t) => !listed.includes(t)).sort()];
};
const title = (md) => (md.match(/^# (.+)$/m) || [, ''])[1];
const covers = (t) => (read('index').match(new RegExp('\\[' + t + '\\]\\([^)]*\\)\\s*\\|\\s*([^|]+)')) || [, ''])[1].trim();
const headings = (md) => [...md.matchAll(/^(#{2,3}) (.+)$/gm)].map((m) => ({ level: m[1].length, text: m[2] }));
const mdLinksToRoutes = (md) => md.replace(/\]\(([a-z-]+)\.md(#[^)]*)?\)/g, (_, t, h) => `](/${t === 'README' ? '' : t}${h || ''})`);

const page = (t, md) => {
	const nav = ['index', ...topics()].map((x) => {
		const label = x === 'index' ? 'Contents' : x;
		return `<a href="/${x === 'index' ? '' : x}"${x === t ? ' class="on"' : ''}>${label}</a>`;
	}).join('');
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title(md) || 'Embarko agent guide'}</title>
<link rel="alternate" type="text/markdown" href="/${t === 'index' ? 'llms.txt' : t + '.md'}">
<style>
:root{--bg:#f7f4ee;--sf:#fffdf9;--ink:#1a1816;--mute:#5c5751;--line:#e6e0d6}
@media(prefers-color-scheme:dark){:root{--bg:#16140f;--sf:#1e1b16;--ink:#f2ede4;--mute:#b9b2a6;--line:#2e2a23}}
*{box-sizing:border-box}body{margin:0;font:16px/1.6 Inter,system-ui,sans-serif;color:var(--ink);background:var(--bg)}
.wrap{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
nav{border-right:1px solid var(--line);padding:20px 12px;position:sticky;top:0;height:100vh;overflow:auto}
nav a{display:block;padding:6px 12px;border-radius:999px;color:var(--mute);text-decoration:none;font-size:14px}
nav a.on{background:var(--ink);color:var(--bg)}nav a:hover:not(.on){background:var(--sf)}
main{padding:32px 48px;max-width:860px}
h1{font-size:2rem;letter-spacing:-.01em}h2{margin-top:2.2rem;font-size:1.35rem}h3{font-size:1.1rem}
a{color:var(--ink)}code{background:var(--sf);border:1px solid var(--line);border-radius:5px;padding:.1em .35em;font-size:.88em}
pre{background:#1a1816;color:#f2ede4;padding:14px 16px;border-radius:10px;overflow:auto;font-size:.85rem}pre code{background:none;border:0;color:inherit;padding:0}
table{border-collapse:collapse;font-size:.92rem;width:100%}th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}th{background:var(--sf)}
blockquote{border-left:3px solid var(--line);margin:0;padding:4px 16px;color:var(--mute)}
.fmt{font-size:13px;color:var(--mute);margin-bottom:20px}.fmt a{margin-right:12px}
@media(max-width:700px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:4px}main{padding:20px 16px}}
</style></head><body><div class="wrap"><nav>${nav}</nav><main>
<div class="fmt">Formats: <a href="/${t === 'index' ? 'llms.txt' : t + '.md'}">markdown</a><a href="/${t}.json">json</a><a href="/llms-full.txt">llms-full.txt</a> · version ${VERSION}</div>
${marked.parse(mdLinksToRoutes(md))}</main></div></body></html>`;
};

const json = (t, md) => JSON.stringify({ topic: t, title: title(md), covers: covers(t), version: VERSION, requires: meta(t), check: meta(t).filter((r) => ({ deploy: 1, claim: 1 })[r]).map((r) => ({ deploy: 'GET /apps/<name>/status → status: "live"', claim: 'GET /apps/<name>/status → claimed: true' })[r]), route_priority: ['connector', 'mcp', 'skill', 'api'], reply: '1 to 2 plain sentences; no commands or tokens unless asked', headings: headings(md), markdown: md, url: { html: `/${t}`, markdown: `/${t}.md`, json: `/${t}.json` } }, null, 2);

http.createServer((req, res) => {
	const url = decodeURIComponent(req.url.split('?')[0]);
	const send = (status, type, body) => { res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Access-Control-Allow-Origin': '*' }); res.end(body); };
	try {
		if (url === '/llms.txt') return send(200, 'text/markdown', read('index'));
		if (url === '/llms-full.txt') return send(200, 'text/markdown', [read('index'), ...topics().map(read)].join('\n\n---\n\n'));
		const m = url.match(/^\/([a-z-]*)(\.md|\.json)?$/);
		if (!m) return send(404, 'text/plain', 'not found');
		const t = m[1] || 'index', fmt = m[2];
		const md = read(t);
		if (fmt === '.md') return send(200, 'text/markdown', md);
		if (fmt === '.json') return send(200, 'application/json', json(t, md));
		// Agents and curl get markdown from the bare route too, like here.now.
		const accept = req.headers.accept || '', ua = req.headers['user-agent'] || '';
		if (!accept.includes('text/html') || /curl|wget|python|node|bot/i.test(ua)) return send(200, 'text/markdown', md);
		return send(200, 'text/html', page(t, md));
	} catch (e) {
		if (e.code === 'ENOENT') return send(404, 'application/json', JSON.stringify({ error: 'No guide topic called "' + url.slice(1) + '".', code: 'unknown_topic', topics: topics() }));
		send(500, 'text/plain', String(e));
	}
}).listen(PORT, () => console.log(`guide on http://localhost:${PORT}`));
