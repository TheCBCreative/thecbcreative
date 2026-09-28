import { LoopingVideo } from '~/components/ui/LoopingVideo';
import { MOUNTAIN_VIDEO } from '~/data/media';

// The sticky mountain footage behind every chapter, under a cinematic vignette.
export function VideoBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-pine">
      <LoopingVideo {...MOUNTAIN_VIDEO} />
      <div className="absolute inset-0 z-20 bg-(image:--scrim-vignette)" />
    </div>
  );
}
