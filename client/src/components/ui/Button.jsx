import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cx } from '@/lib/format';

/**
 * Luxury CTA: magnetic hover, animated shine sweep, optional arrow.
 * variants: gold | ghost | dark | link
 */
export const Button = forwardRef(function Button(
  { as, to, href, variant = 'gold', size = 'md', arrow = false, magnetic = true, className = '', children, loading = false, ...rest },
  forwardedRef,
) {
  const magneticRef = useMagnetic({ strength: variant === 'link' ? 0.15 : 0.3, scale: variant === 'link' ? 1 : 1.03 });
  const ref = magnetic ? magneticRef : forwardedRef;
  const classes = cx('btn', `btn--${variant}`, `btn--${size}`, loading && 'is-loading', className);
  const inner = (
    <>
      <span className="btn__bg" aria-hidden="true" />
      <span className="btn__shine" aria-hidden="true" />
      <span className="btn__label">
        <span className="btn__text" data-text={typeof children === 'string' ? children : undefined}>{children}</span>
        {arrow && (
          <svg className="btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </>
  );

  if (to) return <Link ref={ref} to={to} className={classes} {...rest}>{inner}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...rest}>{inner}</a>;
  const Tag = as || 'button';
  return <Tag ref={ref} className={classes} disabled={loading || rest.disabled} {...rest}>{inner}</Tag>;
});
