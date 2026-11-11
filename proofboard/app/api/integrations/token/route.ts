import { isOwner } from "@/lib/store";
import { integrationsUser } from "@/lib/integrations";

// The browser may hold this per-user token; the signing secret never leaves the server.
export async function GET() {
  if (!(await isOwner())) return Response.json({ error: "Sign in first." }, { status: 401 });
  const user = integrationsUser();
  if (!user) return Response.json({ error: "Integrations is off." }, { status: 503 });
  return Response.json({ token: await user.token() }, { headers: { "Cache-Control": "no-store" } });
}
