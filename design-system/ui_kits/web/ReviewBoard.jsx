/* global React, Icon, Button, StatusPill */
const { useState: useStateRB } = React;

// Tiny SVG product mock — bottle silhouette to stand in for generated imagery.
const ProductMock = ({ tag, hue = 'amber' }) => {
  const palettes = {
    amber:  { bg: 'linear-gradient(150deg,#3a2818 0%,#1a0f08 100%)', glass: '#5a3a20', label: '#f4ead8', text: '#1a0f08' },
    olive:  { bg: 'linear-gradient(150deg,#1f3a2a 0%,#0e1a14 100%)', glass: '#3a5a45', label: '#eaf2e6', text: '#1f3a2a' },
    rose:   { bg: 'linear-gradient(150deg,#3a1f28 0%,#1a0e12 100%)', glass: '#5a3a45', label: '#f8e4ea', text: '#3a1f28' },
  };
  const p = palettes[hue];
  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: p.bg, aspectRatio: '1 / 1.1' }}>
      <svg viewBox="0 0 100 110" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect x="42" y="14" width="16" height="10" fill={p.glass} opacity="0.9"/>
        <rect x="38" y="22" width="24" height="6" rx="1" fill={p.glass}/>
        <rect x="36" y="28" width="28" height="62" rx="3" fill={p.glass}/>
        <rect x="40" y="46" width="20" height="22" rx="1" fill={p.label}/>
        <text x="50" y="60" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="6" fill={p.text}>Yondu</text>
        <ellipse cx="50" cy="92" rx="14" ry="2" fill="rgba(0,0,0,0.5)"/>
      </svg>
      {tag && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--surface-1)', color: 'var(--fg)', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, letterSpacing: '0.04em' }}>{tag}</div>}
    </div>
  );
};

// Stylized food still — a plate seen from above with warm light.
const FoodMock = ({ kind = 'plate' }) => {
  const colors = {
    plate:   { bg: '#0e1410', dish: '#3a2a1f', food: '#d49a4a' },
    feed:    { bg: '#1a1410', dish: '#5a3f25', food: '#7aa648' },
    banner:  { bg: '#0a0a0a', dish: '#4a2a18', food: '#c8763a' },
  };
  const c = colors[kind];
  return (
    <div style={{ aspectRatio: '1 / 1', borderRadius: 8, background: c.bg, position: 'relative', overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <circle cx="50" cy="55" r="32" fill={c.dish}/>
        <circle cx="50" cy="55" r="22" fill={c.food} opacity="0.8"/>
        <circle cx="44" cy="52" r="3" fill="#7a4a20"/>
        <circle cx="56" cy="58" r="2.5" fill="#7a4a20"/>
        <circle cx="50" cy="49" r="2" fill="#9a5a30"/>
      </svg>
    </div>
  );
};

const AssetCard = ({ title, headerIcon, children, onApprove, onRevise, status }) => (
  <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 240 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-kr), var(--font-display)' }}>{title}</div>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-dim)' }}>
        <Icon name={headerIcon} size={14}/>
      </div>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {status === 'approved' ? (
        <div style={{ background: 'rgba(0,200,150,0.12)', color: 'var(--mint)', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-kr)' }}>
          <Icon name="check" size={14}/> 승인 완료
        </div>
      ) : (
        <>
          <Button onClick={onApprove} style={{ padding: '12px', width: '100%' }}><span style={{ fontFamily: 'var(--font-kr)' }}>승인</span></Button>
          <Button variant="secondary" onClick={onRevise} style={{ padding: '12px', width: '100%' }}><span style={{ fontFamily: 'var(--font-kr)' }}>수정 요청</span></Button>
        </>
      )}
    </div>
  </div>
);

const ThumbRow = ({ thumb, title, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 10 }}>
    <div style={{ width: 56, height: 56, flexShrink: 0 }}>{thumb}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 600, fontFamily: 'var(--font-kr)' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-kr)' }}>{sub}</div>
    </div>
    <Icon name="external" size={14} style={{ color: 'var(--fg-muted)' }}/>
  </div>
);

const ReviewBoard = ({ onRevise, statuses, setStatus }) => {
  return (
    <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: '-0.005em' }}>
          <span style={{ fontFamily: 'var(--font-kr), var(--font-display)' }}>에셋 생성 완료 — 연두 150ml · 스위스 · 3종</span>
        </h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusPill tone="review">검토 대기 중</StatusPill>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-dim)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', animation: 'lzPulse 1.5s ease-in-out infinite' }}/>
            <span style={{ fontFamily: 'var(--font-kr)' }}>에이전트 모니터링 활성화됨</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        <AssetCard title="패키지 디자인" headerIcon="package" status={statuses.pkg}
          onApprove={() => setStatus('pkg', 'approved')} onRevise={() => onRevise('pkg')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ProductMock tag="DE" hue="amber"/>
            <ProductMock tag="FR" hue="olive"/>
          </div>
        </AssetCard>

        <AssetCard title="스타일 샷" headerIcon="camera" status={statuses.styled}
          onApprove={() => setStatus('styled', 'approved')} onRevise={() => onRevise('styled')}>
          <ThumbRow thumb={<FoodMock kind="plate"/>} title="제품 상세" sub="깔끔한 스튜디오 배경"/>
          <ThumbRow thumb={<FoodMock kind="feed"/>} title="SNS 피드" sub="라이프스타일 평면 구성"/>
          <ThumbRow thumb={<FoodMock kind="banner"/>} title="광고 배너" sub="대비가 강한 주방 배경"/>
        </AssetCard>

        <AssetCard title="숏폼 영상" headerIcon="film" status={statuses.video}
          onApprove={() => setStatus('video', 'approved')} onRevise={() => onRevise('video')}>
          <div style={{ aspectRatio: '9 / 14', borderRadius: 10, background: 'linear-gradient(180deg,#1f1410 0%,#080606 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 140" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <rect x="20" y="40" width="60" height="80" rx="8" fill="#2a1f15"/>
              <ellipse cx="50" cy="48" rx="22" ry="8" fill="#1a0f08"/>
              <circle cx="50" cy="38" r="14" fill="#3a2818"/>
              <ellipse cx="50" cy="105" rx="20" ry="6" fill="#d49a4a" opacity="0.7"/>
            </svg>
            <div style={{ position: 'relative', zIndex: 2, width: 48, height: 48, borderRadius: '50%', background: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', boxShadow: 'var(--shadow-fab)' }}>
              <Icon name="play" size={20}/>
            </div>
          </div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-kr)' }}>틱톡 / 릴스 / 쇼츠</div>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>9:16 · 30s · 4K Export</div>
          </div>
        </AssetCard>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 18, fontSize: 12, color: 'var(--fg-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-kr)' }}>
          효율성 지표:
          <span>기존 방식: <span style={{ color: 'var(--fg)' }}>₩8,000,000 · 2일</span></span>
          <span style={{ color: 'var(--mint)' }}>→</span>
          <span>AI: <span style={{ color: 'var(--mint)' }}>₩50,000 · 1시간</span></span>
        </div>
        <div style={{ display: 'flex', gap: 18, color: 'var(--fg-muted)' }}>
          <span style={{ fontFamily: 'var(--font-kr)' }}>문서</span>
          <span style={{ fontFamily: 'var(--font-kr)' }}>개인정보 보호</span>
          <span>© 2024 AGENTIC SYSTEMS</span>
        </div>
      </div>
    </div>
  );
};
window.ReviewBoard = ReviewBoard;
window.ProductMock = ProductMock;
window.FoodMock = FoodMock;
