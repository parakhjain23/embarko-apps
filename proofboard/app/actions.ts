"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { load, save, isOwner, signIn, hash, matches, dayOf } from "@/lib/store";
import { sendReport } from "@/lib/integrations";

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const fail = (msg: string): never => redirect("/?err=" + encodeURIComponent(msg));
const done = () => { revalidatePath("/"); redirect("/"); };

async function owner() {
  const d = load();
  if (!(await isOwner(d))) fail("Sign in first.");
  return d;
}

export async function setup(f: FormData) {
  const d = load();
  if (d.config) fail("This board is already set up.");
  const [name, pass] = [str(f, "name", 60), str(f, "pass", 100)];
  if (!name || pass.length < 6) fail("Give your name and a password of 6+ letters.");
  const secret = crypto.randomBytes(32).toString("hex");
  save({ ...d, config: { name, pass: hash(pass), secret } });
  await signIn(secret);
  done();
}

// ponytail: one shared counter for all visitors. Per-IP limits if this ever has many users.
let fails = 0, lockedUntil = 0;
export async function login(f: FormData) {
  const d = load();
  if (!d.config) return fail("Set the board up first.");
  if (Date.now() < lockedUntil) fail("Too many wrong tries. Wait a minute.");
  if (!matches(str(f, "pass", 100), d.config.pass)) {
    if (++fails >= 5) { fails = 0; lockedUntil = Date.now() + 60000; }
    fail("Wrong password.");
  }
  fails = 0;
  await signIn(d.config.secret);
  done();
}

export async function logout() {
  (await cookies()).delete("pb");
  done();
}

// One main goal a day. Once set it stays, so a missed day cannot be hidden.
export async function setGoal(f: FormData) {
  const d = await owner();
  const text = str(f, "text", 140);
  if (!text) fail("Write your main goal.");
  if (d.tasks.some((t) => t.day === dayOf() && t.main)) fail("Today already has a main goal.");
  d.tasks.push({ id: crypto.randomUUID(), day: dayOf(), text, main: true, done: false });
  save(d);
  done();
}

export async function finishGoal(f: FormData) {
  const d = await owner();
  const t = d.tasks.find((t) => t.day === dayOf() && t.main && !t.done);
  const proof = str(f, "proof", 500);
  if (!t) return fail("There is no open main goal today.");
  if (!proof) fail("Show proof first: a link or a note.");
  Object.assign(t, { done: true, proof });
  save(d);
  void sendReport("goal.done").catch((e) => console.error("integrations:", e.message)); // never blocks the save
  done();
}

// Small tasks are free to add, tick and remove: they never count.
export async function addSmall(f: FormData) {
  const d = await owner();
  const text = str(f, "text", 140);
  if (!text) fail("Write the task.");
  d.tasks.push({ id: crypto.randomUUID(), day: dayOf(), text, main: false, done: false });
  save(d);
  done();
}

export async function toggleSmall(f: FormData) {
  const d = await owner();
  const t = d.tasks.find((t) => t.id === f.get("id") && !t.main);
  if (t) t.done = !t.done;
  save(d);
  done();
}

export async function removeSmall(f: FormData) {
  const d = await owner();
  d.tasks = d.tasks.filter((t) => t.main || t.id !== f.get("id"));
  save(d);
  done();
}
