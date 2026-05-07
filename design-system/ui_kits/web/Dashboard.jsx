/* global React, LzCard, Field, TextInput, Textarea, Select, Pill, Dropzone, Button, BrandGuide, StatusPill, Icon */
const { useState } = React;

const Dashboard = ({ onGenerate }) => {
  const [market, setMarket] = useState('스위스 (독일어)');
  const [types, setTypes] = useState(new Set(['패키지 디자인', '스타일 샷', '숏폼 영상']));
  const [msg, setMsg] = useState('');
  const [filled, setFilled] = useState(false);

  const toggle = (t) => {
    const n = new Set(types);
    n.has(t) ? n.delete(t) : n.add(t);
    setTypes(n);
  };

  return (
    <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Left: input panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0, fontFamily: 'var(--font-kr), var(--font-display)' }}>새 에셋 요청</h1>
          <p style={{ margin: '10px 0 0', color: 'var(--fg-dim)', fontSize: 14, fontFamily: 'var(--font-kr)' }}>AI 에이전트를 설정하여 시장에 즉시 사용 가능한 크리에이티브 에셋을 생성하세요.</p>
        </div>
        <LzCard style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: 28 }}>
          <Field label="제품 이미지 업로드">
            <div onClick={() => setFilled(!filled)} style={{ cursor: 'pointer' }}>
              <Dropzone filled={filled}/>
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18 }}>
            <Field label="타깃 시장">
              <Select value={market} onChange={setMarket} options={['스위스 (독일어)', '스위스 (프랑스어)', '독일', '프랑스', '미국', '일본']}/>
            </Field>
            <Field label="에셋 유형">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {['패키지 디자인', '스타일 샷', '숏폼 영상'].map((t) => (
                  <Pill key={t} active={types.has(t)} onClick={() => toggle(t)}>{t}</Pill>
                ))}
              </div>
            </Field>
          </div>
          <Field label="브랜드 메시지">
            <Textarea value={msg} onChange={setMsg} placeholder="예: 일상 속의 감칠맛, 자연스럽게" rows={3}/>
          </Field>
          <Button onClick={onGenerate} leading={<span style={{ fontSize: 14 }}>✦</span>} style={{ padding: '16px 22px', width: '100%' }}>
            <span style={{ fontFamily: 'var(--font-kr)' }}>에셋 생성하기</span>
          </Button>
        </LzCard>
      </div>

      {/* Right: brand guide */}
      <BrandGuide/>
    </div>
  );
};
window.Dashboard = Dashboard;
