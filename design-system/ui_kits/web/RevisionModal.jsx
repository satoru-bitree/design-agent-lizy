/* global React, Icon, Pill, Textarea, Button, ProductMock */
const { useState: useStateRev } = React;

const RevisionModal = ({ kind, onClose, onSubmit }) => {
  const [tone, setTone] = useStateRev('더 밝은 톤');
  const [note, setNote] = useStateRev('');

  const titles = {
    pkg: ['패키지 디자인 #2', '연두 패키지의 비주얼 파라미터를 조정합니다.'],
    styled: ['스타일 샷 #2', '샘표 연두 에셋의 비주얼 파라미터를 조정합니다.'],
    video: ['숏폼 영상 #2', '영상의 무드와 페이싱 파라미터를 조정합니다.'],
  }[kind || 'styled'];

  const quick = ['더 밝은 톤', '취소', '취소', '취소', '취소'];

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100, animation: 'lzFade 200ms var(--ease)' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 'min(720px, 92vw)', maxHeight: '92vh', overflow: 'auto', boxShadow: 'var(--shadow-modal)', animation: 'lzRise 240ms var(--ease)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-kr), var(--font-display)' }}>{titles[0]}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-dim)', marginTop: 6, fontFamily: 'var(--font-kr)' }}>{titles[1]}</div>
          </div>
          <span onClick={onClose} style={{ cursor: 'pointer', display: 'flex', color: 'var(--fg-dim)', padding: 4 }}>
            <Icon name="x" size={20}/>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>현재 생성본</div>
            <div style={{ borderRadius: 10, overflow: 'hidden' }}>
              <ProductMock hue="amber"/>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>수정 버전 (대기 중)</div>
            <div style={{ aspectRatio: '1 / 1.1', borderRadius: 10, border: '1.5px dashed var(--fg-faint)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint)', animation: 'lzSpin 2s linear infinite' }}>
                <Icon name="refresh" size={16}/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-kr)' }}>입력 파라미터 대기 중</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10, fontFamily: 'var(--font-kr)' }}>빠른 수정 사항</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quick.map((q, i) => (
              <Pill key={i} active={tone === q && i === 0} variant="outline" onClick={() => setTone(q)}
                leading={tone === q && i === 0 ? <span style={{ fontSize: 11 }}>✓</span> : null}>
                {q}
              </Pill>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 10, fontFamily: 'var(--font-kr)' }}>수정 요청 사항</div>
          <Textarea value={note} onChange={setNote} placeholder="예: 배경 밝기 증가, 제품 각도 조절, 녹색 포인트 강조 등" rows={3}/>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-dim)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mint)', animation: 'lzPulse 1.5s ease-in-out infinite' }}/>
            <span style={{ fontFamily: 'var(--font-kr)' }}>예상 재생성 시간: 3분 이내</span>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="tertiary" onClick={onClose}><span style={{ fontFamily: 'var(--font-kr)' }}>취소</span></Button>
            <Button onClick={onSubmit} trailing={<span style={{ marginLeft: 4 }}>→</span>}>
              <span style={{ fontFamily: 'var(--font-kr)' }}>수정 요청 제출</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
window.RevisionModal = RevisionModal;
