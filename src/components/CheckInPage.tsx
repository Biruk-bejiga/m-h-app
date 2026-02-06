import { CheckInForm } from "@/components/CheckInForm";

export function CheckInPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Daily check-in
        </h1>
        <p className="text-sm text-slate-300">
          Log a quick snapshot of your day. The dashboard uses this to estimate risk
          and show trends.
        </p>
      </header>

      <CheckInForm />
    </div>
  );
}
