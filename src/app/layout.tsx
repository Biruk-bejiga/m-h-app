import type { Metadata } from "next";
import "./globals.css";

import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Mental Health Check Bot",
  description:
    "Daily check-ins for sleep, social activity, screen time, and mood with trend charts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-950 text-slate-50 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
