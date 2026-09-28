import { useLocation } from 'react-router';
import { useActiveSection } from './active-section';

// Which nav link is current: on the homepage it follows the chapter in view, elsewhere the page itself.
export function useNavCurrent() {
  const { pathname } = useLocation();
  const section = useActiveSection();
  return (to: string): 'page' | 'location' | undefined => {
    if (pathname === '/') {
      if (section === null) return undefined;
      return to === (section === 'home' ? '/' : `/#${section}`) ? 'location' : undefined;
    }
    return to === pathname ? 'page' : undefined;
  };
}
