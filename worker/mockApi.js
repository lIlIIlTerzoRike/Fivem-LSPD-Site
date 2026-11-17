export const DEMO_PIN = '1234';

// Demo: sessione PIN lunga (24 ore) per non dover reinserire il PIN spesso.
const CENSIMENTO_TTL_MS = 24 * 60 * 60 * 1000;
const CENSIMENTO_COOKIE_MAX_AGE = 24 * 60 * 60;
const APP_ORIGIN = 'https://lspdb.it';
const DISCORD_CLIENT_ID = '1335891472020668466'; // observed in the real flow

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-powered-by': 'Next.js',
      ...extraHeaders,
    },
  });
}

function redirect(location, cookies = []) {
  const headers = new Headers({ location });
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return new Response(null, { status: 302, headers });
}

function anonymousSession() {
  return {
    isLoggedIn: false,
    isPolice: false,
    id: -1,
    did: '',
    nome: '',
    username: '',
    avatar: '',
    grado: { id: -1, did: '', grado: '', grado_extended: '', categoria: '' },
    data_entrata: null,
    addestramento_completato: false,
  };
}

function demoOfficer() {
  return {
    isLoggedIn: true,
    isPolice: true,
    id: 1,
    did: DISCORD_CLIENT_ID,
    nome: 'Agente Demo',
    username: 'agente.demo',
    avatar: '',
    grado: {
      id: 1,
      did: DISCORD_CLIENT_ID,
      grado: 'Agente (demo)',
      grado_extended: 'Agente di Polizia (demo)',
      categoria: 'Pattuglia (demo)',
    },
    data_entrata: '2026-01-01',
    addestramento_completato: true,
  };
}

function demoCensusList() {
  return [
    { nome: 'Attività di prova 1 (demo)', titolare: 'Titolare di prova (demo)', stato: 'Demo' },
    { nome: 'Attività di prova 2 (demo)', titolare: 'Titolare di prova (demo)', stato: 'Demo' },
  ];
}

const AUTHORIZE_PAGE = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accesso APMS (demo)</title>
<style>
:root{color-scheme:dark}
body{font-family:system-ui,sans-serif;background:#18191c;color:#f2f3f5;display:grid;place-items:center;min-height:100vh;margin:0;padding:1.5rem}
.card{max-width:26rem;width:100%;background:#2b2d31;border-radius:.75rem;padding:2rem;text-align:center}
.crest{width:72px;height:72px;display:block;margin:0 auto .75rem}
h1{font-size:1.15rem;margin:0 0 1rem}
p{margin:.5rem 0;font-size:.9rem;color:#b5bac1;line-height:1.5}
code{background:#18191c;padding:.1rem .35rem;border-radius:.25rem;font-size:.85em;color:#f2f3f5}
.btn{display:block;margin-top:1.5rem;background:#5865f2;color:#fff;border:0;border-radius:.375rem;padding:.8rem 1.5rem;font-size:.95rem;font-weight:600;cursor:pointer;text-decoration:none}
.btn:hover{background:#4752c4}
.cancel{display:inline-block;margin-top:1rem;font-size:.85rem;color:#b5bac1;text-decoration:none}
.cancel:hover{text-decoration:underline}
</style></head>
<body><main class="card">
<img class="crest" src="/lspd-crest.webp" width="72" height="72" alt="APMS">
<h1>APMS vuole accedere al tuo account</h1>
<p>Scope richiesto: <code>identify</code></p>
<p>Client ID <code>${DISCORD_CLIENT_ID}</code></p>
<p>Redirect <code>${APP_ORIGIN}/api/oauth/login</code></p>
<p style="margin-top:1.25rem">Questa build usa un accesso demo locale. In produzione il flusso passa per discord.com/oauth2/authorize.</p>
<a class="btn" href="/api/oauth/login?code=demo">Autorizza come agente demo</a>
<a class="cancel" href="/">Annulla</a>
</main></body></html>`;

export async function handleMockApi(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const cookies = parseCookies(request.headers.get('cookie'));

  if (path === '/api/oauth/session' && method === 'GET') {
    return json(cookies['apms_session'] === 'demo' ? demoOfficer() : anonymousSession(), 200);
  }

  if (path === '/api/oauth/login') {
    if (url.searchParams.has('code')) {
      return redirect(new URL('/', url).toString(), ['apms_session=demo; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000']); // 30 giorni, come il login lato client
    }
    return new Response(AUTHORIZE_PAGE, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  if (path === '/api/oauth/logout') {
    return redirect(new URL('/', url).toString(), ['apms_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0']);
  }

  if (path === '/api/censimento' && method === 'GET') {
    const since = Number(cookies['censimento_since'] || 0);
    const valid = cookies['censimento_pin'] === 'verified' && since > 0 && Date.now() - since < CENSIMENTO_TTL_MS;
    if (!valid) return json({ message: 'Accesso scaduto: inserisci di nuovo il PIN' }, 401);
    return json({ ok: true, attivita: demoCensusList() }, 200);
  }

  if (path === '/api/censimento/verify' && method === 'POST') {
    let pin = '';
    try {
      pin = String((await request.clone().json()).pin || '');
    } catch {
      return json({ message: 'PIN non valido' }, 400);
    }
    if (!/^[0-9]{4}$|^[0-9]{6}$|^[0-9]{8}$/.test(pin)) return json({ message: 'PIN non valido' }, 400);
    if (pin !== DEMO_PIN) return json({ message: 'PIN non valido' }, 401);
    const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' });
    headers.append('set-cookie', `censimento_pin=verified; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CENSIMENTO_COOKIE_MAX_AGE}`);
    headers.append('set-cookie', `censimento_since=${Date.now()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CENSIMENTO_COOKIE_MAX_AGE}`);
    return new Response(JSON.stringify({ ok: true, attivita: demoCensusList() }), { status: 200, headers });
  }

  return null;
}
