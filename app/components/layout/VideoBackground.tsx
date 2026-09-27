import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { VIDEO_CROSSFADE, VIDEO_LEAD } from '~/styles/motion';
import { cx } from '~/utils/cx';

const SOURCE = '/media/mountain/desktop.mp4';
const POSTER = '/media/mountain/desktop.jpg';

// The sticky mountain footage behind every chapter. Two copies take turns: near the end of one,
// the other starts from the top and fades in over it. Reduced motion shows the poster still.
export function VideoBackground() {
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [active, setActive] = useState<0 | 1>(0);
  const [fading, setFading] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => clearTimeout(settle.current), []);

  useEffect(() => {
    const current = (active === 0 ? first : second).current;
    const next = (active === 0 ? second : first).current;
    if (!current || !next) return;
    if (reduceMotion) {
      current.pause();
      return;
    }
    current.play().catch(() => {});

    const startFade = () => {
      setFading(true);
      setActive(active === 0 ? 1 : 0);
      settle.current = setTimeout(() => {
        current.pause();
        setFading(false);
      }, VIDEO_CROSSFADE * 1000);
    };
    const onTimeUpdate = () => {
      if (current.duration - current.currentTime > VIDEO_CROSSFADE + VIDEO_LEAD) return;
      current.removeEventListener('timeupdate', onTimeUpdate);
      next.currentTime = 0;
      next.addEventListener('playing', startFade, { once: true });
      next.play().catch(() => {});
    };
    current.addEventListener('timeupdate', onTimeUpdate);
    return () => current.removeEventListener('timeupdate', onTimeUpdate);
  }, [active, reduceMotion]);

  const layer = (index: 0 | 1) => ({
    className: cx(
      'absolute inset-0 size-full object-cover',
      index === active ? 'z-10 opacity-100 transition-opacity ease-in-out' : fading ? 'opacity-100' : 'opacity-0',
    ),
    style: index === active ? { transitionDuration: `${VIDEO_CROSSFADE}s` } : undefined,
    src: SOURCE,
    muted: true,
    playsInline: true,
    preload: 'auto',
  });

  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-pine">
      {/* Silent, decorative footage — no captions needed. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={first} {...layer(0)} poster={POSTER} />
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={second} {...layer(1)} />
      <div className="absolute inset-0 z-20 bg-(image:--scrim-vignette)" />
    </div>
  );
}
