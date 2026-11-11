import { sendReport, integrationsUser } from "@/lib/integrations";

// Run by Embarko every evening (see embarko.json). Sends the day's score to the owner's automations.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });
  return Response.json({ ok: true, integrations: integrationsUser() ? "on" : "off", sent: await sendReport("day.summary") });
}
