import { cx } from '~/utils/cx';

// B1: a Brass underline draws in from the left on hover/focus; the current page keeps it.
export const underline =
  'relative inline-block after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-(--underline) after:transition-transform after:duration-(--duration-link-underline) after:ease-out-soft motion-reduce:after:transition-none';

// For a label inside a larger link (marked `group`) that should underline when the link is hovered.
export const groupUnderline = cx(underline, 'group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100');
