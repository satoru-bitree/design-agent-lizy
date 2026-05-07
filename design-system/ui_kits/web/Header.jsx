/* global React, Icon */
const Header = ({ active = '대시보드', onNav }) => {
  const tabs = ['대시보드', '에셋', '워크플로우', '히스토리'];
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 26, color: 'var(--fg)', letterSpacing: '-0.02em', lineHeight: 1 }}>Liz<span style={{ color: 'var(--mint)', fontWeight: 500 }}>y</span></span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--fg-muted)', marginTop: 6, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 }}>Design Agent</span>
        </div>
        <nav style={{ display: 'flex', gap: 28 }}>
          {tabs.map((t) => (
            <span key={t} onClick={() => onNav?.(t)}
              style={{ fontSize: 13, cursor: 'pointer', color: t === active ? 'var(--mint)' : 'var(--fg-muted)', fontWeight: t === active ? 600 : 400, fontFamily: 'var(--font-kr)' }}>{t}</span>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', color: 'var(--fg-dim)' }}>
        <span style={{ display: 'flex', cursor: 'pointer' }}><Icon name="bell" size={18}/></span>
        <span style={{ display: 'flex', cursor: 'pointer' }}><Icon name="settings" size={18}/></span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#5a4a3a,#2a1f15)', border: '1.5px solid var(--mint)' }}/>
      </div>
    </header>
  );
};
window.Header = Header;
