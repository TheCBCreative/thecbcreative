import type { ReactNode } from 'react';
import { cx } from '~/utils/cx';

interface ChapterProps {
  id?: string;
  labelledBy: string;
  grade?: boolean;
  withFooter?: boolean;
  className?: string;
  children: ReactNode;
}

// One full-viewport chapter scrolling over the sticky video; content sits below the fixed nav.
// `grade` darkens the sky band so text on it passes AA; `withFooter` leaves room for the footer strip.
export function Chapter({ id, labelledBy, grade, withFooter, className, children }: ChapterProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx('relative flex flex-col overflow-clip', withFooter ? 'min-h-[calc(100svh-var(--spacing)*18)]' : 'min-h-svh')}
    >
      {grade && <div aria-hidden className="pointer-events-none absolute inset-0 bg-(image:--scrim-top-grade)" />}
      <div className={cx('relative flex flex-1 flex-col pt-nav', className)}>{children}</div>
    </section>
  );
}
