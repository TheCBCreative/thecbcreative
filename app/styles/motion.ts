// Motion timings from the Figma motion spec and the approved interaction states (D1).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  reveal: 0.6,
  stagger: 0.08,
  draw: 1.6,
  fade: 0.3,
} as const;

export const REVEAL_OFFSET = 24;

// Lists that arrive item by item (About's 01–06): slower and further apart than D1 so each one lands.
export const POINTS_REVEAL = { duration: 0.8, stagger: 0.15 } as const;

// Hero entrance on load: each line clears in place like lifting fog.
export const HERO_ENTRANCE = { delay: 0.4, duration: 2, stagger: 0.3, blur: 12 } as const;

// The strike through "average" is tied to scroll: it starts once the word is ~15% into view
// and is fully drawn when its centre reaches 70% down the screen. The spring smooths the scrub.
export const STRIKE_SCROLL: {
  offset: ['start 85%', 'center 70%'];
  spring: { stiffness: number; damping: number; restDelta: number };
} = {
  offset: ['start 85%', 'center 70%'],
  spring: { stiffness: 90, damping: 28, restDelta: 0.001 },
};

// Scroll range (in viewport heights) over which the hero logo hands off to the nav logo.
export const LOGO_HANDOFF = [0.15, 0.5] as const;

// Service card → page: the card turns over to its cream back, then grows to fill the screen.
// cardRadius matches --radius-sm so the cream back lines up with the card corners.
export const FLIP = { turn: 0.5, grow: 0.6, perspective: 1600, cardRadius: 6 } as const;

// Crossfade between two copies of the background video so the loop point doesn't jump.
// The next copy starts VIDEO_LEAD early so it's already playing when the fade begins.
export const VIDEO_CROSSFADE = 2.5;
export const VIDEO_LEAD = 0.5;
