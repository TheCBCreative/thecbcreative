import { useSyncExternalStore } from 'react';

// The homepage chapter currently in view (about, services), or null in the hero and unlinked chapters.
let active: string | null = null;
const listeners = new Set<() => void>();

export function setActiveSection(section: string | null) {
  if (section === active) return;
  active = section;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useActiveSection = () => useSyncExternalStore(subscribe, () => active, () => null);
