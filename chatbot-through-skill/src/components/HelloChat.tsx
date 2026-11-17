"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { hello, chatTitle, BOT_NAME, type Attachment, type Chat, type Msg, type State } from "@/lib/hello";

const useHello = () => useSyncExternalStore(hello.subscribe, hello.get, hello.get);

/* ---------------- icons ---------------- */
const P = {
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  x: "M18 6 6 18M6 6l12 12",
  back: "m15 18-6-6 6-6",
  next: "m9 18 6-6-6-6",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z",
  clip: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z",
  reply: "M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  micOff: "m2 2 20 20M18.89 13.23A7 7 0 0 0 19 12v-2M5 10v2a7 7 0 0 0 12 5M15 9.34V5a3 3 0 0 0-5.68-1.33M9 9v3a3 3 0 0 0 5.12 2.12M12 19v3",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  alert: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  link: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check: "M20 6 9 17l-5-5",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
};
function I({ n, className = "size-5", fill }: { n: keyof typeof P; className?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[n]} />
    </svg>
  );
}

/* ---------------- helpers ---------------- */
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
const shortTime = (t: number) => (sameDay(t, Date.now()) ? timeFmt.format(t) : dateFmt.format(t));
const dayLabel = (t: number) => (sameDay(t, Date.now()) ? "Today" : sameDay(t, Date.now() - 864e5) ? "Yesterday" : dateFmt.format(t));
const initials = (s = "?") => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const isImg = (a: Attachment) => /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i.test(a.url) || /^image\//.test(a.raw?.mime_type ?? a.raw?.type ?? "");
const isVideo = (a: Attachment) => /\.(mp4|webm|mov)(\?|$)/i.test(a.url);
const isAudio = (a: Attachment) => /\.(mp3|wav|ogg|m4a|aac|opus)(\?|$)/i.test(a.url);

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s<]+|\*\*[^*\n]+\*\*)/g).map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">
            {p}
          </a>
        ) : p.length > 4 && p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          p
        ),
      )}
    </>
  );
}

function Avatar({ who, name, s, size = "size-8" }: { who: "bot" | "agent" | "brand"; name?: string; s: State; size?: string }) {
  const logo = s.widget?.logo?.path;
  const agentImg = who === "agent" ? Object.values(s.agents).find((a) => a.name === name)?.image : undefined;
  const src = agentImg || (who !== "agent" ? logo : undefined);
  if (src) return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  return (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-(--brand) text-[11px] font-semibold text-white ring-2 ring-white`}>
      {who === "bot" ? <I n="spark" className="size-4" /> : initials(name || s.widget?.name)}
    </span>
  );
}

const iconBtn = "grid size-9 place-items-center rounded-full transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white";

/* ---------------- root ---------------- */
export default function HelloChat() {
  const s = useHello();
  useEffect(() => {
    hello.init();
  }, []);
  if (s.phase === "idle") return null;

  const unread = s.chats.reduce((n, c) => n + c.unread, 0);
  const style = { "--brand": s.widget?.primary_color || "#1A6222" } as CSSProperties;

  return (
    <div style={style} className="font-sans text-[14px] text-zinc-900 antialiased">
      {s.popup && <Popup m={s.popup} />}
      {s.open && <Panel s={s} />}
      {!s.open && s.peek && <Peek m={s.peek} s={s} />}
      <button
        onClick={() => hello.setOpen(!s.open)}
        aria-label={s.open ? "Close chat" : "Open chat"}
        className={`fixed right-5 bottom-5 z-[2147483000] grid size-14 place-items-center rounded-full bg-(--brand) text-white shadow-lg shadow-black/20 transition hover:scale-105 active:scale-95 ${s.open ? "max-sm:hidden" : ""}`}
      >
        <span className="transition-transform duration-300" style={{ transform: s.open ? "rotate(90deg)" : "none" }}>
          <I n={s.open ? "x" : "chat"} className="size-6" />
        </span>
        {!s.open && unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

function Panel({ s }: { s: State }) {
  const [drag, setDrag] = useState(false);
  return (
    <section
      role="dialog"
      aria-label="Chat"
      className="hello-pop fixed right-5 bottom-24 z-[2147483000] flex h-[min(680px,calc(100dvh-120px))] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 shadow-black/25 ring-black/5 max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none"
      onDragOver={(e) => {
        if (s.screen === "chat" && e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDrag(true);
        }
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={() => setDrag(false)}
    >
      {s.phase === "ready" ? (
        s.screen === "chat" ? (
          <ChatView s={s} drag={drag} />
        ) : (
          <Home s={s} />
        )
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          {s.phase === "error" ? (
            <>
              <span className="grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
                <I n="alert" />
              </span>
              <p className="font-medium">Chat is unavailable right now</p>
              <p className="text-sm text-zinc-500">{s.error}</p>
              <button onClick={() => hello.retryBoot()} className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white">
                Try again
              </button>
            </>
          ) : (
            <span className="size-8 animate-spin rounded-full border-3 border-zinc-200 border-t-zinc-500" aria-label="Loading" />
          )}
        </div>
      )}
      {s.call && <CallOverlay s={s} />}
    </section>
  );
}

/* ---------------- home ---------------- */
function Home({ s }: { s: State }) {
  const w = s.widget!;
  const teams = w.teams ?? [];
  const [picking, setPicking] = useState(false);
  const chats = [...s.chats].filter((c) => c.id != null).sort((a, b) => (b.last?.time ?? 0) - (a.last?.time ?? 0));
  const start = () => (teams.length > 1 ? setPicking(true) : hello.newChat(teams[0]?.id ?? null));
  const agentList = Object.values(s.agents).slice(0, 3);

  return (
    <>
      <header className="relative shrink-0 bg-(--brand) px-6 pt-5 pb-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/15 via-transparent to-black/25" />
        <div className="relative flex items-center justify-between">
          {w.logo?.path ? (
            <img src={w.logo.path} alt={w.name} className="h-8 max-w-32 object-contain" />
          ) : (
            <span className="grid size-9 place-items-center rounded-xl bg-white/20 text-sm font-bold">{initials(w.name)}</span>
          )}
          <button onClick={() => hello.setOpen(false)} className={iconBtn} aria-label="Close chat">
            <I n="x" />
          </button>
        </div>
        <h2 className="relative mt-6 text-[26px] leading-tight font-semibold tracking-tight">Hi there 👋</h2>
        <p className="relative mt-1 text-[15px] text-white/85">{w.tagline || "How can we help you today?"}</p>
      </header>

      <div className="-mt-10 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        <div className="relative rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5">
          {picking ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <button onClick={() => setPicking(false)} className="grid size-7 place-items-center rounded-full hover:bg-zinc-100" aria-label="Back">
                  <I n="back" className="size-4" />
                </button>
                <p className="font-semibold">Who would you like to talk to?</p>
              </div>
              <div className="space-y-2">
                {teams.map((t) => (
                  <button key={t.id} onClick={() => hello.newChat(t.id)} className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-left font-medium transition hover:border-(--brand) hover:bg-zinc-50">
                    {t.name}
                    <I n="next" className="size-4 text-zinc-400" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {w.bot_id && <Avatar who="bot" s={s} />}
                  {agentList.map((a) => (
                    <Avatar key={a.name} who="agent" name={a.name} s={s} />
                  ))}
                </div>
                <div>
                  <p className="font-semibold">Send us a message</p>
                  <p className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                    <span className={`size-2 rounded-full ${s.online ? "bg-emerald-500" : "bg-amber-400"}`} />
                    {s.online ? (w.bot_id ? "Our assistant replies instantly" : "We're online") : "Connecting…"}
                  </p>
                </div>
              </div>
              <button onClick={start} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-(--brand) px-4 py-3 font-medium text-white transition hover:brightness-110 active:brightness-95">
                Start a conversation
                <I n="send" className="size-4" />
              </button>
            </>
          )}
        </div>

        {chats.length > 0 && (
          <div className="rounded-2xl bg-white shadow-md ring-1 ring-black/5">
            <p className="px-4 pt-4 pb-2 text-[13px] font-semibold text-zinc-500">Recent conversations</p>
            <ul>
              {chats.map((c) => (
                <ChatRow key={c.channel} c={c} s={s} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function ChatRow({ c, s }: { c: Chat; s: State }) {
  const title = chatTitle(c, s);
  return (
    <li>
      <button onClick={() => hello.openChat(c.channel)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-zinc-50">
        <Avatar who={c.assignedType === "bot" ? "bot" : "agent"} name={title} s={s} size="size-10" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`truncate ${c.unread ? "font-semibold" : "font-medium"}`}>{title}</span>
            {c.closed && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 uppercase">Closed</span>}
            <span className="ml-auto shrink-0 text-xs text-zinc-400">{c.last ? shortTime(c.last.time) : ""}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className={`truncate text-[13px] ${c.unread ? "font-medium text-zinc-800" : "text-zinc-500"}`}>
              {c.last?.mine && "You: "}
              {c.last?.text.replace(/\*\*/g, "") || "No messages yet"}
            </span>
            {c.unread > 0 && <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-(--brand) px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

/* ---------------- chat ---------------- */
type Pending = { key: string; file: File; url?: string; item?: unknown; error?: string };

function ChatView({ s, drag }: { s: State; drag: boolean }) {
  const chat = s.chats.find((c) => c.channel === s.active);
  const msgs = s.active ? (s.messages[s.active] ?? []) : [];
  const title = chatTitle(chat, s);
  const typing = !!(s.active && s.typing[s.active]);
  const [replyTo, setReplyTo] = useState<Msg>();
  const [files, setFiles] = useState<Pending[]>([]);
  const needsForm = !chat && hello.needsForm();
  const firstTime = !s.chats.some((c) => c.id != null);
  const sub = typing ? "typing…" : !s.online ? "Reconnecting…" : chat?.assignedType === "bot" || (!chat && s.widget?.bot_id) ? "AI assistant · replies instantly" : chat?.assignedType === "team" ? "Support team" : chat ? "Support" : s.widget?.tagline;

  const addFiles = (list: FileList | File[]) => {
    for (const file of Array.from(list)) {
      const p: Pending = { key: crypto.randomUUID(), file, url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
      setFiles((f) => [...f, p]);
      hello
        .upload(file)
        .then((item) => setFiles((f) => f.map((x) => (x.key === p.key ? { ...x, item } : x))))
        .catch((e) => setFiles((f) => f.map((x) => (x.key === p.key ? { ...x, error: e.message || "Upload failed" } : x))));
    }
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length && !needsForm) addFiles(e.dataTransfer.files);
      }}
    >
      <header className="relative flex shrink-0 items-center gap-2 bg-(--brand) px-2 py-2.5 text-white">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/10 to-transparent" />
        <button onClick={() => hello.home()} className={`relative ${iconBtn}`} aria-label="Back to conversations">
          <I n="back" />
        </button>
        <div className="relative">
          <Avatar who={chat?.assignedType === "agent" || chat?.assignedType === "team" ? "agent" : "bot"} name={title} s={s} size="size-9" />
          <span className={`absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-(--brand) ${s.online ? "bg-emerald-400" : "bg-amber-400"}`} />
        </div>
        <div className="relative min-w-0 flex-1 pl-1">
          <p className="truncate leading-tight font-semibold">{title}</p>
          <p className="truncate text-[12px] text-white/80">{sub}</p>
        </div>
        {s.voice && !needsForm && (
          <button onClick={() => hello.startCall()} disabled={!!s.call || chat?.blocked} className={`relative ${iconBtn} disabled:opacity-40`} aria-label="Start voice call">
            <I n="phone" className="size-[18px]" />
          </button>
        )}
        <button onClick={() => hello.setOpen(false)} className={`relative ${iconBtn}`} aria-label="Close chat">
          <I n="x" />
        </button>
      </header>

      {!s.online && <div className="shrink-0 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">Connection lost. Reconnecting…</div>}

      <MessageList s={s} chat={chat} msgs={msgs} typing={typing} onReply={setReplyTo} firstTime={firstTime} needsForm={needsForm} />

      {chat?.blocked ? (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-zinc-100 px-4 py-4 text-sm text-zinc-500">
          <I n="lock" className="size-4" /> This conversation is closed for replies.
        </div>
      ) : needsForm ? (
        <PreChatForm />
      ) : (
        <Composer s={s} replyTo={replyTo} clearReply={() => setReplyTo(undefined)} files={files} setFiles={setFiles} addFiles={addFiles} />
      )}

      {drag && !needsForm && (
        <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center rounded-xl border-2 border-dashed border-(--brand) bg-white/90 text-sm font-medium text-zinc-700">
          <span className="flex flex-col items-center gap-2">
            <I n="clip" className="size-6 text-(--brand)" /> Drop files to attach
          </span>
        </div>
      )}
    </div>
  );
}

function MessageList({ s, chat, msgs, typing, onReply, firstTime, needsForm }: { s: State; chat?: Chat; msgs: Msg[]; typing: boolean; onReply: (m: Msg) => void; firstTime: boolean; needsForm: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const prevHeight = useRef(0);
  const channel = chat?.channel;
  const loading = !!(channel && s.loading[channel]);
  const more = !!(channel && s.more[channel]);
  const firstLoad = !!(chat?.id && !s.messages[chat.channel]);

  // keep scroll at the bottom for new messages, keep position when older ones load
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prevHeight.current && el.scrollTop < 40 && !stick.current) el.scrollTop = el.scrollHeight - prevHeight.current;
    else if (stick.current || msgs.at(-1)?.who === "me") el.scrollTop = el.scrollHeight;
    prevHeight.current = el.scrollHeight;
  }, [msgs, typing]);
  useEffect(() => {
    stick.current = true;
  }, [channel]);

  const onScroll = () => {
    const el = ref.current!;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    prevHeight.current = el.scrollHeight;
    if (el.scrollTop < 60 && more && !loading && channel) hello.loadHistory(channel, true);
  };

  const greeting = !chat && s.greeting;
  return (
    <div ref={ref} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50/70 px-3 py-4" aria-live="polite">
      {loading && (
        <div className="flex justify-center py-2">
          <span className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
        </div>
      )}
      {firstLoad && !loading && <div className="py-10 text-center text-sm text-zinc-400">Loading conversation…</div>}

      {!chat && (
        <>
          <div className="mb-5 flex flex-col items-center px-6 pt-2 text-center">
            <Avatar who={s.widget?.bot_id ? "bot" : "brand"} s={s} size="size-14" />
            <p className="mt-2 font-semibold">{s.widget?.name}</p>
            <p className="text-[13px] text-zinc-500">{s.widget?.bot_id ? "Ask anything. A human can step in any time." : "We usually reply quickly."}</p>
          </div>
          {greeting ? (
            <Row who="bot" name={BOT_NAME} s={s} showMeta>
              <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 whitespace-pre-wrap shadow-sm ring-1 ring-black/5">{greeting.text}</div>
            </Row>
          ) : null}
          {greeting && firstTime && !needsForm && greeting.options.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-end gap-2 pl-10">
              {greeting.options.map((o) => (
                <button key={o} onClick={() => hello.send({ text: o })} className="rounded-full border border-(--brand) bg-white px-3.5 py-1.5 text-[13px] font-medium text-(--brand) transition hover:bg-(--brand) hover:text-white">
                  {o}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {msgs.map((m, i) => {
        const prev = msgs[i - 1];
        const next = msgs[i + 1];
        const newDay = !prev || !sameDay(prev.time, m.time);
        const lastOfGroup = !next || next.who !== m.who || next.name !== m.name || next.time - m.time > 5 * 60e3 || next.kind === "feedback" || !sameDay(next.time, m.time);
        const firstOfGroup = newDay || !prev || prev.who !== m.who || prev.name !== m.name || m.time - prev.time > 5 * 60e3 || prev.kind === "feedback";
        return (
          <div key={m.id} className={firstOfGroup ? "mt-3" : "mt-1"}>
            {newDay && (
              <div className="my-4 flex items-center gap-3 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                <span className="h-px flex-1 bg-zinc-200" />
                {dayLabel(m.time)}
                <span className="h-px flex-1 bg-zinc-200" />
              </div>
            )}
            <Message m={m} s={s} showMeta={lastOfGroup} showName={firstOfGroup} onReply={onReply} />
          </div>
        );
      })}

      {typing && (
        <Row who="bot" name={chat ? chatTitle(chat, s) : BOT_NAME} s={s} showMeta>
          <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5" aria-label="Typing">
            {[0, 150, 300].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </Row>
      )}
    </div>
  );
}

function Row({ who, name, s, showMeta, showName, children, meta }: { who: "me" | "bot" | "agent"; name?: string; s: State; showMeta?: boolean; showName?: boolean; children: ReactNode; meta?: ReactNode }) {
  if (who === "me")
    return (
      <div className="flex flex-col items-end pl-12">
        {children}
        {showMeta && meta}
      </div>
    );
  return (
    <div className="flex items-end gap-2 pr-10">
      <span className="w-8 shrink-0">{showMeta && <Avatar who={who} name={name} s={s} />}</span>
      <div className="flex min-w-0 flex-col items-start">
        {showName && name && <span className="mb-1 ml-1 text-[11px] font-medium text-zinc-500">{name}</span>}
        {children}
        {showMeta && meta}
      </div>
    </div>
  );
}

function Message({ m, s, showMeta, showName, onReply }: { m: Msg; s: State; showMeta: boolean; showName: boolean; onReply: (m: Msg) => void }) {
  const [expanding, setExpanding] = useState(false);
  if (m.kind === "feedback") return <Feedback m={m} s={s} />;
  if (m.kind === "voice_call")
    return (
      <div className="flex justify-center">
        <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-zinc-600 shadow-sm ring-1 ring-black/5">
          <I n="phone" className="size-3.5 text-(--brand)" />
          Voice call{m.callStatus ? ` · ${m.callStatus.replace(/[-_]/g, " ")}` : ""} · {timeFmt.format(m.time)}
        </span>
      </div>
    );

  const mine = m.who === "me";
  const bubble = mine ? "bg-(--brand) text-white rounded-2xl rounded-br-md" : "bg-white text-zinc-900 rounded-2xl rounded-bl-md shadow-sm ring-1 ring-black/5";
  const hasText = !!m.text || !!m.interactive;
  const meta = (
    <span className={`mt-1 flex items-center gap-1 px-1 text-[11px] ${m.status === "failed" ? "text-red-600" : "text-zinc-400"}`}>
      {m.status === "sending" ? (
        "Sending…"
      ) : m.status === "failed" ? (
        <>
          Not sent ·
          <button onClick={() => hello.retry(m)} className="font-semibold underline">
            Retry
          </button>
        </>
      ) : (
        <>
          {timeFmt.format(m.time)}
          {mine && <I n="check" className="size-3" />}
        </>
      )}
    </span>
  );

  return (
    <Row who={m.who} name={m.name} s={s} showMeta={showMeta || !!m.status} showName={showName} meta={meta}>
      <div className={`group relative flex max-w-full items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}>
        <div className={`min-w-0 overflow-hidden ${bubble} ${m.status === "sending" ? "opacity-70" : ""}`}>
          {m.reply && (
            <div className={`m-1.5 mb-0 rounded-lg border-l-3 px-2.5 py-1.5 text-xs ${mine ? "border-white/70 bg-white/15" : "border-(--brand) bg-zinc-100"}`}>
              <p className="font-semibold">{m.reply.name || "Message"}</p>
              <p className="line-clamp-2 opacity-80">{m.reply.text}</p>
            </div>
          )}
          {m.attachments.length > 0 && <Attachments list={m.attachments} mine={mine} padded={hasText} />}
          {m.interactive ? (
            <InteractiveView m={m} />
          ) : (
            m.text && (
              <div className="px-3.5 py-2.5 leading-relaxed break-words whitespace-pre-wrap">
                <RichText text={m.text} />
                {m.showMore && (
                  <button
                    disabled={expanding}
                    onClick={() => {
                      setExpanding(true);
                      hello.expand(m).finally(() => setExpanding(false));
                    }}
                    className="mt-1 block text-[13px] font-semibold underline"
                  >
                    {expanding ? "Loading…" : "Read more"}
                  </button>
                )}
              </div>
            )
          )}
        </div>
        {!m.local && m.kind !== "greeting" && (
          <button onClick={() => onReply(m)} className="grid size-7 shrink-0 place-items-center rounded-full text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-200 hover:text-zinc-700 focus:opacity-100" aria-label="Reply">
            <I n="reply" className="size-4" />
          </button>
        )}
      </div>
    </Row>
  );
}

function Attachments({ list, mine, padded }: { list: Attachment[]; mine: boolean; padded: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${padded ? "p-1.5 pb-0" : "p-1.5"}`}>
      {list.map((a, i) =>
        isImg(a) ? (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer">
            <img src={a.url} alt={a.name} className="max-h-60 w-full rounded-xl bg-zinc-100 object-cover" loading="lazy" />
          </a>
        ) : isVideo(a) ? (
          <video key={i} src={a.url} controls className="max-h-60 w-full rounded-xl bg-black" />
        ) : isAudio(a) ? (
          <audio key={i} src={a.url} controls className="w-60 max-w-full" />
        ) : (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${mine ? "bg-white/15 hover:bg-white/25" : "bg-zinc-100 hover:bg-zinc-200"}`}>
            <I n="file" className="size-5 shrink-0" />
            <span className="min-w-0 truncate text-[13px] font-medium">{a.name}</span>
          </a>
        ),
      )}
    </div>
  );
}

function InteractiveView({ m }: { m: Msg }) {
  const it = m.interactive!;
  const [open, setOpen] = useState(false);
  const h = it.header;
  const choose = (label: string) => hello.send({ text: label });
  const rows = it.sections.flatMap((sec) => sec.rows);
  return (
    <div className="min-w-56">
      {h?.type === "image" && h.link && <img src={h.link} alt="" className="max-h-48 w-full object-cover" />}
      {h?.type === "video" && h.link && <video src={h.link} controls className="max-h-48 w-full bg-black" />}
      {h?.type === "document" && h.link && (
        <a href={h.link} target="_blank" rel="noopener noreferrer" className="m-1.5 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-[13px] font-medium">
          <I n="file" className="size-5" /> {h.name || "Document"}
        </a>
      )}
      <div className="px-3.5 py-2.5">
        {h?.text && <p className="mb-1 font-semibold">{h.text}</p>}
        {it.body && (
          <p className="leading-relaxed whitespace-pre-wrap">
            <RichText text={it.body} />
          </p>
        )}
        {it.footer && <p className="mt-1.5 text-xs text-zinc-500">{it.footer}</p>}
      </div>
      {it.buttons.length > 0 && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {it.buttons.map((b, i) =>
            b.url ? (
              <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-(--brand) hover:bg-zinc-50">
                <I n="link" className="size-3.5" /> {b.label}
              </a>
            ) : (
              <button key={i} onClick={() => choose(b.label)} className="block w-full py-2.5 text-center text-[13px] font-semibold text-(--brand) hover:bg-zinc-50">
                {b.label}
              </button>
            ),
          )}
        </div>
      )}
      {rows.length > 0 && (
        <div className="border-t border-zinc-100">
          <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-(--brand) hover:bg-zinc-50">
            <I n="list" className="size-4" /> {it.listLabel || "View options"}
          </button>
          {open &&
            it.sections.map((sec, i) => (
              <div key={i} className="border-t border-zinc-100">
                {sec.title && <p className="px-3.5 pt-2 text-[11px] font-semibold text-zinc-400 uppercase">{sec.title}</p>}
                {sec.rows.map((r, j) => (
                  <button key={j} onClick={() => choose(r.title)} className="block w-full px-3.5 py-2 text-left hover:bg-zinc-50">
                    <span className="block text-[13px] font-medium">{r.title}</span>
                    {r.description && <span className="block text-xs text-zinc-500">{r.description}</span>}
                  </button>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Feedback({ m, s }: { m: Msg; s: State }) {
  const done = s.rated[m.id] || m.feedback?.rating;
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const shown = hover || stars || done || 0;
  return (
    <div className="my-3 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
      <p className="font-semibold">{done ? "Thanks for your feedback!" : "How was your conversation?"}</p>
      {!done && <p className="mt-0.5 text-[13px] text-zinc-500">This chat has ended. Tell us how we did.</p>}
      <div className="mt-3 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} disabled={!!done} onMouseEnter={() => !done && setHover(n)} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="transition enabled:hover:scale-110">
            <I n="star" fill={n <= shown} className={`size-7 ${n <= shown ? "text-amber-400" : "text-zinc-300"}`} />
          </button>
        ))}
      </div>
      {!done && stars > 0 && (
        <form
          className="mt-3 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr("");
            try {
              await hello.rate(m, stars, comment);
            } catch (x) {
              setErr((x as Error).message);
            }
            setBusy(false);
          }}
        >
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Anything else? (optional)" className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-[13px] outline-none focus:border-(--brand)" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-(--brand) py-2 text-[13px] font-semibold text-white disabled:opacity-60">
            {busy ? "Sending…" : s.widget?.feedback_text || "Submit feedback"}
          </button>
        </form>
      )}
    </div>
  );
}

function PreChatForm() {
  const p = hello.get().profile;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const field = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] outline-none transition focus:border-(--brand) focus:ring-3 focus:ring-(--brand)/15";
  return (
    <form
      className="shrink-0 space-y-2.5 border-t border-zinc-100 bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setErr("");
        try {
          await hello.saveProfile({ name: String(f.get("name")).trim(), mail: String(f.get("mail")).trim(), number: String(f.get("number") || "").trim() });
        } catch (x) {
          setErr((x as Error).message);
          setBusy(false);
        }
      }}
    >
      <p className="text-[13px] font-medium text-zinc-600">Before we start, tell us a little about you.</p>
      <input name="name" required autoComplete="name" defaultValue={p.name} placeholder="Your name" aria-label="Name" className={field} />
      <input name="mail" type="email" required autoComplete="email" defaultValue={p.mail} placeholder="Email address" aria-label="Email" className={field} />
      <input name="number" type="tel" autoComplete="tel" defaultValue={p.number} placeholder="Phone (optional)" aria-label="Phone" pattern="[+0-9 ()-]{6,}" className={field} />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-(--brand) py-2.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
        {busy ? "Saving…" : "Start chat"}
      </button>
    </form>
  );
}

function Composer({ s, replyTo, clearReply, files, setFiles, addFiles }: { s: State; replyTo?: Msg; clearReply: () => void; files: Pending[]; setFiles: (f: Pending[]) => void; addFiles: (f: FileList | File[]) => void }) {
  const [text, setText] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploading = files.some((f) => !f.item && !f.error);
  const ready = files.filter((f) => f.item);
  const canSend = (text.trim() || ready.length) && !uploading;

  useEffect(() => {
    ta.current?.focus();
  }, [s.active, replyTo]);
  useLayoutEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    hello.send({ text, attachments: ready.map((f) => f.item), replyTo });
    files.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    setText("");
    setFiles([]);
    clearReply();
  };

  return (
    <div className="shrink-0 border-t border-zinc-100 bg-white">
      {replyTo && (
        <div className="flex items-center gap-2 px-3 pt-2.5">
          <div className="min-w-0 flex-1 rounded-lg border-l-3 border-(--brand) bg-zinc-50 px-2.5 py-1.5 text-xs">
            <p className="font-semibold">Replying to {replyTo.who === "me" ? "yourself" : replyTo.name}</p>
            <p className="truncate text-zinc-500">{replyTo.text || "Attachment"}</p>
          </div>
          <button onClick={clearReply} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100" aria-label="Cancel reply">
            <I n="x" className="size-4" />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-2.5">
          {files.map((f) => (
            <div key={f.key} className={`relative flex h-16 shrink-0 items-center gap-2 overflow-hidden rounded-xl border ${f.error ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"} ${f.url ? "w-16" : "max-w-44 px-3"}`} title={f.error || f.file.name}>
              {f.url ? <img src={f.url} alt="" className="size-full object-cover" /> : <><I n="file" className="size-5 shrink-0 text-zinc-500" /><span className="truncate text-xs">{f.file.name}</span></>}
              {!f.item && !f.error && (
                <span className="absolute inset-0 grid place-items-center bg-white/60">
                  <span className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                </span>
              )}
              {f.error && <span className="absolute inset-x-0 bottom-0 bg-red-600 text-center text-[9px] font-semibold text-white">Failed</span>}
              <button onClick={() => setFiles(files.filter((x) => x.key !== f.key))} className="absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove file">
                <I n="x" className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-1 p-2">
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }} />
        <button onClick={() => fileInput.current?.click()} className="grid size-10 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800" aria-label="Attach file">
          <I n="clip" />
        </button>
        <textarea
          ref={ta}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            hello.typing();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          onPaste={(e) => {
            if (e.clipboardData.files.length) {
              e.preventDefault();
              addFiles(e.clipboardData.files);
            }
          }}
          placeholder="Write a message…"
          aria-label="Message"
          className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 leading-5 outline-none placeholder:text-zinc-400"
        />
        <button onClick={submit} disabled={!canSend} className="grid size-10 shrink-0 place-items-center rounded-full bg-(--brand) text-white transition enabled:hover:brightness-110 disabled:bg-zinc-200 disabled:text-zinc-400" aria-label="Send">
          <I n="send" className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- call ---------------- */
function CallOverlay({ s }: { s: State }) {
  const c = s.call!;
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const chat = s.chats.find((x) => x.channel === s.active);
  const title = chat?.assignedType === "agent" ? chatTitle(chat, s) : s.widget?.name || "Support";
  const secs = c.since ? Math.floor((Date.now() - c.since) / 1000) : 0;
  const label = { dialing: "Calling…", ringing: "Incoming call", connected: `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`, ended: c.note || "Call ended" }[c.status];
  const round = "grid size-14 place-items-center rounded-full transition active:scale-95";

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between bg-zinc-900 px-6 py-14 text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className={`relative ${c.status === "dialing" || c.status === "ringing" ? "hello-ring" : ""}`}>
          <Avatar who="brand" s={s} size="size-24" />
        </span>
        <p className="text-xl font-semibold">{title}</p>
        <p className="text-sm text-white/70 tabular-nums">{label}</p>
      </div>
      {c.status !== "ended" && (
        <div className="flex items-center gap-6">
          {c.status === "ringing" ? (
            <>
              <button onClick={() => hello.callAction("reject")} className={`${round} bg-red-500 hover:bg-red-600`} aria-label="Decline">
                <I n="phone" className="size-6 rotate-[135deg]" />
              </button>
              <button onClick={() => hello.callAction("accept")} className={`${round} bg-emerald-500 hover:bg-emerald-600`} aria-label="Accept">
                <I n="phone" className="size-6" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => hello.callAction(c.muted ? "unmute" : "mute")} disabled={c.status !== "connected"} className={`${round} ${c.muted ? "bg-white text-zinc-900" : "bg-white/15 hover:bg-white/25"} disabled:opacity-40`} aria-label={c.muted ? "Unmute" : "Mute"}>
                <I n={c.muted ? "micOff" : "mic"} className="size-6" />
              </button>
              <button onClick={() => hello.callAction("hang")} className={`${round} bg-red-500 hover:bg-red-600`} aria-label="Hang up">
                <I n="phone" className="size-6 rotate-[135deg]" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- peek + popup ---------------- */
function Peek({ m, s }: { m: Msg; s: State }) {
  return (
    <div className="hello-pop fixed right-5 bottom-24 z-[2147483000] w-72 max-w-[calc(100vw-40px)]">
      <button onClick={() => hello.openChat(m.channel)} className="flex w-full items-start gap-3 rounded-2xl bg-white p-3.5 text-left shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5">
        <Avatar who={m.who === "agent" ? "agent" : "bot"} name={m.name} s={s} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">{m.name || s.widget?.name}</span>
          <span className="line-clamp-2 text-[13px] text-zinc-600">{m.kind === "feedback" ? "How was your conversation? Tap to rate." : m.text || "Sent an attachment"}</span>
        </span>
      </button>
      <button onClick={hello.dismissPeek} className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full bg-zinc-700 text-white shadow" aria-label="Dismiss">
        <I n="x" className="size-3.5" />
      </button>
    </div>
  );
}

function Popup({ m }: { m: { message_type?: string; content: unknown } }) {
  const c = m.content as string | Record<string, string>;
  const o: Record<string, string> = typeof c === "string" ? { text: c } : c;
  const html = o.html || (typeof c === "string" && /<[a-z][\s\S]*>/i.test(c) ? c : undefined);
  const title = o.title || o.heading || o.subject;
  const text = o.text || o.body || o.message || o.description;
  const img = o.image || o.image_url || o.banner;
  const url = o.url || o.link || o.button_url;
  const preview = m.message_type === "Message";

  const card = (
    <div className={`relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 ${preview ? "w-80" : "w-[min(440px,calc(100vw-32px))]"}`}>
      <button onClick={hello.dismissPopup} className="absolute top-2 right-2 z-10 grid size-8 place-items-center rounded-full bg-black/50 text-white" aria-label="Close">
        <I n="x" className="size-4" />
      </button>
      {html ? (
        <iframe sandbox="" srcDoc={html} title="Notification" className="h-80 w-full border-0" />
      ) : (
        <>
          {img && <img src={img} alt="" className="max-h-56 w-full object-cover" />}
          <div className="p-5">
            {title && <p className="text-lg font-semibold">{title}</p>}
            {text && <p className="mt-1 text-[14px] whitespace-pre-wrap text-zinc-600">{text}</p>}
            <div className="mt-4 flex gap-2">
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={hello.dismissPopup} className="flex-1 rounded-xl bg-(--brand) py-2.5 text-center text-[14px] font-semibold text-white">
                  {o.button_text || o.cta || "Learn more"}
                </a>
              )}
              <button
                onClick={() => {
                  hello.dismissPopup();
                  hello.setOpen(true);
                }}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-[14px] font-semibold"
              >
                Chat with us
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return preview ? (
    <div className="hello-pop fixed right-5 bottom-24 z-[2147483001]">{card}</div>
  ) : (
    <div className="fixed inset-0 z-[2147483001] grid place-items-center bg-black/40 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && hello.dismissPopup()}>
      <div className="hello-pop">{card}</div>
    </div>
  );
}
