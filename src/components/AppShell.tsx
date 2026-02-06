import Link from "next/link";
import type { PropsWithChildren } from "react";

import { Container } from "@/components/Container";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <Container>
          <div className="flex items-center justify-between py-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-slate-50"
              aria-label="Mental Health Check Bot home"
            >
              Mental Health Check Bot
            </Link>

            <nav aria-label="Primary" className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/checkin"
                className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400"
              >
                Daily Check-In
              </Link>
            </nav>
          </div>
        </Container>
      </header>

      <main className="py-8">
        <Container>{children}</Container>
      </main>

      <footer className="border-t border-white/10 py-6 text-xs text-slate-400">
        <Container>
          <p>
            This tool is informational only and not a medical device. If you’re in
            immediate danger, contact local emergency services.
          </p>
        </Container>
      </footer>
    </div>
  );
}
