import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { VIDEO_CROSSFADE, VIDEO_LEAD } from '~/styles/motion';
import { cx } from '~/utils/cx';

interface LoopingVideoProps {
  sources: readonly { src: string; media?: string }[];
  poster: string;
  className?: string;
}

// Silent footage that loops without a visible jump: two copies take turns, and near the end of one
// the other starts from the top and fades in over it. Reduced motion shows the poster still.
export function LoopingVideo({ sources, poster, className }: LoopingVideoProps) {
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
    muted: true,
    playsInline: true,
    // Only the first copy downloads up front; the second starts from the browser cache at the first loop.
    preload: index === 0 ? 'auto' : 'none',
    children: sources.map(({ src, media }) => <source key={src} src={src} media={media} type="video/mp4" />),
  });

  return (
    // The poster paints as a background straight away, so there's no empty frame while the video loads.
    <div aria-hidden className={cx('absolute inset-0 overflow-hidden bg-cover bg-center', className)} style={{ backgroundImage: `url(${poster})` }}>
      {/* Silent, decorative footage — no captions needed. */}
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={first} {...layer(0)} poster={poster} />
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={second} {...layer(1)} />
    </div>
  );
}
