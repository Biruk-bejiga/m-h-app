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
  const name = `seg-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <fieldset className="flex items-center gap-3">
      <legend className="text-sm text-slate-300">{label}</legend>

      <div className="inline-flex rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <label
              key={opt.value}
              className="cursor-pointer"
              aria-label={`${label}: ${opt.label}`}
            >
              <input
                className="peer sr-only"
                type="radio"
                name={name}
                value={opt.value}
                checked={active}
                onChange={() => onChange(opt.value)}
              />
              <span
                className={
                  "inline-flex rounded-md px-3 py-1.5 text-sm transition " +
                  (active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white")
                }
              >
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
