import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Task } from "./score";

export const TZ = "Asia/Kolkata"; // the day starts and ends in this time zone

type Data = { config?: { name: string; pass: string; secret: string }; tasks: Task[] };

const FILE = path.join(process.env.DATA_DIR || path.join(process.cwd(), ".data"), "board.json");

// ponytail: one JSON file, read and written whole. Fine for one person's tasks; move to SQLite past ~10k tasks.
export function load(): Data {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { tasks: [] };
    throw e; // a broken file must not be silently replaced by an empty one
  }
}
export function save(d: Data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE + ".tmp", JSON.stringify(d));
  fs.renameSync(FILE + ".tmp", FILE);
}

export const dayOf = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
export const lastDays = (n: number) => Array.from({ length: n }, (_, i) => dayOf(new Date(Date.now() - i * 864e5)));

// ---- password
export function hash(pass: string, salt = crypto.randomBytes(16).toString("hex")) {
  return salt + ":" + crypto.scryptSync(pass, salt, 32).toString("hex");
}
const same = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const matches = (pass: string, stored: string) => same(hash(pass, stored.split(":")[0]), stored);

const sign = (secret: string) => crypto.createHmac("sha256", secret).update("owner").digest("hex");

export async function isOwner(d = load()) {
  const c = (await cookies()).get("pb")?.value;
  return Boolean(c && d.config && same(c, sign(d.config.secret)));
}
export async function signIn(secret: string) {
  (await cookies()).set("pb", sign(secret), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
}
