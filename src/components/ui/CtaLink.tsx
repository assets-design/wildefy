import type { MouseEventHandler, ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/**
 * Site-wide CTA — hero geometry:
 * white pill + label, orange mark overlapping the right edge, bird centered in mark.
 */
export function CtaLink({ href, children, className, onClick }: Props) {
  const classes = className ? `cta ${className}` : "cta";

  return (
    <a className={classes} href={href} onClick={onClick}>
      <span className="cta-pill" aria-hidden="true" />
      <span className="cta-label">{children}</span>
      <span className="cta-mark" aria-hidden="true">
        <img
          className="cta-bird"
          src="/images/hero/hummingbird.png"
          alt=""
          width={37}
          height={37}
          draggable={false}
        />
      </span>
    </a>
  );
}
