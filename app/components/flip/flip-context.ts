import { createContext, useContext } from 'react';
import type { Service } from '~/data/services';

export interface FlipContext {
  activeSlug: string | undefined;
  open: (service: Service, from: DOMRect) => void;
  close: (service: Service, fromHome: boolean) => void;
}

export const FlipContext = createContext<FlipContext>({ activeSlug: undefined, open: () => {}, close: () => {} });

export const useFlip = () => useContext(FlipContext);
