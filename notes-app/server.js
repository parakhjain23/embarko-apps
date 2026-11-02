// Single-file app: backend (JSON API) + frontend (inline HTML). Run: node server.js
// Every new note is posted to the owner's Slack channel via Embarko Integrations.
import http from "http";
import fs from "fs";
import path from "path";
import { ViaSocket } from "viasocket-apps";

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || ".";
const SLACK_FILE = path.join(DATA_DIR, "slack.json");
const USER_ID = "owner"; // one shared Slack connection: the app owner's
const ADMIN_KEY = process.env.ADMIN_KEY; // only /?admin=KEY shows Slack setup

const viasocket = process.env.INTEGRATIONS_SECRET
  ? new ViaSocket({ orgId: process.env.INTEGRATIONS_ORG_ID, projectId: process.env.INTEGRATIONS_PROJECT_ID, secret: process.env.INTEGRATIONS_SECRET })
  : null;
const SLACK = { slug: "slack", actionId: "row1jrbor", version: "V107" }; // Slack "Send Message"

// ponytail: JSON files under DATA_DIR; SQLite when notes outgrow one file
const NOTES_FILE = path.join(DATA_DIR, "notes.json");
const readJsonFile = (f, fallback) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : fallback);
let notes = readJsonFile(NOTES_FILE, []);
let nextId = notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
const saveNotes = () => fs.writeFileSync(NOTES_FILE, JSON.stringify(notes));
let slack = readJsonFile(SLACK_FILE, {});
const saveSlack = () => fs.writeFileSync(SLACK_FILE, JSON.stringify(slack));

// Attachments: Embarko file storage (STORAGE_URL/STORAGE_TOKEN set by Embarko); local folder when absent
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|avif|ico|pdf|txt|md|csv|json|zip|gz|mp3|mp4|webm|wav|ogg|woff2?|ttf)$/i;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const storageUrl = () => `${process.env.STORAGE_URL}/apps/${process.env.APP_NAME}/files`;
async function storeFile(name, buffer) {
  if (!process.env.STORAGE_URL) { // local fallback
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const id = `${Date.now()}-${name}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, id), buffer);
    return { id, url: `/uploads/${id}` };
  }
  const res = await fetch(`${storageUrl()}/${encodeURIComponent(name)}`, {
    method: "PUT", headers: { Authorization: `Bearer ${process.env.STORAGE_TOKEN}`, "Content-Length": String(buffer.length) }, body: buffer });
  if (!res.ok) throw new Error((await res.json()).error || `upload failed (${res.status})`);
  const { id, url } = await res.json();
  return { id, url };
}
async function deleteFile(id) {
  if (!process.env.STORAGE_URL) return fs.rmSync(path.join(UPLOAD_DIR, id), { force: true });
  await fetch(`${storageUrl()}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${process.env.STORAGE_TOKEN}` } });
}

async function notifySlack(note) {
  if (!viasocket || !slack.scriptId || !slack.channelId) return;
  const text = note.file ? `${note.text}\nAttachment: ${note.file.url}` : note.text;
  const serviceId = await viasocket.catalog.serviceIdFor(SLACK.slug);
  const actionVersionId = await viasocket.catalog.versionIdFor(serviceId, SLACK.actionId, SLACK.version);
  await viasocket.runAction(slack.scriptId, actionVersionId, {
    destination: { messageto: "channel", channel_id: [slack.channelId] },
    markdown_content: `New note: ${text}`,
  });
}

const page = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notes</title>
<style>
  body{font-family:system-ui;max-width:480px;margin:40px auto;padding:0 16px;background:#fafafa;color:#222}
  form{display:flex;gap:8px}input,select{flex:1;padding:8px;font-size:16px}button{padding:8px 14px;cursor:pointer}
  ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #ddd}
  #slack{display:none;gap:8px;align-items:center;margin:16px 0;font-size:14px}#slack img{width:20px}
</style></head><body>
<h1>Notes</h1>
<form id="f"><input id="t" placeholder="New note" required maxlength="200"><input type="file" id="file" style="flex:0;max-width:120px"><button>Add</button></form>
<p id="err" style="color:#b00;font-size:14px"></p>
<div id="slack"><img src="https://stuff.thingsofbrand.com/slack.com/images/img668216333e_slack.jpg" alt="">
  <button id="connect">Connect Slack</button><select id="channel" hidden></select><span id="status"></span></div>
<ul id="list"></ul>
<script type="module">
import { connect, loadConnectScript } from "/viasocket-browser.js";
const $=id=>document.getElementById(id);
async function load(){render(await (await fetch("/api/notes")).json())}
function render(ns){$("list").innerHTML=ns.map(n=>'<li><span>'+esc(n.text)+(n.file?' <a href="'+esc(n.file.url)+'" target="_blank">📎 '+esc(n.file.name)+'</a>':'')+'</span><button data-id="'+n.id+'">✕</button></li>').join("")}
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
$("f").onsubmit=async e=>{e.preventDefault();$("err").textContent="";
  let file=null;const f=$("file").files[0];
  if(f){const r=await fetch("/api/upload?name="+encodeURIComponent(f.name),{method:"POST",body:f});const j=await r.json();if(!r.ok)return $("err").textContent=j.error;file=j}
  const r=await fetch("/api/notes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:$("t").value,file})});
  if(!r.ok)return $("err").textContent=(await r.json()).error;
  $("t").value="";$("file").value="";load()};
$("list").onclick=async e=>{const id=e.target.dataset.id;if(id){await fetch("/api/notes/"+id,{method:"DELETE"});load()}};
load();

// Slack setup: owner only (/?admin=KEY)
const admin=new URLSearchParams(location.search).get("admin");
const H={"content-type":"application/json","x-admin-key":admin||""};
const s=admin?await (await fetch("/api/slack",{headers:H})).json():{};
if(s.enabled){
  $("slack").style.display="flex";
  if(s.connected) showChannels(s.channelId); else loadConnectScript();
  $("connect").onclick=async()=>{
    try{
      const {authId}=await connect({embedToken:s.token,serviceId:s.serviceId,actions:["row1jrbor"],skipActionSelection:true,onLateSuccess:({authId})=>connected(authId)});
      connected(authId);
    }catch(err){if(err.code!=="closed")$("status").textContent=err.message}
  };
}
async function connected(authId){
  $("status").textContent="Connecting…";
  await fetch("/api/slack/connected",{method:"POST",headers:H,body:JSON.stringify({authId})});
  $("status").textContent="";showChannels();
}
async function showChannels(current){
  $("connect").hidden=true;const sel=$("channel");sel.hidden=false;sel.innerHTML='<option value="">Choose channel…</option>';
  const {options}=await (await fetch("/api/slack/channels",{headers:H})).json();
  for(const o of options)sel.add(new Option(o.label,o.value,false,o.value===current));
  sel.onchange=async()=>{await fetch("/api/slack/channel",{method:"POST",headers:H,body:JSON.stringify({channelId:sel.value})});$("status").textContent=sel.value?"✓ notifying":""};
  if(current)$("status").textContent="✓ notifying";
}
</script></body></html>`;

const browserJs = fs.readFileSync(new URL("./node_modules/viasocket-apps/dist/esm/browser.js", import.meta.url));

function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
  });
}

http.createServer(async (req, res) => {
  const { method } = req;
  const url = req.url.split("?")[0]; // path only, so /?admin=KEY still serves the page
  try {
    if (url === "/" && method === "GET") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(page);
    }
    if (url === "/viasocket-browser.js") {
      res.writeHead(200, { "content-type": "text/javascript" });
      return res.end(browserJs);
    }
    if (url === "/api/notes" && method === "GET") return json(res, 200, notes);
    if (url.startsWith("/uploads/") && method === "GET") { // local fallback only
      const f = path.join(UPLOAD_DIR, path.basename(url));
      if (!fs.existsSync(f)) return json(res, 404, { error: "not found" });
      res.writeHead(200); return fs.createReadStream(f).pipe(res);
    }
    if (url === "/api/upload" && method === "POST") {
      const name = path.basename(new URL(req.url, "http://x").searchParams.get("name") || "").slice(0, 200);
      if (!ALLOWED_EXT.test(name)) return json(res, 400, { error: "file type not allowed" });
      if (Number(req.headers["content-length"]) > MAX_FILE_BYTES) return json(res, 413, { error: "file too large (max 25 MB)" });
      const chunks = []; for await (const c of req) chunks.push(c);
      const buffer = Buffer.concat(chunks);
      if (!buffer.length) return json(res, 400, { error: "empty file" });
      const { id, url: fileUrl } = await storeFile(name, buffer);
      return json(res, 201, { id, url: fileUrl, name });
    }
    if (url === "/api/notes" && method === "POST") {
      const body = await readJson(req);
      const text = body?.text, file = body?.file;
      if (typeof text !== "string" || !text.trim() || text.length > 200) return json(res, 400, { error: "text required (1-200 chars)" });
      if (file && (typeof file.id !== "string" || typeof file.url !== "string" || typeof file.name !== "string")) return json(res, 400, { error: "bad file" });
      const note = { id: nextId++, text: text.trim(), ...(file && { file: { id: file.id, url: file.url, name: file.name } }) };
      notes.push(note);
      saveNotes();
      notifySlack(note).catch((e) => console.error("slack:", e.message)); // never block the note on Slack
      return json(res, 201, note);
    }
    const m = url.match(/^\/api\/notes\/(\d+)$/);
    if (m && method === "DELETE") {
      const gone = notes.find((n) => n.id === Number(m[1]));
      if (!gone) return json(res, 404, { ok: false });
      notes = notes.filter((n) => n !== gone);
      saveNotes();
      if (gone.file) deleteFile(gone.file.id).catch((e) => console.error("delete file:", e.message));
      return json(res, 200, { ok: true });
    }

    // Slack setup: owner only
    if (url.startsWith("/api/slack")) {
      if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) return json(res, 403, { error: "forbidden" });
    }
    if (url === "/api/slack" && method === "GET") {
      if (!viasocket) return json(res, 200, { enabled: false });
      return json(res, 200, { enabled: true, connected: !!slack.scriptId, channelId: slack.channelId || null,
        token: await viasocket.user(USER_ID).token(), serviceId: await viasocket.catalog.serviceIdFor(SLACK.slug) });
    }
    if (viasocket && url === "/api/slack/connected" && method === "POST") {
      const authId = (await readJson(req))?.authId;
      if (typeof authId !== "string" || !authId) return json(res, 400, { error: "authId required" });
      const user = viasocket.user(USER_ID);
      const serviceId = await viasocket.catalog.serviceIdFor(SLACK.slug);
      const scriptId = (await user.findEnabled(serviceId)) ?? (await user.enable(serviceId, authId)).scriptId;
      slack = { authId, scriptId, channelId: slack.channelId };
      saveSlack();
      return json(res, 200, { ok: true });
    }
    if (viasocket && url === "/api/slack/channels" && method === "GET") {
      if (!slack.authId) return json(res, 400, { error: "connect Slack first" });
      const serviceId = await viasocket.catalog.serviceIdFor(SLACK.slug);
      const actionVersionId = await viasocket.catalog.versionIdFor(serviceId, SLACK.actionId, SLACK.version);
      const { options } = await viasocket.user(USER_ID).listOptions(actionVersionId, {
        fieldKey: "destination.channel_id", authId: slack.authId, existingFields: { destination: { messageto: "channel" } } });
      return json(res, 200, { options });
    }
    if (viasocket && url === "/api/slack/channel" && method === "POST") {
      const channelId = (await readJson(req))?.channelId;
      if (typeof channelId !== "string") return json(res, 400, { error: "channelId required" });
      slack.channelId = channelId || undefined;
      saveSlack();
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    console.error(e);
    json(res, 500, { error: e.message });
  }
}).listen(PORT, "0.0.0.0", () => console.log("http://localhost:" + PORT));
