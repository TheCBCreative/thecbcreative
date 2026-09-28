import { Link, type LinkProps } from 'react-router';
import { underline } from '~/styles/underline';
import { cx } from '~/utils/cx';

export function UnderlineLink({ className, ...props }: LinkProps & { className?: string }) {
  return (
    <Link
      {...props}
      className={cx(
        underline,
        'hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:after:scale-x-100 aria-[current=location]:after:scale-x-100',
        className,
      )}
    />
  );
}
