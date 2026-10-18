import { useRef, useState } from 'react';
import { colors } from '../../theme/colors';
import type { DateTimeDialogProps } from './DateTimeDialog.types';

export function DateTimeDialog({ mode, value, onConfirm, onCancel }: DateTimeDialogProps) {
  const initial = mode === 'date'
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  const [draft, setDraft] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  const confirm = () => {
    const current = input.current?.value ?? draft;
    if (!current) return;
    const selected = mode === 'date' ? new Date(`${current}T12:00:00`) : new Date(value);
    if (mode === 'time') { const [hour, minute] = current.split(':').map(Number); selected.setHours(hour, minute, 0, 0); }
    if (!Number.isNaN(selected.getTime())) onConfirm(selected);
  };
  const button = { minHeight: 44, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '8px 18px', fontSize: 16, cursor: 'pointer' };
  return <div role="dialog" aria-modal="true" aria-label={mode === 'date' ? 'Choose date' : 'Choose time'} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(36,52,94,0.3)', zIndex: 20, padding: 20 }}>
    <div style={{ width: '100%', maxWidth: 360, borderRadius: 20, background: colors.surface, padding: 24, boxSizing: 'border-box' }}>
      <h2 style={{ color: colors.text, fontSize: 20, marginTop: 0 }}>{mode === 'date' ? 'Choose date' : 'Choose time'}</h2>
      <input ref={input} aria-label={mode === 'date' ? 'Date' : 'Time'} type={mode} defaultValue={initial} onInput={event => setDraft(event.currentTarget.value)} style={{ boxSizing: 'border-box', width: '100%', minHeight: 48, fontSize: 18, borderRadius: 10, padding: 10, color: colors.text, border: `1px solid ${colors.border}` }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={onCancel} style={{ ...button, color: colors.primary, background: colors.surface }}>Cancel</button>
        <button disabled={!draft} onClick={confirm} style={{ ...button, color: colors.surface, background: colors.primary }}>Done</button>
      </div>
    </div>
  </div>;
}
