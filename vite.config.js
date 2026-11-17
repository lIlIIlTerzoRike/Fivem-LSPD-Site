import { defineConfig } from 'vite';
import { handleMockApi } from './worker/mockApi.js';

// The Sites worker owns the same endpoints in production. This middleware gives
// `vite dev` the same API so login and the PIN gate work locally.
function mockApiPlugin() {
  async function toFetchRequest(req, origin) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else headers.set(key, value);
    }
    const init = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      if (chunks.length) init.body = Buffer.concat(chunks);
    }
    return new Request(new URL(req.url, origin), init);
  }

  async function send(res, response) {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key === 'set-cookie') return;
      res.setHeader(key, value);
    });
    const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    if (cookies.length) res.setHeader('set-cookie', cookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  }

  return {
    name: 'apms-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '/').split('?')[0];
        if (!path.startsWith('/api/')) return next();
        try {
          const origin = `http://${req.headers.host || '127.0.0.1'}`;
          const response = await handleMockApi(await toFetchRequest(req, origin));
          if (!response) {
            await send(res, new Response(JSON.stringify({ message: 'Not found' }), {
              status: 404,
              headers: { 'content-type': 'application/json; charset=utf-8' },
            }));
            return;
          }
          await send(res, response);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [mockApiPlugin()],
  server: { host: true },
});
