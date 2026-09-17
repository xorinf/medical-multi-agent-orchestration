import { useState } from 'react'
import './ui.css'

export function Button({ variant = 'outline', children, ...rest }) {
  return <button {...rest} className={`btn btn-${variant} ${rest.className || ''}`}>{children}</button>
}

export function Input({ label, type = 'text', ...rest }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword && show ? 'text' : type
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="input-wrap">
        <input {...rest} type={effectiveType}
               className={`input ${isPassword ? 'input-with-suffix' : ''} ${rest.className || ''}`} />
        {isPassword && (
          <button type="button" className="input-suffix"
                  onClick={() => setShow(s => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  tabIndex={-1}>
            {show ? 'hide' : 'show'}
          </button>
        )}
      </div>
    </label>
  )
}

export function Textarea({ label, ...rest }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <textarea {...rest} className={`input textarea ${rest.className || ''}`} />
    </label>
  )
}

export function Select({ label, options = [], ...rest }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      <select {...rest} className={`input ${rest.className || ''}`}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function Card({ children, ...rest }) {
  return <div {...rest} className={`card ${rest.className || ''}`}>{children}</div>
}

export function Pill({ active, children, ...rest }) {
  return <button {...rest} className={`pill ${active ? 'pill-on' : ''}`}>{children}</button>
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state">
      <div className="empty-title">{title}</div>
      {body && <div className="empty-body">{body}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}

export function Toast({ kind = 'info', children, onClose }) {
  return (
    <div className={`toast toast-${kind}`} role="status">
      <span>{children}</span>
      {onClose && <button className="toast-x" onClick={onClose} aria-label="dismiss">×</button>}
    </div>
  )
}

export function Skeleton({ width = '100%', height = 16 }) {
  return <div className="skeleton" style={{ width, height }} />
}

export function Spinner() {
  return <span className="spinner" aria-label="loading" />
}
