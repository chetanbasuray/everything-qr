import { type ReactNode, useRef } from 'react'
import type { CornerDotType, CornerSquareType, DotType } from 'qr-code-styling'

type StyleValues = {
  size: number
  margin: number
  errorLevel: 'L' | 'M' | 'Q' | 'H'
  darkColor: string
  lightColor: string
  moduleStyle: DotType
  cornerStyle: CornerSquareType
  eyeStyle: CornerDotType
}

type StyleControllerProps = {
  values: StyleValues
  onChange: (next: Partial<StyleValues>) => void
  onReset?: () => void
}

const ColorSwatchPicker = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="swatch-field">
      <span>{label}</span>
      <button
        type="button"
        className="swatch-button"
        style={{ background: value }}
        onClick={() => inputRef.current?.click()}
        aria-label={`${label} color picker`}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="swatch-input"
      />
    </div>
  )
}

const TileControl = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon: ReactNode }[]
  onChange: (next: T) => void
}) => (
  <div className="tile-field">
    <span>{label}</span>
    <div className="tile-grid">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'tile active' : 'tile'}
          onClick={() => onChange(option.value)}
        >
          <span className="tile-icon">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  </div>
)

const ModuleIcon = ({ variant }: { variant: DotType }) => {
  const rx =
    variant === 'rounded' ? 2 : variant === 'extra-rounded' ? 4 : 1
  const isDot = variant === 'dots'
  const isClassy = variant === 'classy' || variant === 'classy-rounded'
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true">
      {isDot ? (
        <>
          <circle cx="8" cy="8" r="3" />
          <circle cx="18" cy="8" r="3" />
          <circle cx="28" cy="8" r="3" />
          <circle cx="8" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <circle cx="28" cy="18" r="3" />
        </>
      ) : (
        <>
          <rect x="5" y="5" width="6" height="6" rx={rx} />
          <rect x="15" y="5" width="6" height="6" rx={rx} />
          <rect x="25" y="5" width="6" height="6" rx={rx} />
          <rect x="5" y="15" width="6" height="6" rx={rx} />
          <rect x="15" y="15" width="6" height="6" rx={rx} />
          <rect x="25" y="15" width="6" height="6" rx={rx} />
        </>
      )}
      {isClassy ? <rect x="5" y="5" width="26" height="16" rx={rx} /> : null}
    </svg>
  )
}

const CornerIcon = ({ variant }: { variant: CornerSquareType }) => (
  <svg viewBox="0 0 28 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx={variant === 'square' ? 2 : 5} />
    <rect x="9" y="9" width="6" height="6" rx={variant === 'square' ? 1 : 3} />
  </svg>
)

const EyeIcon = ({ variant }: { variant: CornerDotType }) => (
  <svg viewBox="0 0 28 24" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx={4} />
    {variant === 'square' ? (
      <rect x="9" y="9" width="6" height="6" rx={1} />
    ) : (
      <circle cx="12" cy="12" r="3" />
    )}
  </svg>
)

const StyleController = ({ values, onChange, onReset }: StyleControllerProps) => (
  <div className="style-controller">
    <div className="row">
      <label className="field">
        <span>Size (px)</span>
        <input
          type="number"
          min={180}
          max={720}
          value={values.size}
          onChange={(event) => onChange({ size: Number(event.target.value) })}
        />
      </label>
    </div>

    <div className="row">
      <ColorSwatchPicker
        label="Dark"
        value={values.darkColor}
        onChange={(next) => onChange({ darkColor: next })}
      />
      <ColorSwatchPicker
        label="Light"
        value={values.lightColor}
        onChange={(next) => onChange({ lightColor: next })}
      />
    </div>

    <TileControl
      label="Module style"
      value={values.moduleStyle}
      onChange={(next) => onChange({ moduleStyle: next })}
      options={[
        { value: 'square', label: 'Square', icon: <ModuleIcon variant="square" /> },
        { value: 'rounded', label: 'Rounded', icon: <ModuleIcon variant="rounded" /> },
        { value: 'dots', label: 'Dots', icon: <ModuleIcon variant="dots" /> },
        {
          value: 'extra-rounded',
          label: 'Extra',
          icon: <ModuleIcon variant="extra-rounded" />,
        },
        { value: 'classy', label: 'Classy', icon: <ModuleIcon variant="classy" /> },
        {
          value: 'classy-rounded',
          label: 'Soft',
          icon: <ModuleIcon variant="classy-rounded" />,
        },
      ]}
    />

    <TileControl
      label="Corner style"
      value={values.cornerStyle}
      onChange={(next) => onChange({ cornerStyle: next })}
      options={[
        { value: 'square', label: 'Square', icon: <CornerIcon variant="square" /> },
        {
          value: 'extra-rounded',
          label: 'Rounded',
          icon: <CornerIcon variant="extra-rounded" />,
        },
      ]}
    />

    <TileControl
      label="Eye style"
      value={values.eyeStyle}
      onChange={(next) => onChange({ eyeStyle: next })}
      options={[
        { value: 'square', label: 'Square', icon: <EyeIcon variant="square" /> },
        { value: 'dot', label: 'Dot', icon: <EyeIcon variant="dot" /> },
      ]}
    />

    <details className="advanced">
      <summary>Advanced Settings</summary>
      <div className="advanced-grid">
        <label className="field">
          <span>Margin</span>
          <input
            type="number"
            min={0}
            max={8}
            value={values.margin}
            onChange={(event) => onChange({ margin: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Error Correction</span>
          <select
            value={values.errorLevel}
            onChange={(event) =>
              onChange({ errorLevel: event.target.value as StyleValues['errorLevel'] })
            }
          >
            {['L', 'M', 'Q', 'H'].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>
    </details>

    {onReset ? (
      <button type="button" className="button ghost" onClick={onReset}>
        Reset to defaults
      </button>
    ) : null}
  </div>
)

export default StyleController
export type { StyleValues }
