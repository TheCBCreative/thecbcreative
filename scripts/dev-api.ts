import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';

// Dev only: runs api/contact.mjs inside the Vite dev server, so the contact form can be tested end to end
// with `npm run dev` (it sends a real email with the keys in .env.local). On Vercel the same file runs as a function.
export function devContactApi(): Plugin {
  return {
    name: 'dev-contact-api',
    apply: 'serve',
    configureServer(server) {
      // The handler reads its keys from process.env, as it does on Vercel.
      const env = loadEnv(server.config.mode, server.config.root, '');
      for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

      server.middlewares.use('/api/contact', async (req: IncomingMessage, res: ServerResponse) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
        const request = new Request(`http://${req.headers.host}/api/contact`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: hasBody ? Buffer.concat(chunks) : undefined,
        });
        // Loaded through Vite so edits to the handler apply without a restart.
        const { default: handler } = await server.ssrLoadModule('/api/contact.mjs');
        const response: Response = await handler.fetch(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}
