// Motion timings from the Figma motion spec and the approved interaction states (D1).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  reveal: 0.9,
  stagger: 0.08,
  draw: 1.6,
  fade: 0.3,
} as const;

export const REVEAL_OFFSET = 24;

// Scroll reveals wait until an element is 20% of the way up from the bottom of the screen, so the fade is seen.
export const REVEAL_VIEWPORT = { once: true, margin: '0px 0px -20% 0px' } as const;

// Lists that arrive item by item (About's 01–06): slower and further apart than D1 so each one lands.
export const POINTS_REVEAL = { duration: 0.8, stagger: 0.15 } as const;

// Hero entrance on load: each line clears in place like lifting fog.
// Phones (below the 1200px switch point) get a lighter blur: animating a heavy blur on large type is costly there.
export const HERO_ENTRANCE = { delay: 0.4, duration: 2, stagger: 0.3, blur: 12, blurPhone: 4, phoneQuery: '(width < 1200px)' } as const;

// The strike through "average" follows the scroll: it starts when the word's top is 70% down the screen
// and is fully drawn when its centre reaches 55%. The spring smooths the scrub.
export const STRIKE_SCROLL = {
  start: 'start 70%',
  end: 'center 55%',
  spring: { stiffness: 90, damping: 28, restDelta: 0.001 },
} as const;

// Scroll range (in viewport heights) over which the hero logo hands off to the nav logo.
export const LOGO_HANDOFF = [0.15, 0.5] as const;

// Service card → page: the card turns over to its cream back, then grows to fill the screen.
// cardRadius matches --radius-sm so the cream back lines up with the card corners.
export const FLIP = { turn: 0.5, grow: 0.6, perspective: 1600, cardRadius: 6 } as const;

// Crossfade between two copies of the background video so the loop point doesn't jump.
// The next copy starts VIDEO_LEAD early so it's already playing when the fade begins.
export const VIDEO_CROSSFADE = 2.5;
export const VIDEO_LEAD = 0.5;
// The first time the footage plays, it fades in over the poster still so the switch doesn't cut.
export const VIDEO_FADE_IN = 1.5;
