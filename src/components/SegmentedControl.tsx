type Option<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300" id="seg-label">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby="seg-label"
        className="inline-flex rounded-lg bg-white/5 p-1 ring-1 ring-white/10"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
