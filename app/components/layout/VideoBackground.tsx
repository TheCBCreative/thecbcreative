import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { VIDEO_CROSSFADE } from '~/styles/motion';
import { cx } from '~/utils/cx';

const SOURCE = '/media/mountain/desktop.mp4';
const POSTER = '/media/mountain/desktop.jpg';

// The sticky mountain footage behind every chapter. Two copies crossfade at the loop point;
// reduced motion shows the poster still.
export function VideoBackground() {
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<0 | 1>(0);
  const [outgoingVisible, setOutgoingVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const current = (active === 0 ? first : second).current;
    const next = (active === 0 ? second : first).current;
    if (!current || !next) return;
    if (reduceMotion) {
      current.pause();
      return;
    }
    current.play().catch(() => {});

    let settle: ReturnType<typeof setTimeout> | undefined;
    const onTimeUpdate = () => {
      if (current.duration - current.currentTime > VIDEO_CROSSFADE) return;
      current.removeEventListener('timeupdate', onTimeUpdate);
      next.currentTime = 0;
      next.play().catch(() => {});
      setOutgoingVisible(true);
      setActive(active === 0 ? 1 : 0);
      settle = setTimeout(() => {
        current.pause();
        setOutgoingVisible(false);
      }, VIDEO_CROSSFADE * 1000);
    };
    current.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      current.removeEventListener('timeupdate', onTimeUpdate);
      clearTimeout(settle);
    };
  }, [active, reduceMotion]);

  const layer = (index: 0 | 1) => ({
    className: cx(
      'absolute inset-0 size-full object-cover',
      index === active ? 'z-10 opacity-100 transition-opacity ease-in-out' : outgoingVisible ? 'opacity-100' : 'opacity-0',
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
