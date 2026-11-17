// MSG91 Hello client: HTTP out, socket in. One shared store the UI reads with useSyncExternalStore.
import { io, type Socket } from "socket.io-client";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

const TOKEN = process.env.NEXT_PUBLIC_HELLO_WIDGET_TOKEN ?? "";
// Test environment. For production use api / chat / notifications.phone91.com and RTC "prod".
const ENV = {
  api: "https://testapi.phone91.com",
  socket: "https://testchat.phone91.com",
  notify: "https://testnotifications.phone91.com",
  rtc: "test" as const,
};
export const BOT_NAME = "AI Assistant";
const PAGE = 30;
const LS_ID = `hello:visitor:${TOKEN}`;
const LS_RATED = `hello:rated:${TOKEN}`;

export type Widget = {
  name?: string;
  tagline?: string;
  company_id: number;
  inbox_id: number;
  event_channels: string[];
  teams?: { id: number; name: string }[];
  bot_id?: string | number;
  bot_type?: string;
  voice_call_widget?: boolean;
  show_widget_form?: boolean;
  primary_color?: string;
  logo?: { path?: string } | null;
  feedback_text?: string;
  launch_widget?: boolean;
};
export type Attachment = { url: string; name: string; raw: Raw };
export type Interactive = {
  type?: string;
  header?: { type?: string; text?: string; link?: string; name?: string };
  body?: string;
  footer?: string;
  listLabel?: string;
  buttons: { label: string; url?: string }[];
  sections: { title?: string; rows: { title: string; description?: string }[] }[];
};
export type Who = "me" | "bot" | "agent";
export type Msg = {
  id: string;
  channel: string;
  who: Who;
  name?: string;
  senderId?: string;
  kind: string; // text | attachment | text-attachment | interactive | voice_call | feedback | greeting
  text: string;
  attachments: Attachment[];
  interactive?: Interactive;
  time: number;
  status?: "sending" | "failed";
  local?: boolean; // shown before the server confirmed it
  showMore?: boolean;
  reply?: { name?: string; text: string };
  feedback?: { token: string; id: string; rating?: number };
  callStatus?: string;
  retry?: SendOpts;
};
export type Chat = {
  id: number | null;
  channel: string;
  assignedType?: string;
  assignedId?: string | number | null;
  assignedName?: string;
  teamId?: number | null;
  unread: number;
  closed: boolean;
  blocked: boolean;
  last?: { text: string; mine: boolean; time: number };
};
export type Call = {
  status: "dialing" | "ringing" | "connected" | "ended";
  incoming: boolean;
  muted: boolean;
  since?: number;
  note?: string;
};
export type SendOpts = { text?: string; attachments?: Raw[]; replyTo?: Msg; type?: "voice_call" };
export type State = {
  phase: "idle" | "loading" | "ready" | "error";
  error?: string;
  widget?: Widget;
  visitorId?: string;
  profile: { name?: string; mail?: string; number?: string };
  chats: Chat[];
  messages: Record<string, Msg[]>;
  more: Record<string, boolean>;
  loading: Record<string, boolean>;
  typing: Record<string, boolean>;
  greeting?: { text: string; options: string[] };
  agents: Record<string, { name: string; image?: string }>;
  teams: Record<string, string>;
  online: boolean;
  open: boolean;
  screen: "home" | "chat";
  active: string | null; // channel on screen; null = new chat draft
  draftTeam: number | null;
  peek?: Msg; // newest message, shown by the launcher while closed
  popup?: Raw; // notification socket message
  call?: Call;
  rated: Record<string, number>;
  voice: boolean;
};

const uid = () => crypto.randomUUID().replaceAll("-", "");
const ms = (t: Raw) => {
  const n = Number(t) || Date.now();
  return n > 1e14 ? Math.floor(n / 1e4) : n < 1e11 ? n * 1000 : n;
};
const toAtt = (item: Raw): Attachment => {
  const url = typeof item === "object" && item ? item.path ?? item.url ?? "" : String(item ?? "");
  const name = (typeof item === "object" && item?.name) || decodeURIComponent(url.split("?")[0].split("/").pop() || "file");
  return { url, name, raw: item };
};
const mediaLink = (h: Raw) => h?.link ?? h?.url ?? h?.path;

export function parseInteractive(c: Raw): Interactive {
  const i = c?.interactive ?? c ?? {};
  const a = i.action ?? i.actions ?? {};
  const buttons: Interactive["buttons"] = (a.buttons ?? [])
    .map((b: Raw) => ({ label: b.reply?.title ?? b.title ?? b.text ?? "", url: b.url ?? (b.type === "url" ? b.payload : undefined) }))
    .filter((b: Raw) => b.label);
  if (a.parameters?.url) buttons.push({ label: a.parameters.display_text ?? "Open", url: a.parameters.url });
  const h = i.header;
  return {
    type: i.type,
    header: h && { type: h.type, text: h.text, link: mediaLink(h[h.type] ?? h), name: h.document?.filename },
    body: i.body?.text ?? (typeof i.body === "string" ? i.body : undefined),
    footer: i.footer?.text ?? (typeof i.footer === "string" ? i.footer : undefined),
    listLabel: a.button,
    buttons,
    sections: (a.sections ?? []).map((s: Raw) => ({
      title: s.title,
      rows: (s.rows ?? []).map((r: Raw) => ({ title: r.title, description: r.description })).filter((r: Raw) => r.title),
    })),
  };
}

function preview(m: Raw) {
  const c = m?.content ?? {};
  const text = m?.message_type === "interactive" ? parseInteractive(c).body : c.text;
  if (text) return String(text);
  if (m?.message_type === "voice_call") return "Voice call";
  return Array.isArray(c.attachment) && c.attachment.length ? "Attachment" : "";
}

class Hello {
  state: State = {
    phase: "idle",
    profile: {},
    chats: [],
    messages: {},
    more: {},
    loading: {},
    typing: {},
    agents: {},
    teams: {},
    online: false,
    open: false,
    screen: "home",
    active: null,
    draftTeam: null,
    rated: {},
    voice: false,
  };
  private listeners = new Set<() => void>();
  private api = ENV.api;
  private socketUrl = ENV.socket;
  private socket?: Socket;
  private notify?: Socket;
  private channels = new Set<string>();
  private myIds = new Set<string>();
  private presence = "";
  private started = false;
  private connectedOnce = false;
  private typingOn = false;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private waitTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private rtc: Raw;
  private callObj: Raw;
  private audio?: HTMLAudioElement;
  private userData = {}; // anonymous visitors. Logged-in: { unique_id, mail, number, user_jwt_token } from your server.

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  };
  get = () => this.state;
  private set(p: Partial<State> | ((s: State) => Partial<State>)) {
    this.state = { ...this.state, ...(typeof p === "function" ? p(this.state) : p) };
    this.listeners.forEach((l) => l());
  }
  private patchChat(channel: string, p: Partial<Chat> | ((c: Chat) => Partial<Chat>)) {
    this.set((s) => ({ chats: s.chats.map((c) => (c.channel === channel ? { ...c, ...(typeof p === "function" ? p(c) : p) } : c)) }));
  }
  private patchMsgs(channel: string, fn: (l: Msg[]) => Msg[]) {
    this.set((s) => ({ messages: { ...s.messages, [channel]: fn(s.messages[channel] ?? []) } }));
  }
  chat = (channel: string | null) => (channel ? this.state.chats.find((c) => c.channel === channel) : undefined);

  // ---------- HTTP ----------
  private auth = () => (this.state.visitorId ? `${TOKEN}:${this.state.visitorId}` : TOKEN);
  private async req(method: string, path: string, body?: Raw, form = false) {
    const res = await fetch(this.api + path, {
      method,
      headers: form ? { authorization: this.auth() } : { authorization: this.auth(), "content-type": "application/json" },
      body: form ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false || json?.status === "Failure") throw new Error(json?.message || json?.errors || `Request failed (${res.status})`);
    return json;
  }
  private post = (p: string, b: Raw) => this.req("POST", p, b);
  private put = (p: string, b: Raw) => this.req("PUT", p, b);
  private getJ = (p: string) => this.req("GET", p);

  // ---------- Boot ----------
  async init() {
    if (this.started) return;
    this.started = true;
    if (!TOKEN) return this.set({ phase: "error", error: "Widget token is missing." });
    this.set({ phase: "loading", error: undefined });
    try {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(LS_ID);
        this.set({ rated: JSON.parse(localStorage.getItem(LS_RATED) || "{}") });
      } catch {}
      // 1. region
      const r = await this.post("/routing-region/", { user_data: this.userData }).catch(() => null);
      if (r?.region_url) this.api = r.region_url;
      if (r?.socket_url) this.socketUrl = r.socket_url;
      // 2. widget
      const widget: Widget = await this.post("/widget-info/", { user_data: this.userData });
      this.set({ widget });
      // 3. visitor + chat list
      if (saved) this.setVisitor(saved);
      try {
        if (!saved) await this.newAnonymous();
        await this.reloadList();
      } catch (e) {
        if (!saved) throw e;
        await this.newAnonymous(); // saved id no longer valid
        await this.reloadList();
      }
      this.set((s) => ({ phase: "ready", open: s.open || !!widget.launch_widget }));
      // 4. socket
      await this.connect();
      // add-ons, in the background
      this.loadNames();
      this.loadGreeting();
      this.put("/add-domain/", { dom: location.href, user_data: this.userData }).catch(() => {});
      if (widget.voice_call_widget) this.initVoice();
      document.addEventListener("visibilitychange", () => {
        const s = this.state;
        if (document.visibilityState === "visible" && s.open && s.screen === "chat" && s.active) this.markRead(s.active);
      });
    } catch (e) {
      this.started = false;
      this.set({ phase: "error", error: (e as Error).message || "Could not load chat." });
    }
  }

  private async newAnonymous() {
    this.set({ visitorId: undefined });
    const res = await this.post("/anonymous-client-details/", {});
    this.setVisitor(res.data.uuid);
  }

  private setVisitor(id?: string) {
    if (!id || id === this.state.visitorId) return;
    this.myIds.add(id);
    this.set({ visitorId: id });
    try {
      localStorage.setItem(LS_ID, id);
    } catch {}
    const w = this.state.widget;
    if (w) this.sub([`ch-comp-${w.company_id}-${id}`]);
  }

  async reloadList() {
    const list = await this.post("/pubnub-channels/list/", { user_data: this.userData });
    this.setVisitor(list.uuid);
    this.presence = list.presence_channel || this.presence;
    const chats: Chat[] = (list.channels ?? [])
      .filter((c: Raw) => c.id != null)
      .map((c: Raw): Chat => {
        const lm = c.last_message?.message;
        return {
          id: c.id,
          channel: c.channel,
          assignedType: c.assigned_type ?? undefined,
          assignedId: c.assigned_id,
          assignedName: typeof c.assigned_to === "object" ? c.assigned_to?.name : undefined,
          teamId: c.team_id,
          unread: c.widget_unread_count ?? 0,
          closed: !!c.is_closed,
          blocked: !!c.is_blocked,
          last: lm ? { text: preview(lm), mine: !lm.sender_id && !lm.is_auto_response, time: ms(c.last_message.timetoken ?? lm.timetoken) } : undefined,
        };
      });
    this.sub((list.channels ?? []).map((c: Raw) => c.channel));
    this.set((s) => ({
      chats: [...s.chats.filter((c) => c.id == null && !chats.some((n) => n.channel === c.channel)), ...chats],
      profile: {
        name: list.pseudo_name ? s.profile.name : list.customer_name ?? s.profile.name,
        mail: list.customer_mail ?? s.profile.mail,
        number: list.customer_number ?? s.profile.number,
      },
    }));
  }

  // ---------- Socket ----------
  private sub(chs: string[]) {
    const fresh = chs.filter((c) => c && !this.channels.has(c));
    fresh.forEach((c) => this.channels.add(c));
    if (fresh.length && this.socket?.connected) this.socket.emit("subscribe", { channel: fresh }, () => {});
  }

  private async connect() {
    const w = this.state.widget!;
    const { data } = await this.getJ("/jwt-token/");
    this.sub([`ch-comp-${w.company_id}-${this.state.visitorId}`, ...(w.event_channels ?? [])]);
    const s = io(this.socketUrl, { auth: { token: data.jwt_token }, transports: ["websocket", "polling"] });
    this.socket = s;
    s.on("connect", () => {
      s.emit("subscribe", { channel: [...this.channels] }, () => {}); // server forgets after a disconnect
      this.set({ online: true });
      if (this.connectedOnce) this.resync();
      this.connectedOnce = true;
    });
    s.on("disconnect", () => this.set({ online: false }));
    s.on("NewPublish", (p: Raw) => this.onPublish(p?.response));
    s.on("Typing", (p: Raw) => {
      const d = p?.response ?? p ?? {};
      const channel = d.channel ?? d.data?.channel;
      const action = d.action ?? d.data?.action;
      if (channel && (d.type === "chat" || d.type === undefined)) this.setTyping(channel, action === "typing", 8000);
    });

    // popups / notifications: second socket, same token, dot before visitor id
    const n = io(ENV.notify, { auth: { token: data.jwt_token }, transports: ["websocket", "polling"] });
    this.notify = n;
    n.on("connect", () => n.emit("subscribe", { channel: [`ch-comp-${w.company_id}.${this.state.visitorId}`] }, () => {}));
    n.on("NewPublish", (p: Raw, ack: Raw) => {
      const m = p?.response?.message;
      if (m?.type !== "notification" || !m.content) return;
      this.set({ popup: m });
      if (typeof ack === "function") ack(m);
    });
  }

  private async resync() {
    await this.reloadList().catch(() => {});
    const a = this.state.active;
    if (a && this.chat(a)?.id) this.loadHistory(a);
  }

  private isMine(m: Raw) {
    return !!m.chat_id && (!m.client_sender_id || this.myIds.has(m.client_sender_id));
  }

  private toMsg(m: Raw, channel: string, id: string, time: number): Msg {
    const c = m.content ?? {};
    const kind = m.type === "feedback" ? "feedback" : m.message_type ?? "text";
    const inter = kind === "interactive" ? parseInteractive(c) : undefined;
    const who: Who = this.isMine(m) ? "me" : m.sender_id === "bot" || m.sender_id === "workflow" || m.is_auto_response ? "bot" : "agent";
    const sid = m.sender_id != null ? String(m.sender_id) : undefined;
    const rc = m.replied_msg_content;
    return {
      id,
      channel,
      who,
      senderId: sid,
      name: who === "agent" ? m.from_name || (sid && this.state.agents[sid]?.name) || "Support" : who === "bot" ? BOT_NAME : undefined,
      kind,
      text: inter ? inter.body ?? "" : typeof c === "string" ? c : c.text ?? "",
      attachments: (Array.isArray(c.attachment) ? c.attachment : []).map(toAtt).filter((a: Attachment) => a.url),
      interactive: inter,
      time,
      showMore: !!c.show_more,
      reply: rc ? { name: m.replied_from_name ?? undefined, text: typeof rc === "string" ? rc : rc.text ?? "Attachment" } : undefined,
      // id = outer message id (socket response.id / history item id), same as the official widget
      feedback: m.type === "feedback" ? { token: m.token, id, rating: Number(m.rating) || undefined } : undefined,
      callStatus: c.status,
    };
  }

  private onPublish(r: Raw) {
    const m = r?.message;
    if (!m?.new_event) return;
    const id = String(r.id || m.id || r.timetoken);
    const w = this.state.widget!;
    switch (m.type) {
      case "chat": {
        if (this.isMine(m)) {
          // our own echo: already on screen. Give the local copy its server id (needed for replies).
          const text = m.content?.text ?? "";
          this.patchMsgs(m.channel, (l) => {
            const i = l.findIndex((x) => x.local && x.who === "me" && !x.status && x.text === text);
            return i < 0 ? l : l.map((x, j) => (j === i ? { ...x, id, local: false } : x));
          });
          return;
        }
        const msg = this.toMsg(m, m.channel, id, ms(r.timetoken));
        this.incoming(m.channel, msg);
        if (m.message_type === "voice_call" && m.content?.status === "completed") this.loadHistory(m.channel);
        return;
      }
      case "feedback":
        return this.incoming(m.channel, this.toMsg(m, m.channel, id, ms(r.timetoken)));
      case "assign":
      case "new-channel":
        if (m.type === "new-channel") this.sub([m.channel]);
        if (m.channel_details?.channel) this.patchChat(m.channel_details.channel, { assignedType: m.channel_details.assigned_type ?? m.assigned_type });
        this.reloadList().catch(() => {});
        return;
      case "block": {
        const target = m.channel ? [m.channel] : this.state.chats.map((c) => c.channel);
        target.forEach((ch) => this.patchChat(ch, { blocked: !!m.value }));
        return;
      }
      case "update":
        if (m.client_id) {
          this.setVisitor(m.client_id);
          this.sub([`ch-comp-${w.company_id}-${m.client_id}`]);
        }
        return;
      case "bulk_state":
        (m.channels ?? []).forEach((ch: string) => this.patchChat(ch, { closed: m.new_state === "close" }));
        return;
    }
  }

  private incoming(channel: string, msg: Msg) {
    if (!channel) return;
    const chat = this.chat(channel);
    if (!chat) this.reloadList().catch(() => {});
    this.patchMsgs(channel, (l) => (l.some((x) => x.id === msg.id) ? l : [...l, msg]));
    this.setTyping(channel, false);
    const s = this.state;
    const viewing = s.open && s.screen === "chat" && s.active === channel && document.visibilityState === "visible";
    if (chat)
      this.patchChat(channel, (c) => ({
        last: { text: msg.kind === "feedback" ? "Rate your conversation" : msg.text || (msg.attachments.length ? "Attachment" : ""), mine: false, time: msg.time },
        unread: viewing ? 0 : c.unread + 1,
      }));
    if (viewing) this.markRead(channel);
    else if (!s.open) this.set({ peek: msg });
  }

  private setTyping(channel: string, on: boolean, autoOffMs = 0) {
    clearTimeout(this.waitTimers[channel]);
    if (on && autoOffMs) this.waitTimers[channel] = setTimeout(() => this.setTyping(channel, false), autoOffMs);
    if (!!this.state.typing[channel] !== on) this.set((s) => ({ typing: { ...s.typing, [channel]: on } }));
  }

  // visitor typing: one "typing" on start, one "not-typing" on stop
  typing() {
    const ch = this.state.active;
    if (!ch || !this.chat(ch)?.id) return;
    if (!this.typingOn) this.emitTyping(ch, true);
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.emitTyping(ch, false), 2500);
  }
  private emitTyping(channel: string, on: boolean) {
    const tc = this.state.widget?.event_channels?.find((c) => c.includes("typing"));
    this.typingOn = on;
    if (!on) clearTimeout(this.typingTimer);
    if (!tc || !this.socket) return;
    const action = on ? "typing" : "not-typing";
    this.socket.emit(action, { channel: tc, data: { action, channel } });
  }

  // ---------- Navigation ----------
  setOpen(open: boolean) {
    this.set({ open, peek: undefined });
    const s = this.state;
    if (open && s.screen === "chat" && s.active) this.markRead(s.active);
  }
  home() {
    if (this.typingOn && this.state.active) this.emitTyping(this.state.active, false);
    this.set({ screen: "home" });
  }
  newChat(teamId: number | null = null) {
    this.set({ screen: "chat", active: null, draftTeam: teamId });
  }
  openChat(channel: string) {
    this.set({ screen: "chat", active: channel, open: true, peek: undefined });
    this.markRead(channel);
    if (!this.state.messages[channel]) this.loadHistory(channel);
  }

  markRead(channel: string) {
    const c = this.chat(channel);
    if (!c?.id || !c.unread) return;
    this.patchChat(channel, { unread: 0 });
    this.req("DELETE", `/read-receipt/${channel}`).catch(() => {});
  }

  // ---------- History ----------
  async loadHistory(channel: string, older = false) {
    if (!this.chat(channel)?.id || this.state.loading[channel]) return; // server only knows sent chats
    const have = older ? (this.state.messages[channel] ?? []).filter((m) => !m.status && m.kind !== "greeting").length : 0;
    this.set((s) => ({ loading: { ...s.loading, [channel]: true } }));
    try {
      const res = await this.post("/get-history/", { channel, origin: "chat", page_size: PAGE, start_from: have + 1, user_data: this.userData });
      const items: Raw[] = res?.data?.data ?? [];
      const msgs = items.map((i) => this.toMsg(i.message ?? {}, channel, String(i.id ?? i.message?.id ?? i.timetoken), ms(i.timetoken))).reverse();
      this.patchMsgs(channel, (l) => {
        if (!older) return [...msgs, ...l.filter((m) => m.status)]; // keep unsent ones
        const ids = new Set(l.map((m) => m.id));
        return [...msgs.filter((m) => !ids.has(m.id)), ...l];
      });
      this.set((s) => ({ more: { ...s.more, [channel]: items.length >= PAGE } }));
    } catch {
      if (!this.state.messages[channel]) this.patchMsgs(channel, (l) => l);
    } finally {
      this.set((s) => ({ loading: { ...s.loading, [channel]: false } }));
    }
  }

  async expand(msg: Msg) {
    const res = await this.post("/get-history/", { channel: msg.channel, message_id: msg.id, origin: "chat", user_data: this.userData });
    const d = res?.data;
    const item = Array.isArray(d?.data) ? d.data[0] : Array.isArray(d) ? d[0] : d;
    const text = item?.message?.content?.text ?? item?.content?.text;
    if (text) this.patchMsgs(msg.channel, (l) => l.map((x) => (x.id === msg.id ? { ...x, text, showMore: false } : x)));
  }

  // ---------- Sending ----------
  async upload(file: File) {
    const form = new FormData();
    form.append("attachment", file);
    const up = await this.req("POST", `/v2/upload/?type=chat&inbox_id=${this.state.widget!.inbox_id}`, form, true);
    return up.data[0];
  }

  async send(opts: SendOpts) {
    const w = this.state.widget!;
    const text = opts.text?.trim() ?? "";
    const atts = opts.attachments ?? [];
    const message_type = opts.type ?? (atts.length ? (text ? "text-attachment" : "attachment") : "text");
    let channel = this.state.active;
    let chat = this.chat(channel);

    if (!channel || !chat) {
      // new chat: pick the channel name, subscribe, THEN send (or the first bot reply is lost)
      channel = `ch-comp-${w.company_id}.${uid()}`;
      this.sub([channel]);
      chat = { id: null, channel, unread: 0, closed: false, blocked: false, teamId: this.state.draftTeam, assignedType: w.bot_id ? "bot" : undefined };
      const g = this.state.greeting;
      const greet: Msg[] = g ? [{ id: `greet-${channel}`, channel, who: "bot", name: BOT_NAME, kind: "greeting", text: g.text, attachments: [], time: Date.now(), local: true }] : [];
      const newChat = chat;
      this.set((s) => ({ chats: [newChat, ...s.chats], active: channel, messages: { ...s.messages, [channel!]: greet } }));
    }
    const ch = channel;
    const localId = uid();
    if (message_type !== "voice_call") {
      this.emitTyping(ch, false);
      const mine: Msg = {
        id: localId, channel: ch, who: "me", kind: message_type, text, time: Date.now(), status: "sending", local: true, retry: opts,
        attachments: atts.map(toAtt),
        reply: opts.replyTo ? { name: opts.replyTo.who === "me" ? "You" : opts.replyTo.name, text: opts.replyTo.text || "Attachment" } : undefined,
      };
      this.patchMsgs(ch, (l) => [...l, mine]);
      this.patchChat(ch, { last: { text: text || "Attachment", mine: true, time: mine.time } });
    }

    const p = this.state.profile;
    const body: Raw = {
      type: "widget",
      widget_msg_id: localId,
      message_type,
      content: { text, attachment: atts },
      chat_id: chat.id,
      user_data: this.userData,
      sessionVariables: {}, // values your bot needs go here
    };
    if (opts.replyTo && !opts.replyTo.local) body.replied_on = opts.replyTo.id;
    const isNew = !chat.id;
    if (isNew)
      body.channelDetail = {
        uuid: this.state.visitorId,
        presence_channel: this.presence,
        customer_name: p.name || null,
        customer_number: p.number || null,
        customer_mail: p.mail || null,
        pseudo_name: p.name ? false : null,
        team_id: chat.teamId ?? null,
        new: true,
        channel_hex: ch,
      };

    try {
      const res = await this.post("/v2/send/", body);
      let final = ch;
      if (isNew) {
        const d = res.data ?? {};
        if (d.uuid) this.setVisitor(d.uuid);
        if (d.channel && d.channel !== ch) {
          // server picked another name: move over to it
          final = d.channel;
          this.socket?.emit("unsubscribe", { channel: [ch] }, () => {});
          this.channels.delete(ch);
          this.set((s) => {
            const { [ch]: moved, ...rest } = s.messages;
            return {
              messages: { ...rest, [final]: (moved ?? []).map((m) => ({ ...m, channel: final })) },
              chats: s.chats.map((c) => (c.channel === ch ? { ...c, channel: final } : c)),
              active: s.active === ch ? final : s.active,
            };
          });
        }
        this.sub([d.presence_channel, final]);
        this.patchChat(final, {
          id: d.id,
          assignedType: d.assigned_type ?? undefined,
          assignedId: d.assigned_id ?? d.assigned_to,
          teamId: d.team_id,
          closed: false,
        });
      }
      this.patchMsgs(final, (l) => l.map((m) => (m.id === localId ? { ...m, status: undefined, retry: undefined } : m)));
      const c = this.chat(final);
      if (message_type !== "voice_call" && c?.assignedType === "bot") this.setTyping(final, true, 30000);
      return res;
    } catch (e) {
      this.patchMsgs(ch, (l) => l.map((m) => (m.id === localId ? { ...m, status: "failed" } : m)));
      if (message_type === "voice_call") throw e;
    }
  }

  retry(msg: Msg) {
    this.patchMsgs(msg.channel, (l) => l.filter((m) => m.id !== msg.id));
    this.set({ active: msg.channel });
    if (msg.retry) this.send(msg.retry);
  }

  // ---------- Visitor details, rating, starters ----------
  needsForm() {
    const { widget, profile } = this.state;
    return !!widget?.show_widget_form && !(profile.name && profile.mail);
  }
  async saveProfile(p: { name: string; mail: string; number?: string }) {
    await this.put(`/v2/client/${this.state.visitorId}`, { Name: p.name, Email: p.mail, Phonenumber: p.number || undefined, user_data: this.userData });
    this.set({ profile: p });
  }

  async rate(msg: Msg, rating: number, comment: string) {
    if (!msg.feedback) return;
    await this.post("/receive-feedback/", {
      feedback_msg: comment, rating, token: msg.feedback.token, id: msg.feedback.id, type: "post-feedback", user_data: this.userData,
    });
    this.set((s) => ({ rated: { ...s.rated, [msg.id]: rating } }));
    try {
      localStorage.setItem(LS_RATED, JSON.stringify(this.state.rated));
    } catch {}
  }

  private async loadNames() {
    const w = this.state.widget!;
    const toMap = (v: Raw, f: (x: Raw) => Raw) =>
      Array.isArray(v) ? Object.fromEntries(v.map((x) => [String(x.id), f(x)])) : Object.fromEntries(Object.entries(v ?? {}).map(([k, x]) => [k, f(x)]));
    const r = await this.post("/agent-team/", { user_data: this.userData }).catch(() => ({}));
    this.set({
      agents: toMap(r.agents, (a) => (typeof a === "string" ? { name: a } : { name: a.name, image: a.image_url ?? undefined })),
      teams: { ...toMap(w.teams, (t) => t.name), ...toMap(r.teams, (t) => (typeof t === "string" ? t : t.name)) },
    });
  }

  private async loadGreeting() {
    const { company_id, bot_id, bot_type } = this.state.widget!;
    try {
      const res =
        bot_type === "chatgpt"
          ? await this.getJ(`/chat-gpt/greeting/?company_id=${company_id}&bot_id=${bot_id}`)
          : bot_type === "lex"
            ? await this.post("/chat-bot/welcome/get-welcome/", { company_id, bot_id })
            : null;
      const g = res?.data?.greeting;
      if (g?.text && g.is_enabled !== false) this.set({ greeting: { text: g.text, options: g.options ?? [] } });
    } catch {}
  }

  /** Optional: send custom events, e.g. hello.track({ plan: "pro" }) */
  track(event_data: Record<string, unknown>) {
    return this.put("/add-domain/", { user_data: this.userData, event_data }).catch(() => {});
  }

  dismissPopup = () => this.set({ popup: undefined });
  dismissPeek = () => this.set({ peek: undefined });

  // ---------- Voice ----------
  private async initVoice() {
    try {
      const t = await this.getJ("/web-rtc/get-client-token/");
      const mod: Raw = await import("msg91-webrtc-call");
      const make = mod.default?.default ?? mod.default;
      const EV = mod.WebRTC_EVENT ?? mod.default?.WebRTC_EVENT;
      this.rtc = make(t.data.jwt_token, ENV.rtc);
      if (!this.rtc) return;
      this.rtc.on(EV.INCOMING_CALL, (c: Raw) => this.attachCall(c, true));
      this.rtc.on(EV.OUTGOING_CALL, (c: Raw) => this.attachCall(c, false));
      this.set({ voice: true });
    } catch (e) {
      console.warn("[hello] voice calls unavailable", e);
    }
  }

  private attachCall(call: Raw, incoming: boolean) {
    this.callObj = call;
    this.set({ call: { status: incoming ? "ringing" : "dialing", incoming, muted: false }, ...(incoming ? { open: true } : {}) });
    const live = () => this.set((s) => ({ call: s.call && { ...s.call, status: "connected", since: s.call.since ?? Date.now() } }));
    call.on("answered", live);
    call.on("connected", (stream: MediaStream) => {
      this.audio ??= new Audio();
      this.audio.srcObject = stream;
      this.audio.play().catch(() => {});
      live();
    });
    call.on("ended", () => this.endCall());
    call.on("unavailable", () => this.endCall("Answered on another device"));
    call.on("error", (e: Raw) => this.endCall(e?.message || "Call failed"));
  }

  private endCall(note = "Call ended") {
    this.callObj = undefined;
    if (this.audio) this.audio.srcObject = null;
    this.set((s) => ({ call: s.call && { ...s.call, status: "ended", note } }));
    setTimeout(() => this.state.call?.status === "ended" && this.set({ call: undefined }), 2500);
  }

  async startCall() {
    if (this.state.call) return;
    this.set({ call: { status: "dialing", incoming: false, muted: false } });
    try {
      const res = await this.send({ type: "voice_call" });
      const token = res?.data?.call_jwt_token;
      if (!token || !this.rtc) throw new Error("Calling is not available right now");
      await this.rtc.call(token);
    } catch (e) {
      this.endCall((e as Error).message || "Call failed");
    }
  }

  callAction(a: "accept" | "reject" | "hang" | "mute" | "unmute") {
    const c = this.callObj;
    const st = this.state.call;
    if (!c) return this.endCall();
    if (a === "accept") c.accept();
    if (a === "reject") {
      c.reject();
      this.endCall("Call declined");
    }
    if (a === "hang") {
      if (st?.status === "dialing" && c.cancel) c.cancel();
      else c.hang();
      this.endCall();
    }
    if (a === "mute" || a === "unmute") {
      c[a]();
      this.set((s) => ({ call: s.call && { ...s.call, muted: a === "mute" } }));
    }
  }

  retryBoot() {
    this.init();
  }
}

export const hello = new Hello();

export function chatTitle(c: Chat | undefined, s: State) {
  if (!c || c.assignedType === "bot") return s.widget?.bot_id ? BOT_NAME : s.widget?.name || "Support";
  const id = c.assignedId != null ? String(c.assignedId) : "";
  if (c.assignedType === "team") return s.teams[id] || "Support team";
  return c.assignedName || s.agents[id]?.name || (c.teamId != null && s.teams[String(c.teamId)]) || s.widget?.name || "Support";
}
