import { useRef } from 'react'
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

const SegmentedControl = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; glyph: string }[]
  onChange: (next: T) => void
}) => (
  <div className="segmented-field">
    <span>{label}</span>
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'segment active' : 'segment'}
          onClick={() => onChange(option.value)}
        >
          <span className="segment-glyph">{option.glyph}</span>
          {option.label}
        </button>
      ))}
    </div>
  </div>
)

const StyleController = ({ values, onChange }: StyleControllerProps) => (
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

    <SegmentedControl
      label="Module style"
      value={values.moduleStyle}
      onChange={(next) => onChange({ moduleStyle: next })}
      options={[
        { value: 'square', label: 'Square', glyph: 'SQ' },
        { value: 'rounded', label: 'Rounded', glyph: 'RD' },
        { value: 'dots', label: 'Dots', glyph: 'DT' },
        { value: 'extra-rounded', label: 'Extra', glyph: 'XR' },
        { value: 'classy', label: 'Classy', glyph: 'CL' },
        { value: 'classy-rounded', label: 'Soft', glyph: 'CR' },
      ]}
    />

    <SegmentedControl
      label="Corner style"
      value={values.cornerStyle}
      onChange={(next) => onChange({ cornerStyle: next })}
      options={[
        { value: 'square', label: 'Square', glyph: 'SQ' },
        { value: 'extra-rounded', label: 'Rounded', glyph: 'RD' },
      ]}
    />

    <SegmentedControl
      label="Eye style"
      value={values.eyeStyle}
      onChange={(next) => onChange({ eyeStyle: next })}
      options={[
        { value: 'square', label: 'Square', glyph: 'SQ' },
        { value: 'dot', label: 'Dot', glyph: 'DT' },
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
  </div>
)

export default StyleController
export type { StyleValues }
