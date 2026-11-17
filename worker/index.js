import { handleMockApi } from './mockApi.js';

const SPA_ROUTES = ['/', '/bandi', '/comunicati', '/bacheca-latitanti', '/censimento', '/login', '/area-riservata', '/area-riservata/ambecebus', '/area-riservata/applications', '/area-riservata/news', '/area-riservata/complaints', '/area-riservata/contraventions', '/area-riservata/wanted', '/area-riservata/officers', '/area-riservata/robberies', '/regolamento-fdo', '/codici-radio', '/procedure', '/area-riservata/patrols'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && SPA_ROUTES.includes(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL('/', url), request));
    }

    const api = await handleMockApi(request);
    if (api) return api;

    return env.ASSETS.fetch(request);
  },
};
