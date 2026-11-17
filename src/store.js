// Store CRUD persistito in localStorage, mappato dallo schema lspd_panel.sql.
// Sezioni: news, complaints, contraventions, fines, wanted, officers.
// Campi identici alle colonne PHP originali, senza riusare codice o credenziali.
const KEY = 'apms_store_v1';

const SECTIONS = ['news', 'complaints', 'contraventions', 'fines', 'wanted', 'officers', 'robberies', 'patrols', 'employees', 'applications', 'ambecebusAccounts', 'ambecebusRoleLabels', 'ambecebusReprimands', 'ambecebusDocuments', 'ambecebusCirculars'];

// --- AMBECEBUS: seed con accounts demo per provare ogni ruolo ---
// Demo finsica: ogni account è un login username/password con un ruolo e
// un livello (FIB/Governatore). I dati vivono in localStorage.
function seedAmbecebus() {
  return {
    ambecebusAccounts: [
      { id: 'seed-admin', username: 'admin', password: 'admin123', nome: 'Admin', role: 'Admin', level: 'federal', note: 'Può cedere tutto, modificare i permessi e creare account' },
      { id: 'seed-governatore', username: 'governatore', password: 'demo123', nome: 'Governatore', role: 'Governatore', level: 'federal', note: 'Vede tutto tra le leggi a livello federale' },
      { id: 'seed-fib', username: 'fib.demo', password: 'demo123', nome: 'Agente FIB', role: 'FIB', level: 'federal', note: 'Vede tutto anche a livello federale' },
      { id: 'seed-fdo', username: 'agente.demo', password: 'demo123', nome: 'Agente Demo', role: 'FDO', level: 'standard', note: 'Sezione FDO' },
      { id: 'seed-cid', username: 'cid.demo', password: 'demo123', nome: 'Investigatore CID', role: 'CID', level: 'standard', note: 'Sezione CID' },
      { id: 'seed-cia', username: 'cia.demo', password: 'demo123', nome: 'Agente CIA', role: 'CIA', level: 'standard', note: 'Sezione CIA' },
      { id: 'seed-funzionario', username: 'funzionario.demo', password: 'demo123', nome: 'Funzionario', role: 'Funzionari', level: 'standard', note: 'Sezione Funzionari' },
      { id: 'seed-recluta', username: 'recluta.demo', password: 'demo123', nome: 'Recluta', role: 'FDO', level: 'standard', note: 'Grado più basso' },
    ],
    ambecebusRoleLabels: [
      { id: 'seed-role-fdo', role: 'FDO', label: 'FDO' },
      { id: 'seed-role-governo', role: 'Governo', label: 'Governo' },
      { id: 'seed-role-cid', role: 'CID', label: 'CID' },
      { id: 'seed-role-fiba', role: 'FIBA', label: 'FIBA' },
      { id: 'seed-role-cia', role: 'CIA', label: 'CIA' },
      { id: 'seed-role-funzionari', role: 'Funzionari', label: 'Funzionari' },
      { id: 'seed-role-governatore', role: 'Governatore', label: 'Governatore' },
      { id: 'seed-role-fib', role: 'FIB', label: 'FIB' },
      { id: 'seed-role-admin', role: 'Admin', label: 'Admin' },
    ],
    ambecebusReprimands: [],
    ambecebusDocuments: [],
    ambecebusCirculars: [],
  };
}

// Numeri ufficiali dal Regolamento VYCE RP sezione 9.1 (rapine).
function seedRobberies() {
  return [
    { id: 'seed-negozietto', tipo: 'Negozietto', criminali: '2', polizia: '2', armi: 'Pistole', ostaggi: 'NPC', caschi: 'No', esterno: 'No' },
    { id: 'seed-fleeca', tipo: 'Fleeca Bank', criminali: '3/4', polizia: '4', armi: 'Pistole, SMG', ostaggi: '1', caschi: 'No', esterno: 'No' },
    { id: 'seed-gioielleria', tipo: 'Gioielleria', criminali: '3/4', polizia: '4', armi: 'Pistole, SMG', ostaggi: '1', caschi: 'Sì', esterno: 'No' },
    { id: 'seed-blaine', tipo: 'Blaine Bank', criminali: '4/5', polizia: '6', armi: 'SMG', ostaggi: '1', caschi: 'Sì', esterno: 'Sì' },
    { id: 'seed-pacific', tipo: 'Pacific Bank', criminali: '8', polizia: '10', armi: 'AR', ostaggi: '3', caschi: 'Sì', esterno: 'Sì' },
  ];
}

// Pattuglie del Manuale Interno (riepilogo operativo, testi rielaborati).
function seedPatrols() {
  return [
    { id: 'seed-mary', nome: 'Mary', composizione: 'Due motociclette stradali', requisito: 'Almeno 3 ADAM in atteggiamento; almeno un agente scelto in su; reclute escluse' },
    { id: 'seed-lincoln', nome: 'Lincoln', composizione: 'Un solo operatore', requisito: 'Sottoufficiali o superiori; oppure agente coordinatore con autorizzazione' },
    { id: 'seed-stradale', nome: 'Stradale (HSU)', composizione: 'Pattuglia ad alta velocità', requisito: 'Brevetto posseduto; numero massimo di stradali alla volta' },
    { id: 'seed-eagle', nome: 'Eagle', composizione: 'Unità aerea', requisito: 'Pilota A.S.U. con brevetto di volo; autorizzazione di ufficiale o sottoufficiale in urgenza' },
  ];
}

function seed() {
  return { news: [], complaints: [], contraventions: [], fines: [], wanted: [], officers: [], robberies: seedRobberies(), patrols: seedPatrols(), employees: [], applications: [], ...seedAmbecebus() };
}

function readStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    const out = seed();
    for (const s of SECTIONS) if (Array.isArray(parsed[s])) out[s] = parsed[s];
    return out;
  } catch {
    return seed();
  }
}

function writeStore(store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function listItems(section) {
  if (!SECTIONS.includes(section)) return [];
  return readStore()[section].slice().reverse();
}

export function createItem(section, fields) {
  if (!SECTIONS.includes(section)) return null;
  const store = readStore();
  const item = { id: uid(), createdAt: new Date().toISOString(), ...fields };
  store[section].push(item);
  writeStore(store);
  return item;
}

export function updateItem(section, id, fields) {
  if (!SECTIONS.includes(section)) return false;
  const store = readStore();
  const item = store[section].find((i) => i.id === id);
  if (!item) return false;
  Object.assign(item, fields);
  writeStore(store);
  return true;
}

export function deleteItem(section, id) {
  if (!SECTIONS.includes(section)) return false;
  const store = readStore();
  const next = store[section].filter((i) => i.id !== id);
  if (next.length === store[section].length) return false;
  store[section] = next;
  writeStore(store);
  return true;
}

export function countItems(section) {
  if (!SECTIONS.includes(section)) return 0;
  return readStore()[section].length;
}
