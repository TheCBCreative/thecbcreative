import { motion, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/Button';
import { Wordmark } from '~/components/ui/Wordmark';
import { NAV_LINKS, SITE } from '~/data/site';
import { useNavCurrent } from '~/hooks/useNavCurrent';
import { DURATION, EASE_OUT, REVEAL_OFFSET } from '~/styles/motion';

const list: Variants = { shown: { transition: { staggerChildren: DURATION.stagger, delayChildren: DURATION.stagger } } };
const item: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  shown: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};

// Phones and small tablets: "Menu" opens a full-screen Pine panel. A modal <dialog> keeps focus inside and closes on Esc.
export function MobileMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const current = useNavCurrent();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    document.documentElement.classList.toggle('overflow-hidden', open);
  }, [open]);

  // Links close it too, as they navigate.
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="eyebrow text-caption tracking-caps text-snow lg:hidden"
      >
        Menu
      </button>
      <dialog
        ref={dialog}
        onClose={close}
        aria-label="Menu"
        className="m-0 size-full max-h-none max-w-none flex-col border-0 bg-pine p-0 text-snow open:flex backdrop:bg-transparent"
      >
        <div className="flex h-nav items-center justify-between px-edge">
          <Link to="/" aria-label={`${SITE.name} — home`} onClick={close}>
            <Wordmark className="h-10 w-32" />
          </Link>
          <button type="button" onClick={close} className="flex items-center gap-3 eyebrow text-caption tracking-caps">
            Close <span aria-hidden className="font-body text-icon leading-none font-extralight">×</span>
          </button>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col px-edge pt-18 pb-10">
          <motion.ol key={String(open)} variants={list} initial="hidden" animate={open ? 'shown' : 'hidden'}>
            {NAV_LINKS.map((link, index) => (
              <motion.li key={link.to} variants={item} className="border-t border-snow/(--opacity-hairline-on-video)">
                <Link
                  to={link.to}
                  onClick={close}
                  aria-current={current(link.to)}
                  className="flex items-baseline gap-5 py-5 aria-[current=location]:text-brass-light aria-[current=page]:text-brass-light"
                >
                  <span aria-hidden className="font-display text-lead-sm text-brass-light">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-display-sm leading-none">{link.label}</span>
                </Link>
              </motion.li>
            ))}
          </motion.ol>
          <div className="mt-auto space-y-5">
            <Button to="/contact" className="w-full">
              Start a project
            </Button>
            <p className="eyebrow text-caption tracking-caps text-snow/75">
              {SITE.locality}, {SITE.region} <span aria-hidden>·</span> © {new Date().getFullYear()} {SITE.name}
            </p>
          </div>
        </nav>
      </dialog>
    </>
  );
}
