"use client";

import {
  useEffect,
  useRef,
  type ElementType,
  type HTMLAttributes,
} from "react";

export type CountUpProps = {
  /** Final display string, e.g. "27", "06", "100+", "1.2M", "1,234,567". */
  value: string;
  /** Animation length in ms. */
  durationMs?: number;
  /** IntersectionObserver threshold (0–1). */
  threshold?: number;
  className?: string;
  as?: "span" | "p" | "div";
} & Omit<HTMLAttributes<HTMLElement>, "children">;

type ParsedStat = {
  target: number;
  decimals: number;
  pad: number;
  prefix: string;
  suffix: string;
  useGrouping: boolean;
};

const MAX_DIGITS = 10;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Parse a display stat into a countable target + format metadata.
 * Supports up to 10 significant digits, grouping commas, decimals, and suffixes (+, M, K, %).
 */
export function parseStatValue(raw: string): ParsedStat | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^([^\d-]*)(-?\d{1,10}(?:,\d{3})*(?:\.\d+)?)([^\d]*)$/,
  );
  if (!match) return null;

  const [, prefix, numeric, suffix] = match;
  const useGrouping = numeric.includes(",");
  const clean = numeric.replace(/,/g, "");
  const decimals = clean.includes(".") ? (clean.split(".")[1]?.length ?? 0) : 0;
  const intPart = clean.split(".")[0]?.replace(/^-/, "") ?? "";
  const pad =
    !useGrouping && !decimals && /^0\d+$/.test(intPart) ? intPart.length : 0;
  const target = Number(clean);
  if (!Number.isFinite(target)) return null;

  const significant = clean.replace(/^-/, "").replace(".", "");
  if (significant.length > MAX_DIGITS) return null;

  return { target, decimals, pad, prefix, suffix, useGrouping };
}

export function formatStatValue(n: number, parsed: ParsedStat): string {
  const abs = Math.abs(n);
  let body: string;

  if (parsed.decimals > 0) {
    body = abs.toFixed(parsed.decimals);
    if (parsed.useGrouping) {
      const [intPart, frac] = body.split(".");
      body = `${Number(intPart).toLocaleString("en-US")}.${frac}`;
    }
  } else {
    const rounded = Math.round(abs);
    if (parsed.pad > 0) {
      body = String(rounded).padStart(parsed.pad, "0");
    } else if (parsed.useGrouping) {
      body = rounded.toLocaleString("en-US");
    } else {
      body = String(rounded);
    }
  }

  const signed = n < 0 ? `-${body}` : body;
  return `${parsed.prefix}${signed}${parsed.suffix}`;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Counts from 0 → value once when the element enters the viewport.
 * Reduced motion / unparsable values show the final string immediately.
 */
export function CountUp({
  value,
  durationMs = 1600,
  threshold = 0.35,
  className,
  as: Tag = "span",
  ...rest
}: CountUpProps) {
  const ref = useRef<HTMLElement | null>(null);
  const started = useRef(false);
  const Component = Tag as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parsed = parseStatValue(value);
    const writeFinal = () => {
      el.textContent = value;
    };

    if (!parsed || prefersReducedMotion()) {
      writeFinal();
      return;
    }

    el.textContent = formatStatValue(0, parsed);
    let raf = 0;

    const run = () => {
      if (started.current) return;
      started.current = true;

      const from = 0;
      const to = parsed.target;
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const current = from + (to - from) * easeOutCubic(t);
        el.textContent = formatStatValue(current, parsed);
        if (t < 1) {
          raf = window.requestAnimationFrame(tick);
        } else {
          writeFinal();
        }
      };

      raf = window.requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          run();
          io.disconnect();
          break;
        }
      },
      { threshold },
    );

    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [value, durationMs, threshold]);

  return (
    <Component ref={ref} className={className} {...rest}>
      {value}
    </Component>
  );
}
