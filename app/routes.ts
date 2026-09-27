import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/site-layout.tsx', [
    index('routes/home.tsx'),
    route('contact', 'routes/contact.tsx'),
    route('*', 'routes/not-found.tsx'),
  ]),
  route('services/:slug', 'routes/service.tsx'),
] satisfies RouteConfig;
