// Motion timings from the Figma motion spec and the approved interaction states (D1).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  reveal: 0.6,
  stagger: 0.08,
  draw: 1.6,
  morph: 0.7,
} as const;

export const REVEAL_OFFSET = 24;

// Crossfade between two copies of the background video so the loop point doesn't jump.
// The next copy starts VIDEO_LEAD early so it's already playing when the fade begins.
export const VIDEO_CROSSFADE = 2.5;
export const VIDEO_LEAD = 0.5;
