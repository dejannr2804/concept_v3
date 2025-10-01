"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectPopupProps = {
  value?: string | null
  options: SelectOption[]
  onChange: (next: string | null) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}

export default function SelectPopup({ value, options, onChange, placeholder = 'Select…', ariaLabel, className }: SelectPopupProps) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState<number>(-1)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value])
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]?.label : ''

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const r = rootRef.current
      if (!r) return
      if (!r.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // When opening, highlight the current selection or the first enabled option
    const idx = selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled)
    setHighlight(idx)
  }, [open, selectedIndex, options])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      let i = highlight
      do { i = (i + 1 + options.length) % options.length } while (options[i]?.disabled && i !== highlight)
      setHighlight(i)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      let i = highlight
      do { i = (i - 1 + options.length) % options.length } while (options[i]?.disabled && i !== highlight)
      setHighlight(i)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight >= 0 && !options[highlight]?.disabled) {
        const next = options[highlight]?.value ?? null
        onChange(next)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={`pe-selectMenu ${className || ''}`} ref={rootRef}>
      <button
        type="button"
        className="pe-selectControl"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        ref={btnRef}
        onKeyDown={onKeyDown}
      >
        <span>{selectedLabel || placeholder}</span>
        <img src="/img/chevron-down.svg" alt="" className="pe-icon"/>
      </button>
      {open && (
        <ul className="pe-selectList" role="listbox">
          {options.length === 0 ? (
            <li className="pe-option is-empty">No options</li>
          ) : (
            options.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`pe-option ${opt.value === value ? 'is-selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (opt.disabled) return
                  onChange(opt.value)
                  setOpen(false)
                  requestAnimationFrame(() => btnRef.current?.blur())
                }}
                onMouseEnter={() => setHighlight(idx)}
                style={highlight === idx ? { background: '#f5f5f5' } : undefined}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

