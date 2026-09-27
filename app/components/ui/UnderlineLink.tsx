import { Link, NavLink, type LinkProps } from 'react-router';
import { cx } from '~/utils/cx';

// B1: a Brass underline draws in from the left on hover/focus; the current page keeps it.
const underline =
  'relative inline-block after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-(--underline) after:transition-transform after:duration-(--duration-cta-fill) after:ease-out-soft hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none';

interface UnderlineLinkProps extends LinkProps {
  nav?: boolean;
}

export function UnderlineLink({ nav, className, ...props }: UnderlineLinkProps) {
  const classes = cx(underline, className as string);
  return nav ? <NavLink {...props} className={classes} end /> : <Link {...props} className={classes} />;
}
