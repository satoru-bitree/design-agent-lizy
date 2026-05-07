import { StatusDot } from "@/components/ui/status-dot";
import { PaletteSync } from "@/components/dashboard/palette-sync";

export function BrandGuidePanel() {
  return (
    <aside className="flex flex-col gap-6 rounded-xl border border-border bg-surface-1 p-5 transition-colors duration-micro ease-lz hover:border-border-strong sm:p-6">
      {/* Header — title + LIVE SYNC badge */}
      <div className="flex items-center justify-between">
        <h2 className="font-kr text-h3 font-bold text-fg">
          브랜드 가이드 적용됨
        </h2>
        <span className="inline-flex items-center gap-2 rounded-pill bg-mint-soft px-[11px] py-[5px] text-[12px] text-mint">
          <StatusDot tone="active" size={7} />
          LIVE SYNC
        </span>
      </div>

      {/* Master logo — 더미 클라이언트 브랜드 placeholder.
         실제 운영 시 props 로 받은 클라이언트 로고 자산으로 교체될 영역. */}
      <Section label="마스터 로고">
        <div className="flex justify-center rounded-md border border-border bg-[#0A0A0A] py-7">
          <span
            className="select-none italic"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#E63946",
              letterSpacing: "-0.02em",
            }}
          >
            Sempio
          </span>
        </div>
      </Section>

      {/* Color palette — periodic 800ms flicker on cells (LIVE SYNC cue) */}
      <Section label="컬러 팔레트">
        <PaletteSync />
      </Section>

      {/* Typography system */}
      <Section label="타이포그래피 시스템">
        <div className="flex flex-col gap-1 rounded-md bg-surface-2 p-4">
          <div
            className="text-[9px] uppercase text-fg-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            HEADING / MANROPE BOLD
          </div>
          <div className="font-kr text-h3 font-bold text-fg">
            장인 디자인 에이전트
          </div>
          <div aria-hidden className="my-2 h-px bg-border" />
          <div
            className="text-[9px] uppercase text-fg-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            BODY / INTER REGULAR
          </div>
          <div className="font-kr text-[12px] leading-[1.5] text-fg-dim">
            크리에이티브 제작의 미래는 에이전틱하고 정밀하며 시각적으로 완벽합니다.
          </div>
        </div>
      </Section>

      {/* Mood reference */}
      <Section label="무드 참조">
        <div
          className="relative flex h-[110px] flex-col items-center justify-center gap-1 overflow-hidden rounded-md"
          style={{
            background:
              "linear-gradient(135deg, #0c1714 0%, #142822 50%, #0a1410 100%)",
          }}
        >
          <div
            className="font-display text-[11px] font-semibold"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              letterSpacing: "0.18em",
            }}
          >
            VISUAL INSPIRATION
          </div>
          <div
            className="font-display text-[22px] font-bold text-fg"
            style={{ letterSpacing: "0.02em" }}
          >
            SAFE WORK
          </div>
        </div>
      </Section>
    </aside>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-kr text-[11px] text-fg-muted">{label}</div>
      {children}
    </div>
  );
}
