"use client";

import { useEffect, useState } from "react";

type Embed = { on(e: string, fn: (x: { action?: string; title?: string }) => void): void; destroy(): void };
declare global {
  interface Window { viaSocket?: { mount(o: object): Embed } }
}

export default function Panel() {
  const [note, setNote] = useState("Loading…");

  useEffect(() => {
    let embed: Embed | undefined, gone = false;
    const script = document.createElement("script");
    script.src = "https://embed.viasocket.com/prod-embedcomponent.js";
    script.onerror = () => setNote("Could not load Integrations. Check your connection and reload.");
    script.onload = async () => {
      const res = await fetch("/api/integrations/token");
      if (gone) return;
      if (!res.ok) return setNote("Could not open Integrations. Sign in again and reload.");
      const { token } = await res.json();
      embed = window.viaSocket!.mount({
        embedToken: token,
        parent: "#integrations",
        config: { pageheading: "Report", pagesubheading: "Pick the app where your manager should get your daily report." },
      });
      setNote("");
      embed.on("error", () => setNote("Integrations hit a problem. Reload to try again."));
      embed.on("flow", (f) => {
        const said = { published: "is on. Your next report goes there.", updated: "was updated.", paused: "is paused. It gets nothing until you resume it.", deleted: "was deleted." }[f.action ?? ""];
        if (said) setNote(`"${f.title || "Automation"}" ${said}`);
      });
    };
    document.body.appendChild(script);
    return () => { gone = true; embed?.destroy(); script.remove(); };
  }, []);

  return (
    <>
      <p role="status" className="mt-4 min-h-5 text-sm text-stone-600">{note}</p>
      <div id="integrations" className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white" style={{ height: 680 }} />
    </>
  );
}
