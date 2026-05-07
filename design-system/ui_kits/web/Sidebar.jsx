/* global React, Icon */
const Sidebar = ({ active = '프로젝트' }) => {
  const items = [
    { name: '프로젝트', icon: 'folder' },
    { name: '생성 내역', icon: 'sparkles' },
    { name: '스타일 모델', icon: 'palette' },
    { name: '통계/분석', icon: 'chart' },
  ];
  return (
    <aside style={{ width: 220, padding: '24px 16px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--fg)' }}>AI Creative</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>Pro Plan</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it) => {
          const on = it.name === active;
          return (
            <div key={it.name}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, color: on ? 'var(--mint)' : 'var(--fg-dim)', background: on ? 'var(--surface-1)' : 'transparent', borderLeft: on ? '2px solid var(--mint)' : '2px solid transparent', fontSize: 13, fontFamily: 'var(--font-kr)', cursor: 'pointer', fontWeight: on ? 600 : 400 }}>
              <Icon name={it.icon} size={16}/>
              <span>{it.name}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
window.Sidebar = Sidebar;
