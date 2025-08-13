export type InputProps = {
  name: string
  label: string
  value?: string | number
  onChange?: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  step?: string
  error?: string
  prefix?: string
  suffix?: string
  tooltip?: string
  className?: string
}

export function Input({ name, label, value, onChange, placeholder, type = 'text', step = 'any', error, prefix, suffix, tooltip, className }: InputProps) {
  return (
    <div className={className ? `group ${className}` : 'group'}>
      <label htmlFor={name} className="mb-1 flex items-center gap-2 text-sm text-gray-300">
        <span>{label}</span>
        {tooltip && (
          <span className="group relative inline-flex">
            <button type="button" tabIndex={0} className="inline-block h-4 w-4 cursor-help rounded-full bg-gray-700 text-center text-[10px] leading-4 text-gray-200" aria-label={tooltip} aria-describedby={`${name}-tip`}>i</button>
            <span id={`${name}-tip`} role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-56 -translate-x-1/2 rounded-md border border-ui bg-ui-surface p-2 text-xs text-gray-200 shadow-md group-hover:block group-focus-within:block">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-ui bg-ui-surface transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-500 group-hover:border-gray-600">
        {prefix && <span className="select-none px-2 py-2 text-sm text-gray-400">{prefix}</span>}
        <input
          id={name}
          name={name}
          value={value as any}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          type={type}
          step={step}
          inputMode={type === 'number' ? 'decimal' : undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="w-full bg-transparent px-3 py-2 text-gray-100 outline-none transition-colors placeholder:text-gray-500"
        />
        {suffix && <span className="select-none px-2 py-2 text-sm text-gray-400">{suffix}</span>}
      </div>
      {error && <p id={`${name}-error`} className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default Input


