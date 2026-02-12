"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, signOut } from "next-auth/react";

type MeResponse =
  | { authenticated: false }
  | { authenticated: true; user: { id: string; isAnonymous: boolean } };

export function AuthControls() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) {
        if (!cancelled) setMe({ authenticated: false });
        return;
      }
      const json = (await res.json()) as MeResponse;
      if (!cancelled) setMe(json);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label = useMemo(() => {
    if (!me) return "";
    if (!me.authenticated) return "";
    return me.user.isAnonymous ? "Anonymous" : "Signed in";
  }, [me]);

  const doGoogleSignIn = async () => {
    setBusy(true);
    try {
      // After Google login, our /auth/complete page will call /api/auth/exchange
      await signIn("google", { callbackUrl: "/auth/complete" });
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    setBusy(true);
    try {
      // Clear our app session cookies and NextAuth session cookies.
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      await signOut({ callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label ? <span className="hidden text-xs text-slate-300 sm:inline">{label}</span> : null}

      {me?.authenticated && !me.user.isAnonymous ? (
        <button
          type="button"
          onClick={doSignOut}
          disabled={busy}
          className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          Sign out
        </button>
      ) : (
        <button
          type="button"
          onClick={doGoogleSignIn}
          disabled={busy}
          className="rounded-md bg-white/5 px-3 py-2 text-sm text-slate-50 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
        >
          Continue with Google
        </button>
      )}
    </div>
  );
}
