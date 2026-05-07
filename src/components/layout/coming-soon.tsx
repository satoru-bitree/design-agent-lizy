import Link from "next/link";
import { StatusDot } from "@/components/ui/status-dot";

export type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-[440px] flex-col items-center gap-7 text-center">
        <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface-1 px-3 py-1.5">
          <StatusDot tone="pending" />
          <span className="font-body text-meta font-medium uppercase tracking-[0.18em] text-fg-muted">
            준비 중
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-h1 font-bold tracking-[-0.005em] text-fg">
            {title}
          </h1>
          <p className="font-kr text-[14px] leading-[1.55] text-fg-dim">
            {description ?? (
              <>
                이 화면은 아직 구현되지 않았습니다.
                <br />
                현재 프로토타입에서는{" "}
                <span className="text-fg">대시보드</span> 화면만 동작합니다.
              </>
            )}
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-mint px-5 font-kr text-[13px] font-semibold text-bg outline-none transition-all duration-micro ease-lz hover:bg-mint-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint active:scale-[0.98] active:bg-mint-press"
        >
          <span aria-hidden className="leading-none">
            ←
          </span>
          <span>대시보드로 돌아가기</span>
        </Link>
      </section>
    </main>
  );
}
