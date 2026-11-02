// One runnable check: every route answers in every format, and every
// link on the contents page resolves. `node test.js`.
const http = require('http');
const assert = require('assert');
const { handle, topics, readingOrder } = require('./server');

const server = http.createServer(handle).listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const get = (p, headers = {}) => fetch(base + p, { headers }).then(async (r) => ({ status: r.status, type: r.headers.get('content-type'), body: await r.text() }));
  try {
    const llms = await get('/llms.txt');
    assert.equal(llms.status, 200);
    assert.match(llms.type, /markdown/);
    assert.match(llms.body, /Deploying\? Read only/);

    const html = await get('/quickstart', { accept: 'text/html', 'user-agent': 'Mozilla/5.0' });
    assert.match(html.type, /html/);
    assert.match(html.body, /marked\.min\.js/);
    assert.ok(!html.body.includes('&lt;app-name&gt;'), 'placeholders are not double-escaped');
    assert.ok(html.body.includes('\\u003cdate>'), 'markdown is embedded as a JS string');

    const curl = await get('/quickstart', { accept: '*/*', 'user-agent': 'curl/8.0' });
    assert.match(curl.type, /markdown/);
    assert.match(curl.body, /\*\*Before this\*\*/);
    assert.match(curl.body, /Route priority/);

    const json = await get('/env-vars.json');
    const j = JSON.parse(json.body);
    assert.deepEqual(j.requires, ['claim']);
    assert.ok(j.headings.includes('Errors'));
    assert.match(j.markdown, /test -n "\$DEPLOY_TOKEN"/, 'required topic check is pulled in');

    const full = await get('/llms-full.txt');
    for (const t of topics()) assert.ok(full.body.includes(`# `), t);
    assert.equal(readingOrder().length, topics().length, 'every topic is in reading order');

    const missing = await get('/nope');
    assert.equal(missing.status, 404);
    assert.equal(JSON.parse(missing.body).code, 'unknown_topic');

    // Every relative link in every page points at a real topic.
    for (const t of ['README', ...topics()]) {
      const md = (await get(`/${t}.md`)).body;
      for (const m of md.matchAll(/\]\(([a-z0-9-]+)\)/g)) assert.ok(topics().includes(m[1]), `${t} links to missing ${m[1]}`);
    }
    console.log('ok');
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
