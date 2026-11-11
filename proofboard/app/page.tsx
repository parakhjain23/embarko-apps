import Link from "next/link";
import { load, isOwner, dayOf, lastDays } from "@/lib/store";
import { week } from "@/lib/score";
import { setup, login, logout, setGoal, finishGoal, addSmall, toggleSmall, removeSmall } from "./actions";

const input = "w-full rounded-md border border-stone-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";
const btn = "shrink-0 rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";
const ghost = "shrink-0 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";
const card = "rounded-xl border border-stone-200 bg-white p-5";

const nice = (day: string) =>
  new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function Proof({ text }: { text: string }) {
  return /^https?:\/\/\S+$/.test(text)
    ? <a href={text} target="_blank" rel="noreferrer" className="break-all text-emerald-800 underline">{text}</a>
    : <span>{text}</span>;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  const d = load();
  const alert = err && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{err}</p>;

  if (!d.config) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 py-16">
        <h1 className="text-2xl font-semibold">Start your board</h1>
        <p className="mt-2 text-stone-600">Anyone with the link can look. Only you can change it.</p>
        {alert}
        <form action={setup} className="mt-6 grid gap-3">
          <label className="grid gap-1 text-sm">Your name<input name="name" required maxLength={60} className={input} /></label>
          <label className="grid gap-1 text-sm">Pick a password (6+ letters)<input name="pass" type="password" required minLength={6} autoComplete="new-password" className={input} /></label>
          <button className={btn}>Start</button>
        </form>
      </main>
    );
  }

  const me = await isOwner(d);
  const today = dayOf();
  const w = week(d.tasks, today, lastDays(7));
  const { goal, small } = w.rows[0];

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{d.config.name}&apos;s day</h1>
          <p className="text-sm text-stone-600">{nice(today)}</p>
        </div>
        {me ? (
          <form action={logout}><button className={ghost}>Sign out</button></form>
        ) : (
          <form action={login} className="flex gap-2">
            <input name="pass" type="password" required placeholder="Password" aria-label="Password" autoComplete="current-password" className={input + " w-32 text-sm"} />
            <button className={ghost}>Sign in</button>
          </form>
        )}
      </header>
      {alert}

      <section className={card + " mt-6"}>
        <h2 className="text-sm font-medium text-stone-500">Today&apos;s main goal</h2>
        {goal ? (
          <>
            <p className="mt-1 text-2xl font-semibold">{goal.text}</p>
            {goal.done ? (
              <p className="mt-3 rounded-md bg-emerald-50 p-3 text-emerald-900"><span className="font-semibold">Done.</span> Proof: <Proof text={goal.proof!} /></p>
            ) : me ? (
              <form action={finishGoal} className="mt-3 flex gap-2">
                <input name="proof" required maxLength={500} placeholder="Proof: paste a link or write a note" aria-label="Proof" className={input} />
                <button className={btn}>Done</button>
              </form>
            ) : (
              <p className="mt-3 rounded-md bg-stone-100 p-3 text-stone-700">Not done yet.</p>
            )}
          </>
        ) : me ? (
          <form action={setGoal} className="mt-2 flex gap-2">
            <input name="text" required maxLength={140} placeholder="The one most important thing today" aria-label="Main goal" className={input} />
            <button className={btn}>Set</button>
          </form>
        ) : (
          <p className="mt-1 text-lg text-stone-500">No goal set yet.</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">Small tasks</h2>
        <p className="text-sm text-stone-500">Extra work. These do not count in the score.</p>
        <ul className="mt-2 grid gap-1">
          {small.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              {me ? (
                <form action={toggleSmall} className="flex-1">
                  <input type="hidden" name="id" value={t.id} />
                  <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-stone-100" aria-pressed={t.done}>
                    <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${t.done ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-400 bg-white"}`}>{t.done && "✓"}</span>
                    <span className={t.done ? "text-stone-500 line-through" : ""}>{t.text}</span>
                  </button>
                </form>
              ) : (
                <span className="flex flex-1 items-center gap-2 px-2 py-1.5">
                  <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${t.done ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-400 bg-white"}`}>{t.done && "✓"}</span>
                  <span className={t.done ? "text-stone-500 line-through" : ""}>{t.text}<span className="sr-only">{t.done ? " (done)" : " (not done)"}</span></span>
                </span>
              )}
              {me && (
                <form action={removeSmall}>
                  <input type="hidden" name="id" value={t.id} />
                  <button aria-label={`Remove ${t.text}`} className="rounded-md px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">✕</button>
                </form>
              )}
            </li>
          ))}
          {!small.length && !me && <li className="px-2 text-sm text-stone-500">None today.</li>}
        </ul>
        {me && (
          <form action={addSmall} className="mt-2 flex gap-2">
            <input name="text" required maxLength={140} placeholder="Add a small task" aria-label="Add a small task" className={input + " text-sm"} />
            <button className={ghost}>Add</button>
          </form>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">This week</h2>
          <p className="text-sm"><span className="text-2xl font-semibold tabular-nums text-emerald-800">{w.done} of {w.set}</span> main goals done</p>
        </div>
        <ul className={card + " mt-2 divide-y divide-stone-100 !p-0"}>
          {w.rows.map((r) => (
            <li key={r.day} className="grid grid-cols-[5.5rem_1fr_auto] items-start gap-3 px-4 py-3 text-sm">
              <span className="text-stone-500">{r.day === today ? "Today" : nice(r.day)}</span>
              <span>
                {r.goal ? r.goal.text : <span className="text-stone-400">No goal set</span>}
                {r.goal?.done && <span className="mt-0.5 block text-xs text-stone-500">Proof: <Proof text={r.goal.proof!} /></span>}
              </span>
              {r.goal && (
                r.goal.done ? <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-medium text-white">Done</span>
                : r.day === today ? <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">Working</span>
                : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Missed</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {me && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-100 p-4">
          <p className="text-sm"><span className="font-medium">Don&apos;t make your manager open this page.</span><br />Send them this report every evening, in Slack, email or WhatsApp.</p>
          <Link href="/integrations" className={btn}>Set it up</Link>
        </section>
      )}
    </main>
  );
}
