/**
 * Convert a raw upstream/SDK error message into Korean text the user can
 * actually act on. Backends (fal, nemotron, fetch network failures) surface
 * English strings or HTTP-status text directly; UI consumers should NEVER
 * paint those raw verbatim — they're noise to a non-engineer.
 *
 * Returns a `{ title, detail? }` pair so cards can render a short Korean
 * one-liner and tuck the raw message into a smaller secondary line for
 * developer / support debugging.
 */
export type HumanizedError = {
  /** Short Korean sentence the user sees first. */
  title: string;
  /**
   * Optional raw / technical addendum. Only set when the matched bucket
   * isn't self-evidently the cause, so we keep enough breadcrumb for
   * support tickets without burying the user-facing summary.
   */
  detail?: string;
};

const GENERIC_FALLBACK = "에셋 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";

export function humanizeError(raw: string | undefined | null): HumanizedError {
  if (!raw) return { title: GENERIC_FALLBACK };
  const msg = String(raw).trim();
  if (!msg) return { title: GENERIC_FALLBACK };
  const lower = msg.toLowerCase();

  // Timeout — model took longer than its deadline. User retry usually works.
  if (
    /(timeout|timed?\s*out|deadline\s*exceeded|etimedout)/i.test(msg) ||
    /504/.test(msg)
  ) {
    return {
      title: "생성 시간이 초과되었습니다. 다시 시도해주세요.",
      detail: msg,
    };
  }

  // Image-content rejections from fal/openai image models. Frequent enough
  // to deserve a dedicated bucket — usually the source photo, not the prompt.
  if (
    /invalid_image|unsupported_image|image\s*(too\s*small|resolution|format)/i.test(
      msg,
    ) ||
    /(해상도|이미지\s*형식|이미지\s*용량)/.test(msg)
  ) {
    return {
      title: "이미지가 모델 요구사항을 만족하지 못합니다. 다른 사진으로 다시 시도해주세요.",
      detail: msg,
    };
  }

  // Content/safety filter (fal returns this for blocked prompts/images).
  if (/(content_policy|safety|moderation|blocked|nsfw)/i.test(msg)) {
    return {
      title: "콘텐츠 정책에 의해 차단되었습니다. 다른 이미지나 문구로 다시 시도해주세요.",
      detail: msg,
    };
  }

  // Auth / quota — these don't fix themselves on retry, surface plainly.
  if (/(unauthor|invalid[_\s]?key|forbidden|401|403)/i.test(lower)) {
    return {
      title: "API 인증에 실패했습니다. 관리자에게 문의해주세요.",
      detail: msg,
    };
  }
  if (/(quota|rate[_\s]?limit|429|too\s*many\s*requests|insufficient)/i.test(lower)) {
    return {
      title: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
      detail: msg,
    };
  }

  // Network / fetch / connection — most common transient.
  if (
    /(network|fetch\s*failed|enotfound|econnreset|econnrefused|failed\s*to\s*fetch)/i.test(
      lower,
    )
  ) {
    return {
      title: "네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.",
      detail: msg,
    };
  }

  // Generic 5xx / "internal" upstream.
  if (/(internal\s*server|5\d\d|upstream|service\s*unavailable)/i.test(lower)) {
    return {
      title: "모델 서버에 일시적인 문제가 발생했습니다. 다시 시도해주세요.",
      detail: msg,
    };
  }

  // The message already starts with Korean — likely already humanized
  // upstream (we set Korean messages in the store catch blocks). Pass through.
  if (/^[가-힣]/.test(msg)) {
    return { title: msg };
  }

  // Fallback — show the generic message but keep the raw for context.
  return { title: GENERIC_FALLBACK, detail: msg };
}
