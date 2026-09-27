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

// Hero entrance on load: each line clears in place like lifting fog.
export const HERO_ENTRANCE = { delay: 0.4, duration: 2, stagger: 0.3, blur: 12 } as const;

// Crossfade between two copies of the background video so the loop point doesn't jump.
// The next copy starts VIDEO_LEAD early so it's already playing when the fade begins.
export const VIDEO_CROSSFADE = 2.5;
export const VIDEO_LEAD = 0.5;
