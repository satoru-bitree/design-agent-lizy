/* global React, Icon */
const { useState: useStateCtl } = React;

const Button = ({ variant = 'primary', leading, trailing, children, onClick, disabled, style }) => {
  const base = { fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '14px 22px', borderRadius: 12, border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background var(--dur-micro) var(--ease), transform var(--dur-micro) var(--ease)', opacity: disabled ? 0.4 : 1, lineHeight: 1, whiteSpace: 'nowrap' };
  const v = {
    primary:   { background: 'var(--mint)', color: 'var(--bg)' },
    secondary: { background: 'transparent', color: 'var(--fg)', borderColor: 'var(--border-strong)' },
    tertiary:  { background: 'transparent', color: 'var(--fg)', padding: '14px 16px' },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...v, ...style }}
      onMouseEnter={(e) => { if (variant === 'primary' && !disabled) e.currentTarget.style.background = 'var(--mint-hover)'; }}
      onMouseLeave={(e) => { if (variant === 'primary' && !disabled) e.currentTarget.style.background = 'var(--mint)'; }}>
      {leading}{children}{trailing}
    </button>
  );
};

const Pill = ({ active, children, leading, onClick, variant = 'filled' }) => {
  const base = { padding: '9px 16px', borderRadius: 9999, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all var(--dur-micro) var(--ease)', userSelect: 'none' };
  const off = { background: 'var(--surface-2)', color: 'var(--fg-dim)' };
  const onFilled = { background: 'var(--mint)', color: 'var(--bg)', fontWeight: 600 };
  const onOutline = { background: 'transparent', border: '1.5px solid var(--mint)', color: 'var(--mint)', fontWeight: 600, padding: '7.5px 14.5px' };
  const style = active ? (variant === 'outline' ? onOutline : onFilled) : off;
  return <span onClick={onClick} style={{ ...base, ...style }}>{leading}{children}</span>;
};

const StatusPill = ({ tone = 'pending', children }) => {
  const tones = {
    active:  { background: 'rgba(0,200,150,0.12)', color: 'var(--mint)' },
    pending: { background: 'var(--surface-2)', color: 'var(--fg-dim)' },
    review:  { background: 'rgba(0,200,150,0.12)', color: 'var(--mint)' },
  }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 11px', borderRadius: 9999, fontSize: 12, ...tones }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', animation: 'lzPulse 1.5s ease-in-out infinite' }} />
      {children}
    </span>
  );
};

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>{label}</span>
    {children}
  </label>
);

const TextInput = ({ value, onChange, placeholder }) => {
  const [focus, setFocus] = useStateCtl(false);
  return (
    <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', color: 'var(--fg)', fontFamily: 'var(--font-body)', fontSize: 14, border: '1px solid ' + (focus ? 'var(--mint)' : 'transparent'), outline: 'none', boxShadow: focus ? '0 0 0 3px rgba(0,200,150,0.15)' : 'none', transition: 'all var(--dur-micro) var(--ease)' }} />
  );
};

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => {
  const [focus, setFocus] = useStateCtl(false);
  return (
    <textarea value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', color: 'var(--fg)', fontFamily: 'var(--font-body)', fontSize: 14, border: '1px solid ' + (focus ? 'var(--mint)' : 'transparent'), outline: 'none', resize: 'vertical', boxShadow: focus ? '0 0 0 3px rgba(0,200,150,0.15)' : 'none', transition: 'all var(--dur-micro) var(--ease)' }} />
  );
};

const Select = ({ value, options, onChange }) => {
  const [open, setOpen] = useStateCtl(false);
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)}
        style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'var(--fg)', fontSize: 14 }}>
        <span>{value}</span>
        <span style={{ color: 'var(--fg-muted)', display: 'inline-flex', alignItems: 'center' }}><Icon name="chevron-down" size={14} stroke={1.75}/></span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, zIndex: 50, boxShadow: 'var(--shadow-modal)' }}>
          {options.map((o) => (
            <div key={o} onClick={() => { onChange?.(o); setOpen(false); }}
              style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: o === value ? 'var(--mint)' : 'var(--fg)', background: o === value ? 'rgba(0,200,150,0.08)' : 'transparent' }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dropzone = ({ filled }) => (
  <div style={{ background: 'var(--surface-1)', border: '1.5px dashed ' + (filled ? 'var(--mint)' : 'var(--fg-faint)'), borderRadius: 12, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'border-color var(--dur-base) var(--ease)' }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: filled ? 'var(--mint-hover)' : 'var(--mint)' }}>
      <Icon name={filled ? 'check' : 'upload'} size={20}/>
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>
      {filled ? '연두 150ml.png' : '제품 사진을 드래그 앤 드롭 하세요'}
    </div>
    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>PNG, JPG · max 10MB</div>
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, ...style }}>{children}</div>
);

window.Button = Button;
window.Pill = Pill;
window.StatusPill = StatusPill;
window.Field = Field;
window.TextInput = TextInput;
window.Textarea = Textarea;
window.Select = Select;
window.Dropzone = Dropzone;
window.LzCard = Card;
