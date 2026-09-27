import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '~/utils/cx';

type Variant = 'brass' | 'outline';

type ButtonProps = { variant?: Variant; children: ReactNode; className?: string } & (
  | ({ to: LinkProps['to'] } & Omit<LinkProps, 'to' | 'className' | 'children'>)
  | ({ to?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
);

// base: resting look · fill: colour that wipes in · label: text colour once filled
const variants: Record<Variant, { base: string; fill: string; label: string }> = {
  brass: {
    base: 'bg-brass px-11 py-5 font-eyebrow text-eyebrow tracking-caps text-pine',
    fill: 'bg-pine',
    label: 'text-snow',
  },
  outline: {
    base: 'border border-snow/55 px-8.5 py-3.5 font-body text-eyebrow font-normal tracking-label text-snow hover:border-brass focus-visible:border-brass active:border-brass',
    fill: 'bg-brass',
    label: 'text-pine',
  },
};

const wipe = 'duration-(--duration-cta-fill) ease-in-out-soft motion-reduce:transition-none';

// CTA spec: the fill wipes in from the left on hover, focus and press, and the label changes colour along the fill edge.
export function Button({ variant = 'brass', children, className, ...props }: ButtonProps) {
  const { base, fill, label } = variants[variant];
  const content = (
    <>
      <span
        aria-hidden
        className={cx('absolute inset-0 origin-left scale-x-0 transition-[scale] group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100', fill, wipe)}
      />
      <span className="relative uppercase">{children}</span>
      <span
        aria-hidden
        className={cx(
          'absolute inset-0 flex items-center justify-center uppercase transition-[clip-path] [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0)] group-focus-visible:[clip-path:inset(0)] group-active:[clip-path:inset(0)]',
          label,
          wipe,
        )}
      >
        {children}
      </span>
    </>
  );
  const classes = cx('group relative inline-flex items-center justify-center overflow-hidden transition-[border-color]', wipe, base, className);

  if (props.to !== undefined) {
    return (
      <Link {...props} className={classes}>
        {content}
      </Link>
    );
  }
  const { type = 'button', ...rest } = props;
  return (
    <button type={type} {...rest} className={classes}>
      {content}
    </button>
  );
}
