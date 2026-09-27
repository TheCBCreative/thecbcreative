import { MotionConfig } from 'motion/react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { FlipProvider } from '~/components/flip/FlipProvider';
import type { Route } from './+types/root';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/brand/favicon.ico', sizes: '48x48' },
  { rel: 'icon', href: '/brand/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/brand/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1b2318" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {import.meta.env.PROD && <script defer src="/_vercel/insights/script.js" />}
      </body>
    </html>
  );
}

// Reduced motion keeps fades but drops movement.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <FlipProvider>
        <Outlet />
      </FlipProvider>
    </MotionConfig>
  );
}
