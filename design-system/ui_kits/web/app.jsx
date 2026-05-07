/* global React, ReactDOM, Header, Sidebar, Dashboard, ReviewBoard, RevisionModal, Icon */
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const [screen, setScreen] = useStateApp('dashboard'); // dashboard | generating | review
  const [revising, setRevising] = useStateApp(null);    // null | 'pkg' | 'styled' | 'video'
  const [statuses, setStatuses] = useStateApp({ pkg: 'pending', styled: 'pending', video: 'pending' });

  const setStatus = (k, v) => setStatuses((s) => ({ ...s, [k]: v }));

  const onGenerate = () => {
    setScreen('generating');
    setTimeout(() => setScreen('review'), 1600);
  };

  return (
    <div className="lz" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <Header active="대시보드" onNav={(t) => {
        if (t === '대시보드') setScreen('dashboard');
        if (t === '에셋') setScreen('review');
      }}/>

      {screen === 'dashboard' && (
        <Dashboard onGenerate={onGenerate}/>
      )}

      {screen === 'generating' && (
        <div style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint)', animation: 'lzSpin 2s linear infinite' }}>
            <Icon name="sparkles" size={26}/>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, fontFamily: 'var(--font-kr), var(--font-display)' }}>에이전트가 작업 중입니다…</div>
          <div style={{ color: 'var(--fg-dim)', fontSize: 14, fontFamily: 'var(--font-kr)' }}>입력을 분석하고 3종의 에셋을 생성합니다 — 1시간 이내</div>
        </div>
      )}

      {screen === 'review' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 73px)' }}>
          <Sidebar active="프로젝트"/>
          <ReviewBoard onRevise={setRevising} statuses={statuses} setStatus={setStatus}/>
        </div>
      )}

      {/* FAB */}
      <div onClick={() => setScreen('dashboard')}
        style={{ position: 'fixed', right: 32, bottom: 32, width: 56, height: 56, borderRadius: '50%', background: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', cursor: 'pointer', boxShadow: 'var(--shadow-fab)', zIndex: 60 }}>
        <Icon name="plus" size={24}/>
      </div>

      {/* Sample agent status (bottom-left) */}
      {screen !== 'generating' && (
        <div style={{ position: 'fixed', left: 24, bottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9999, background: 'var(--surface-1)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-dim)', zIndex: 60 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', animation: 'lzPulse 1.5s ease-in-out infinite' }}/>
          <span style={{ fontFamily: 'var(--font-kr)' }}>샘플 에이전트: 대기 중</span>
        </div>
      )}

      {revising && (
        <RevisionModal kind={revising}
          onClose={() => setRevising(null)}
          onSubmit={() => { setStatus(revising, 'approved'); setRevising(null); }}/>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
