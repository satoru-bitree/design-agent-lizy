/* global React, LzCard, StatusPill */
const BrandGuide = () => (
  <LzCard style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>
        <span style={{ fontFamily: 'var(--font-kr), var(--font-display)' }}>브랜드 가이드 적용됨</span>
      </div>
      <StatusPill tone="active">LIVE SYNC</StatusPill>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>마스터 로고</div>
      <div style={{ background: '#0A0A0A', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 0', display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 32, fontWeight: 700, color: '#E63946', letterSpacing: '-0.02em' }}>Sempio</span>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>컬러 팔레트</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[['#00C896', '#00C896'], ['#FFFFFF', '#FFFFFF'], ['#262626', '#262626']].map(([bg, hex]) => (
          <div key={hex} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ aspectRatio: '1.4 / 1', borderRadius: 8, background: bg, border: '1px solid var(--border)' }}/>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center' }}>{hex}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>타이포그래피 시스템</div>
      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 9, color: 'var(--fg-muted)', letterSpacing: '0.08em' }}>HEADING / MANROPE BOLD</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-kr), var(--font-display)' }}>장인 디자인 에이전트</div>
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }}/>
        <div style={{ fontSize: 9, color: 'var(--fg-muted)', letterSpacing: '0.08em' }}>BODY / INTER REGULAR</div>
        <div style={{ fontSize: 12, color: 'var(--fg-dim)', lineHeight: 1.5, fontFamily: 'var(--font-kr)' }}>크리에이티브 제작의 미래는 에이전틱하고 정밀하며 시각적으로 완벽합니다.</div>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>무드 참조</div>
      <div style={{ height: 110, borderRadius: 10, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#0c1714 0%,#142822 50%,#0a1410 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.18em' }}>VISUAL INSPIRATION</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>SAFE WORK</div>
      </div>
    </div>
  </LzCard>
);
window.BrandGuide = BrandGuide;
