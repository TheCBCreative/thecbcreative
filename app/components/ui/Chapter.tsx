import type { ReactNode } from 'react';
import { cx } from '~/utils/cx';

interface ChapterProps {
  id?: string;
  labelledBy: string;
  grade?: boolean;
  className?: string;
  children: ReactNode;
}

// One full-viewport chapter scrolling over the sticky video; content sits below the fixed nav.
// `grade` darkens the sky band so text on it passes AA.
export function Chapter({ id, labelledBy, grade, className, children }: ChapterProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx('relative flex min-h-svh scroll-mt-nav flex-col', className)}>
      {grade && <div aria-hidden className="pointer-events-none absolute inset-0 bg-(image:--scrim-top-grade)" />}
      <div className="relative flex flex-1 flex-col pt-nav">{children}</div>
    </section>
  );
}
