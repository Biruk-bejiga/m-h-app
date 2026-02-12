"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/auth/exchange", { method: "POST" }).catch(() => null);
      if (!res) {
        if (!cancelled) setError("Could not reach server");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (!cancelled) setError(text || `Auth exchange failed (${res.status})`);
        return;
      }

      router.replace("/");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-lg rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
      <h1 className="text-lg font-semibold text-white">Signing you in…</h1>
      <p className="mt-2 text-sm text-slate-300">
        Finishing setup for your account.
      </p>

      {error ? (
        <div
          className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-100 ring-1 ring-rose-400/20"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
