import type { Config } from '@react-router/dev/config';
import { SERVICES } from './app/data/services';

export default {
  ssr: false,
  prerender: ['/', '/contact', ...SERVICES.map((service) => `/services/${service.slug}`)],
} satisfies Config;
