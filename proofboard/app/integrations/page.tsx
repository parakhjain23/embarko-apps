import Link from "next/link";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/store";
import { integrationsUser, todaysReport } from "@/lib/integrations";
import Panel from "./panel";

export default async function Integrations() {
  if (!(await isOwner())) redirect("/?err=" + encodeURIComponent("Sign in first."));
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-emerald-800 underline">← Back</Link>
      <h1 className="mt-2 text-2xl font-semibold">Send my report to my manager</h1>
      <p className="mt-1 text-stone-600">
        Pick an app below (Slack, Gmail, WhatsApp, Google Sheets…) and connect it once. After that this message goes there by itself:
        every evening at 7, and the moment you finish your main goal.
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-stone-200 bg-white p-4 font-sans text-sm">{todaysReport()}</pre>
      {integrationsUser() ? <Panel /> : (
        <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          This only works on the live app, not on your computer. Open the live link to set it up.
        </p>
      )}
    </main>
  );
}
