// Sessione lato client per l'area riservata APMS.
// Niente backend: le credenziali demo sono verificate nel browser e la
// sessione è persistita in localStorage con scadenza. Da sostituire con
// un vero OAuth quando sarà disponibile (vedi README).
const KEY = 'apms_session_v1';
// Demo: sessione lunga (30 giorni) per non dover rifare il login spesso.
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DEMO_USER = {
  username: 'agente.demo',
  password: 'demo123',
  nome: 'Agente Demo',
  grado: 'Agente (demo)',
};

// Mini store locale per gli account AMBECEBUS. Le password demo sono in
// chiaro solo in questa build locale: in produzione vanno in un backend.
const ACCOUNTS_KEY = 'apms_ambecebus_accounts_v1';

function seedAccounts() {
  return [
    { username: 'admin', password: 'admin123', nome: 'Admin', role: 'Admin', level: 'federal', grado: 'Admin', note: 'Può cedere tutto, modificare i permessi e creare account' },
    { username: 'governatore', password: 'demo123', nome: 'Governatore', role: 'Governatore', level: 'federal', grado: 'Governatore', note: 'Vede tutto tra le leggi a livello federale' },
    { username: 'fib.demo', password: 'demo123', nome: 'Agente FIB', role: 'FIB', level: 'federal', grado: 'Agente FIB', note: 'Vede tutto anche a livello federale' },
    { username: 'agente.demo', password: 'demo123', nome: 'Agente Demo', role: 'FDO', level: 'standard', grado: 'Agente (demo)', note: 'Sezione FDO' },
    { username: 'cid.demo', password: 'demo123', nome: 'Investigatore CID', role: 'CID', level: 'standard', grado: 'Investigatore CID', note: 'Sezione CID' },
    { username: 'cia.demo', password: 'demo123', nome: 'Agente CIA', role: 'CIA', level: 'standard', grado: 'Agente CIA', note: 'Sezione CIA' },
    { username: 'funzionario.demo', password: 'demo123', nome: 'Funzionario', role: 'Funzionari', level: 'standard', grado: 'Funzionario', note: 'Sezione Funzionari' },
    { username: 'recluta.demo', password: 'demo123', nome: 'Recluta', role: 'FDO', level: 'standard', grado: 'Recluta', note: 'Grado più basso' },
  ];
}

export function listAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return seedAccounts();
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length ? list : seedAccounts();
  } catch {
    return seedAccounts();
  }
}

export function saveAccounts(accounts) {
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch {}
}

export function createAccount(account) {
  const accounts = listAccounts();
  const username = String(account.username || '').trim();
  if (!username) return null;
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) return null;
  const created = { ...account, username };
  accounts.push(created);
  saveAccounts(accounts);
  return created;
}

export function updateAccount(username, fields) {
  const accounts = listAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) return false;
  Object.assign(account, fields);
  saveAccounts(accounts);
  return true;
}

export function findAccount(username) {
  return listAccounts().find((a) => a.username === username) || null;
}

export function isAdmin(user) {
  return !!user && user.role === 'Admin';
}

export function isFederal(user) {
  return !!user && (user.role === 'FIB' || user.role === 'Governatore' || user.role === 'Admin');
}

export function canSeeAll(user) {
  return !!(user && (isAdmin(user) || isFederal(user)));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.expires < Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s.user;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function login(username, password) {
  const account = listAccounts().find(
    (a) => a.username === String(username || '').trim() && a.password === String(password || ''),
  );
  if (account) {
    const user = {
      username: account.username,
      nome: account.nome || account.username,
      grado: account.grado || account.role,
      role: account.role,
      level: account.level,
    };
    const session = { user, expires: Date.now() + TTL_MS };
    try { localStorage.setItem(KEY, JSON.stringify(session)); } catch {}
    return user;
  }
  return null;
}

export function logout() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function demoCredentials() {
  return { username: DEMO_USER.username, password: DEMO_USER.password };
}

export function ambecebusCredentials() {
  return [
    { username: 'admin', password: 'admin123', role: 'Admin' },
    { username: 'governatore', password: 'demo123', role: 'Governatore' },
    { username: 'fib.demo', password: 'demo123', role: 'FIB' },
    { username: 'agente.demo', password: 'demo123', role: 'FDO' },
    { username: 'cid.demo', password: 'demo123', role: 'CID' },
    { username: 'cia.demo', password: 'demo123', role: 'CIA' },
    { username: 'funzionario.demo', password: 'demo123', role: 'Funzionari' },
    { username: 'recluta.demo', password: 'demo123', role: 'FDO (recluta)' },
  ];
}
