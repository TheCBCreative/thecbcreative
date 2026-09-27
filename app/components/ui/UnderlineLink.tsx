import { Link, NavLink, type LinkProps } from 'react-router';
import { underline } from '~/styles/underline';
import { cx } from '~/utils/cx';

interface UnderlineLinkProps extends LinkProps {
  nav?: boolean;
}

export function UnderlineLink({ nav, className, ...props }: UnderlineLinkProps) {
  const classes = cx(
    underline,
    'hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:after:scale-x-100',
    className as string,
  );
  return nav ? <NavLink {...props} className={classes} end /> : <Link {...props} className={classes} />;
}
