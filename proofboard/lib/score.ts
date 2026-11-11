// The whole idea: one main goal a day. The score is how many main goals got done.
// Small tasks are shown but never counted, so doing more of them cannot raise the score.

export type Task = {
  id: string;
  day: string; // YYYY-MM-DD
  text: string;
  main: boolean; // the day's one main goal
  done: boolean;
  proof?: string; // link or note; a main goal cannot be done without it
};

export function week(tasks: Task[], today: string, days: string[]) {
  const rows = days.map((day) => ({
    day,
    goal: tasks.find((t) => t.day === day && t.main),
    small: tasks.filter((t) => t.day === day && !t.main),
  }));
  // Today's goal only counts once it is done: an unfinished day is not a miss yet.
  const counted = rows.filter((r) => r.goal && (r.day < today || r.goal.done));
  return { rows, done: counted.filter((r) => r.goal!.done).length, set: counted.length };
}

const nice = (day: string) =>
  new Date(day + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

// The message the manager gets each evening.
export function report(name: string, tasks: Task[], today: string, days: string[]) {
  const w = week(tasks, today, days);
  const { goal, small } = w.rows.find((r) => r.day === today)!;
  const extra = small.filter((t) => t.done).map((t) => t.text);
  return [
    `${name} · ${nice(today)}`,
    goal ? `Main goal: ${goal.text}` : "Main goal: none set today",
    goal ? (goal.done ? `Done. Proof: ${goal.proof}` : "Not done") : null,
    extra.length ? `Also did: ${extra.join(", ")}` : null,
    `This week: ${w.done} of ${w.set} main goals done`,
  ].filter(Boolean).join("\n");
}
