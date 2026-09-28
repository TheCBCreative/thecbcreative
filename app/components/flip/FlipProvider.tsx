import { animate, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ServiceCard } from '~/components/sections/ServiceCard';
import type { Service } from '~/data/services';
import { EASE_IN_OUT, FLIP } from '~/styles/motion';
import { FlipContext } from './flip-context';

// Opening: the card turns over to its cream back, grows to fill the screen, then the service page takes over.
// Closing: the reverse, landing back on the card in the Services grid.
type Flip = { service: Service; phase: 'open'; from: DOMRect } | { service: Service; phase: 'close' };

const servicePath = (service: Service) => `/services/${service.slug}`;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// The card's grid cell, which isn't moved by the reveal or hover transforms.
const findCard = (service: Service) => document.querySelector<HTMLElement>(`[data-service="${service.slug}"]`);

function focusCard(service: Service) {
  findCard(service)?.querySelector('a')?.focus({ preventScroll: true });
}

export function FlipProvider({ children }: { children: ReactNode }) {
  const [flip, setFlip] = useState<Flip>();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const open = useCallback(
    (service: Service, from: DOMRect) => {
      if (reduce) navigate(servicePath(service), { state: { fromHome: true } });
      else setFlip({ service, phase: 'open', from });
    },
    [navigate, reduce],
  );

  const close = useCallback(
    (service: Service, fromHome: boolean) => {
      const leave = () => (fromHome ? navigate(-1) : navigate('/#services'));
      if (!reduce) return setFlip({ service, phase: 'close' });
      void Promise.resolve(leave()).then(nextFrame).then(() => focusCard(service));
    },
    [navigate, reduce],
  );

  const value = useMemo(() => ({ activeSlug: flip?.service.slug, open, close }), [flip, open, close]);

  return (
    <FlipContext.Provider value={value}>
      {children}
      {flip && <FlipOverlay key={`${flip.phase}-${flip.service.slug}`} flip={flip} onDone={() => setFlip(undefined)} />}
    </FlipContext.Provider>
  );
}

function FlipOverlay({ flip, onDone }: { flip: Flip; onDone: () => void }) {
  // Plain animate() rather than useAnimate, which stops its animations when Strict Mode re-runs effects.
  const scope = useRef<HTMLDivElement>(null);
  const turner = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const target = flip.phase === 'open' ? servicePath(flip.service) : '/';
  const fromHome = useRef(Boolean((state as { fromHome?: boolean } | null)?.fromHome));
  const arrived = useRef<() => void>(undefined);
  const started = useRef(false);
  const turn = { duration: FLIP.turn, ease: EASE_IN_OUT };
  const grow = { duration: FLIP.grow, ease: EASE_IN_OUT };

  // Resolves the navigation step once the router has rendered the destination.
  useEffect(() => {
    if (pathname === target) arrived.current?.();
  }, [pathname, target]);

  useEffect(() => {
    // Strict Mode mounts effects twice in development; the sequence must only run (and navigate) once.
    if (started.current) return;
    started.current = true;
    const waitFor = (go: () => void) =>
      new Promise<void>((resolve) => {
        arrived.current = resolve;
        go();
      }).then(nextFrame);
    const fullScreen = { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    const container = scope.current!;
    const card = turner.current!;
    const cream = back.current!;

    const run = async () => {
      if (flip.phase === 'open') {
        await animate(card, { rotateY: [0, 180], transformPerspective: FLIP.perspective }, turn);
        await Promise.all([animate(container, fullScreen, grow), animate(cream, { borderRadius: 0 }, grow)]);
        await waitFor(() => navigate(servicePath(flip.service), { state: { fromHome: true } }));
      } else {
        // Jump, rather than smooth-scroll, back to the card so it can be measured where it will land.
        // If the card isn't fully on screen, it lands with its bottom edge at the bottom of the screen.
        const root = document.documentElement;
        root.style.scrollBehavior = 'auto';
        await nextFrame();
        await waitFor(() => (fromHome.current ? navigate(-1) : navigate('/#services')));
        const cell = findCard(flip.service);
        if (cell) {
          let rect = cell.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            cell.scrollIntoView({ block: 'end' });
            rect = cell.getBoundingClientRect();
          }
          const bounds = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
          await Promise.all([animate(container, bounds, grow), animate(cream, { borderRadius: FLIP.cardRadius }, grow)]);
          await animate(card, { rotateY: [180, 0], transformPerspective: FLIP.perspective }, turn);
        }
        root.style.scrollBehavior = '';
      }
      onDone();
      // The card is only focusable once it's visible again.
      if (flip.phase === 'close') void nextFrame().then(() => focusCard(flip.service));
    };
    void run();
    // Runs once per flip; the overlay is keyed by phase and service.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start =
    flip.phase === 'open'
      ? { top: flip.from.top, left: flip.from.left, width: flip.from.width, height: flip.from.height }
      : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  const opening = flip.phase === 'open';

  return (
    <div ref={scope} aria-hidden className="pointer-events-none fixed z-[70]" style={start}>
      <div
        ref={turner}
        className="relative size-full transform-3d"
        style={{ transform: `perspective(${FLIP.perspective}px) rotateY(${opening ? 0 : 180}deg)` }}
      >
        <div className="absolute inset-0 backface-hidden">
          <ServiceCard service={flip.service} face />
        </div>
        <div
          ref={back}
          className="absolute inset-0 rotate-y-180 bg-snow backface-hidden"
          style={{ borderRadius: opening ? FLIP.cardRadius : 0 }}
        />
      </div>
    </div>
  );
}
