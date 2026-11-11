import { ViaSocket } from "viasocket-apps";
import { load, dayOf, lastDays } from "./store";
import { report } from "./score";

// One person owns this board, so there is one integrations user.
export function integrationsUser() {
  const { INTEGRATIONS_ORG_ID: orgId, INTEGRATIONS_PROJECT_ID: projectId, INTEGRATIONS_SECRET: secret } = process.env;
  return orgId && projectId && secret ? new ViaSocket({ orgId, projectId, secret }).user("owner") : null;
}

export function todaysReport() {
  const d = load();
  return report(d.config?.name ?? "Someone", d.tasks, dayOf(), lastDays(7));
}

// Sends today's report to every automation the owner switched on.
// The list is read from the server each time, so nothing from the browser is trusted or stored.
export async function sendReport(event: "goal.done" | "day.summary") {
  const user = integrationsUser();
  if (!user) return 0;
  const body = JSON.stringify({
    event, text: todaysReport(), date: dayOf(),
    url: process.env.APP_NAME ? `https://${process.env.APP_NAME}.embarko.app` : undefined,
  });
  const flows = (await user.listFlows()).filter((f) => f.status === "active");
  const sent = await Promise.allSettled(flows.map((f) =>
    fetch(f.webhook || `https://flow.sokt.io/func/${f.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(10000) })));
  return sent.filter((r) => r.status === "fulfilled" && r.value.ok).length;
}
