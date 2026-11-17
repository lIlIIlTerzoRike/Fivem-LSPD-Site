import './style.css';
import { icon } from './icons.js';
import { getSession, login as sessionLogin, logout as sessionLogout, demoCredentials, ambecebusCredentials, listAccounts, createAccount, updateAccount, findAccount, isAdmin, isFederal, canSeeAll } from './session.js';
import { listItems, createItem, updateItem, deleteItem, countItems } from './store.js';

const $ = (s) => document.querySelector(s);
const view = () => $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const crest = (size, alt = '') => `<img src="/lspd-crest.webp" width="${size}" height="${size}" alt="${alt}" decoding="async" ${size >= 96 ? 'fetchpriority="high"' : ''} />`;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function toast(msg, isErr = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (isErr ? ' err' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

const PRIVATE_PREFIX = '/area-riservata';
const routes = {
  '/': { title: 'APMS - Los Santos Police Department', crumb: 'Dashboard' },
  '/bandi': { title: 'Portale Bandi · Los Santos Police Department', crumb: 'Portale Bandi' },
  '/comunicati': { title: 'Comunicati stampa · Los Santos Police Department', crumb: 'Comunicati Stampa' },
  '/bacheca-latitanti': { title: 'Latitanti e Ricercati · Los Santos Police Department', crumb: 'Latitanti e Ricercati' },
  '/censimento': { title: 'Censimento Attività · Los Santos Police Department', crumb: 'Censimento' },
  '/regolamento-fdo': { title: 'Regolamento Forze dell’Ordine · APMS', crumb: 'Regolamento FDO' },
  '/codici-radio': { title: 'Codici Radio · APMS', crumb: 'Codici Radio' },
  '/procedure': { title: 'Procedure operative · APMS', crumb: 'Procedure' },
  '/login': { title: 'Accesso · APMS', crumb: 'Accesso' },
  '/area-riservata': { title: 'Area riservata · APMS', crumb: 'Panoramica' },
  '/area-riservata/news': { title: 'News · Area riservata APMS', crumb: 'News' },
  '/area-riservata/complaints': { title: 'Denunce · Area riservata APMS', crumb: 'Denunce' },
  '/area-riservata/contraventions': { title: 'Multe · Area riservata APMS', crumb: 'Multe' },
  '/area-riservata/wanted': { title: 'Avvisi di ricerca · Area riservata APMS', crumb: 'Avvisi di ricerca' },
  '/area-riservata/officers': { title: 'Ufficiali · Area riservata APMS', crumb: 'Ufficiali' },
  '/area-riservata/robberies': { title: 'Rapine · Area riservata APMS', crumb: 'Rapine' },
  '/area-riservata/patrols': { title: 'Pattuglie · Area riservata APMS', crumb: 'Pattuglie' },
  '/area-riservata/applications': { title: 'Candidature · Area riservata APMS', crumb: 'Candidature' },
  '/area-riservata/ambecebus': { title: 'Ambecebus · Area riservata APMS', crumb: 'Ambecebus' },
};
const pages = {
  '/': dashboardPage,
  '/bandi': bandiPage,
  '/comunicati': comunicatiPage,
  '/bacheca-latitanti': latitantiPage,
  '/censimento': censimentoPage,
  '/regolamento-fdo': regolamentoFdoPage,
  '/codici-radio': codiciRadioPage,
  '/procedure': procedurePage,
  '/login': loginPage,
  '/area-riservata': overviewPage,
  '/area-riservata/news': () => crudPage('news'),
  '/area-riservata/complaints': () => crudPage('complaints'),
  '/area-riservata/contraventions': () => crudPage('contraventions'),
  '/area-riservata/wanted': () => crudPage('wanted'),
  '/area-riservata/officers': () => crudPage('officers'),
  '/area-riservata/robberies': () => crudPage('robberies'),
  '/area-riservata/patrols': () => crudPage('patrols'),
  '/area-riservata/applications': () => crudPage('applications'),
  '/area-riservata/ambecebus': ambecebusPage,
};
const isPrivate = (path) => path === PRIVATE_PREFIX || path.startsWith(PRIVATE_PREFIX + '/');

function navigate(path) {
  history.pushState({}, '', path);
  render(path);
}

function setCrumb(path) {
  const el = $('#crumb-title');
  const known = routes[path];
  if (known && path === '/') {
    el.textContent = 'Dashboard';
    el.className = 'crumb-title';
  } else if (known) {
    el.textContent = known.crumb;
    el.className = 'crumb-title page';
  } else {
    el.textContent = cap(path.split('/').filter(Boolean).pop() || 'Dashboard');
    el.className = 'crumb-title page';
  }
}

function render(path = location.pathname) {
  if (isPrivate(path) && !getSession()) {
    history.replaceState({}, '', '/login');
    path = '/login';
  }
  if (path === '/login' && getSession()) {
    history.replaceState({}, '', PRIVATE_PREFIX);
    path = PRIVATE_PREFIX;
  }
  const known = routes[path];
  document.title = known ? known.title : 'Pagina non trovata · APMS';
  setCrumb(path);
  const fn = pages[path] || notFoundPage;
  view().innerHTML = `<div class="view-inner">${fn(path)}</div>`;
  document.querySelectorAll('.side-item[data-link]').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
  closeMobileSidebar();
  bindPage(path);
}

function dashboardPage() {
  const cards = [
    { href: '/comunicati', icon: 'newspaper', title: 'Comunicati Stampa', desc: 'Ultime informazioni ufficiali per la cittadinanza.' },
    { href: '/bacheca-latitanti', icon: 'user-search', title: 'Latitanti e Ricercati', desc: 'Elenco pubblico delle persone ricercate dalle autorità.' },
    { href: '/bandi', icon: 'file-pen', title: 'Portale Bandi', desc: 'Presenta una candidatura per entrare nel dipartimento.' },
  ];
  const tickerWords = ['Los Santos Police Department', 'To Protect and Serve', 'Advanced Police Management System', 'Los Santos'];
  const ticker = tickerWords.map((w) => `<span>${esc(w)}</span>`).join('<i>·</i>');
  return `
  <div class="hero">
    <div class="ambient" aria-hidden="true"><span class="ambient-glow g1"></span><span class="ambient-glow g2"></span></div>
    <div class="hero-mark">${crest(128, 'APMS')}</div>
    <h1>Advanced Police Management System</h1>
    <p class="sub">Los Santos Police Department</p>
    <p class="lead">APMS è il gestionale ufficiale del corpo di polizia del Los Santos Police Department. L'accesso al software è riservato ai facenti parte del dipartimento e agli enti governativi annessi.</p>
    <div class="ticker" aria-hidden="true"><div class="ticker-track">${ticker}<i>·</i>${ticker}<i>·</i></div></div>
    <div class="cards">
      ${cards.map((c) => `<article class="card"><a href="${c.href}" data-link><div class="card-head">${icon(c.icon, 16)}<div class="card-title">${c.title}</div></div><p>${c.desc}</p></a></article>`).join('')}
    </div>
  </div>`;
}

function comunicatiPage() {
  const items = listItems('news');
  const body = items.length
    ? `<div class="news-list">${items.map((n) => `<article class="news-item"><h2>${esc(n.title)}</h2><p>${esc(n.description)}</p><p class="news-date">${esc(new Date(n.createdAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</p></article>`).join('')}</div>`
    : `<div class="empty">
      <div class="empty-icon">${icon('newspaper', 22)}</div>
      <p class="empty-title">Nessun comunicato pubblicato</p>
      <p class="empty-desc">Al momento non ci sono comunicazioni ufficiali. Torna a consultare questa pagina per gli aggiornamenti del dipartimento.</p>
    </div>`;
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Comunicati Stampa</h1>
    <p>Comunicazioni ufficiali rivolte alla cittadinanza di Los Santos, a cura dell'Alto Comando del dipartimento.</p>
  </div>
  <div class="page-body">
    ${body}
  </div>`;
}

function latitantiPage() {
  const items = listItems('wanted');
  const body = items.length
    ? `<table class="cens-table"><thead><tr><th>Persona ricercata</th><th>Ufficiale</th><th>Data</th></tr></thead><tbody>${items.map((w) => `<tr><td>${esc(w.wanted_person)}</td><td>${esc(w.officer)}</td><td>${esc(w.date)}</td></tr>`).join('')}</tbody></table>`
    : `<div class="empty">
      <div class="empty-icon">${icon('user-search', 22)}</div>
      <p class="empty-title">Nessun mandato attivo</p>
      <p class="empty-desc">Al momento non ci sono latitanti o ricercati segnalati alla cittadinanza.</p>
    </div>`;
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Latitanti e Ricercati</h1>
    <p>Se riconosci una di queste persone non intervenire e non avvicinarti: contatta immediatamente il dipartimento.</p>
  </div>
  <div class="page-body">
    ${body}
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

function censimentoPage() {
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department · Reparto Amministrativo</p>
    <h1>Censimento Attività</h1>
    <p>Comunica al dipartimento chi possiede, dirige e lavora nella tua attivita'.</p>
  </div>
  <div class="page-body">
    <div id="censimento-root">
      <form class="pin-card" id="pin-form" novalidate>
        <div class="pin-badge">${icon('key-round', 22)}</div>
        <h2>Inserisci il PIN</h2>
        <p class="pin-desc">Il codice di 4, 6 o 8 cifre che il reparto Amministrativo ha consegnato alla tua attivita'.</p>
        <div class="pin-form">
          <div class="pin-boxes" id="pin-boxes">
            ${[0, 1, 2, 3].map((i) => `<input class="pin-box" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="1" aria-label="Cifra ${i + 1} del PIN" data-i="${i}" />`).join('')}
          </div>
          <p class="pin-error" id="pin-error" role="alert"></p>
          <button class="btn" id="pin-btn" type="submit" disabled>Accedi</button>
        </div>
      </form>
      <p class="pin-hint">Ambiente demo. PIN di prova: <code>1234</code></p>
    </div>
  </div>`;
}

function regolamentoFdoPage() {
  const block = (title, items) => `<section class="reg-block"><h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></section>`;
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Regolamento Forze dell'Ordine</h1>
    <p>Norme operative ufficiali per il personale del dipartimento. Fonte: Regolamento VYCE RP, sezioni 4 – 4.2, 7, 7.3, 9.1.</p>
  </div>
  <div class="page-body reg-body">
    ${block('Regole di ingaggio', [
      'Le forze dell’ordine non possono aprire il fuoco per prime, salvo in caso di minaccia reale e comprovata verso sé stessi o terzi.',
      'È vietato svolgere attività illegali o corruzione durante o fuori servizio, salvo autorizzazione dello Staff.',
      'La corruzione non autorizzata può comportare processo per alto tradimento e PermaJail.',
      'La manovra PIT è consentita solo dopo aver effettuato 3 avvisi di ALT.',
      'È vietato utilizzare armi illegali.',
      'Dopo l’arresto di oltre 5 persone, è obbligatorio organizzare il trasporto in carcere.',
      'La cancellazione della fedina penale è concessa esclusivamente dalla Procura, secondo le procedure del Governo.',
      'Procura, Giudici, Alto Comando e CID non possono essere corrotti.',
      'Per ogni agente rapito, le FDO possono far intervenire 2 agenti aggiuntivi nell’azione.',
      'Le Forze dell’Ordine non possono partecipare a un’azione Freeroam se due fazioni criminali hanno già dichiarato “Azione Finita”.',
      'Per rapire una FDO è necessario aprire un ticket di convalida con 5 valide motivazioni RP, salvo disposizioni del Cartello legate alla Lore.',
      'In caso di sconfitta durante l’assalto alla Centrale, è previsto il PermaJail.',
    ])}
    ${block('Assalto al convoglio', [
      'Dopo una vittoria dell’LSPD e l’arresto dei criminali, non è possibile iniziare nuove azioni contro gli agenti fino alla partenza del convoglio.',
      'L’assalto è una nuova azione freeroam: massimo 8 criminali e 10 agenti, con sole pistole e senza casco.',
      'I detenuti non possono partecipare né interferire; potranno tentare la fuga solo dopo la fine dell’azione.',
      'L’assalto deve avere una valida motivazione RP; motivazioni futili comportano l’annullamento dell’azione.',
      'È vietato recuperare durante il convoglio o l’assalto gli oggetti precedentemente sequestrati.',
      'Il convoglio può essere assaltato una sola volta e solo dopo aver percorso almeno 500 metri dalla partenza.',
    ])}
    ${block('Permajail', [
      'Il permajail equivale all’ergastolo, quindi al permadeath del personaggio.',
      'L’associazione a stampo mafioso può essere motivo per avviare una procedura di permajail.',
      'Per applicare il permajail è obbligatorio svolgere un processo; può essere applicato anche a un fazionato legale corrotto, se scoperto in RP.',
    ])}
    ${block('Posti di blocco (PDB)', [
      'Ogni posto di blocco deve essere organizzato esclusivamente per una valida motivazione RP e deve essere chiaramente visibile e adeguatamente segnalato.',
      'È vietato bloccare completamente una strada senza garantire agli altri giocatori la possibilità di interagire.',
      'Qualsiasi controllo, perquisizione o fermo deve essere giustificato da una valida motivazione RP.',
      'È severamente vietato aprire il fuoco senza una valida motivazione RP.',
      'Un PDB può trasformarsi in una situazione di Freeroam: in tal caso vale il regolamento Freeroam.',
    ])}
    ${block('Numeri rapine', [
      'Negozietto: 2 criminali · 2 polizia · pistole · NPC · no caschi · no esterno.',
      'Fleeca Bank: 3/4 criminali · 4 polizia · pistole, SMG · 1 ostaggio · no caschi · no esterno.',
      'Gioielleria: 3/4 criminali · 4 polizia · pistole, SMG · 1 ostaggio · caschi sì · no esterno.',
      'Blaine Bank: 4/5 criminali · 6 polizia · SMG · 1 ostaggio · caschi sì · esterno sì.',
      'Pacific Bank: 8 criminali · 10 polizia · AR · 3 ostaggi · caschi sì · esterno sì.',
      'Durata massima di una rapina: 40 minuti. Riscatto massimo $10.000 per ostaggio. Trattative minime 10 minuti.',
    ])}
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

const TEN_CODES = [
  ['10-0', 'Crash'], ['10-3', 'Silenzio radio'], ['10-4', 'Ricevuto'], ['10-5', 'Ripetere'],
  ['10-6', 'Agente in silenzio radio'], ['10-7', 'Fuori servizio'], ['10-8', 'In servizio'],
  ['10-9', 'Fuori servizio (in città)'], ['10-10', 'Conflitto a fuoco (colpi diretti agli agenti)'],
  ['10-11', 'Shotfire (colpi in lontananza)'], ['10-15', 'Furto di veicolo'], ['10-18', 'Rientro in centrale'],
  ['10-20', 'Posizione'], ['10-26', 'Soggetto in custodia'], ['10-29', 'Pattuglia danneggiata'],
  ['10-35', 'Furto in casa'], ['10-55', 'Fermo stradale (traffic-stop)'], ['10-59', 'Controllo di sicurezza presso un locale/azienda'],
  ['10-60', 'Richiesta di supporto'], ['10-79', 'Richiesta di unità mediche'],
  ['10-80', 'Inseguimento in corso'], ['10-99', 'Rapina in corso'], ['10-100', 'Agente a terra'],
  ['653M', 'Utilizzo di dispositivi elettronici'],
];

function codiciRadioPage() {
  const block = (title, html) => `<section class="reg-block"><h2>${esc(title)}</h2>${html}</section>`;
  const tenRows = TEN_CODES.map(([c, d]) => `<tr><td>${esc(c)}</td><td>${esc(d)}</td></tr>`).join('');
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Codici Radio</h1>
    <p>Tabella rapida dei codici radio, status e car code in uso dal dipartimento.</p>
  </div>
  <div class="page-body reg-body">
    ${block('Ten Code', `<table class="cens-table"><thead><tr><th>Codice</th><th>Significato</th></tr></thead><tbody>${tenRows}</tbody></table>`)}
    ${block('Status Code', `<ul>
      <li><strong>Status 1</strong> — pattuglia operativa.</li>
      <li><strong>Status 2</strong> — pattuglia impegnata in un'operazione.</li>
      <li><strong>Status 3</strong> — pattuglia in pausa pranzo / rifornimento.</li>
    </ul>`)}
    ${block('Car Code', `<ul>
      <li><strong>Codice 0</strong> — situazione critica, attacco a enti governativi, federali o di Stato: tutti gli agenti in servizio convergono in Codice 3.</li>
      <li><strong>Codice 1</strong> — situazione normale: si raggiunge il luogo senza lampeggianti e sirene, rispettando i limiti.</li>
      <li><strong>Codice 2</strong> — urgenza che potrebbe evolvere in Codice 3: lampeggianti sì, sirene no.</li>
      <li><strong>Codice 3</strong> — emergenza con possibili vite a rischio: lampeggianti e sirene.</li>
      <li><strong>Codice 4</strong> — emergenza terminata: si procede con l'investigazione della scena del crimine.</li>
    </ul>`)}
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

function procedurePage() {
  const block = (title, items) => `<section class="reg-block"><h2>${esc(title)}</h2><ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol></section>`;
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Procedure Operative</h1>
    <p>Riepilogo operativo delle procedure del dipartimento, rielaborato dal Manuale Interno (sezioni 0–8). Le modifiche in vigore restano quelle pubblicate dall'Alto Comando.</p>
  </div>
  <div class="page-body reg-body">
    ${block('Requisiti del servizio', [
      'Divise obbligatorie come da armadietto per il grado; divise diverse o incomplete comportano allontanamento. Eccezione solo per i gradi più alti, con abbigliamento consono.',
      'Mai aprire il fuoco per primi se il sospettato è disarmato; vietati armi e accessori fuori dotazione, pena l’allontanamento.',
      'In servizio: comportamento esemplare, codice stradale rispettato in pattugliamento, niente fumo né alcol, bodycam attiva per tutta la durata.',
      'L’arma si estrae solo in presenza di minaccia reale o per un addestramento specifico; la recidiva comporta richiami, sospensione o licenziamento.',
      'Servono almeno 5 ore di servizio settimanali per restare nel dipartimento.',
      'Il rapporto recluta è obbligatorio dopo la prima uscita in pattuglia di almeno 30 minuti; facoltativo sotto i 30 minuti.',
    ])}
    ${block('Miranda Warning', [
      'Il soggetto viene informato di essere in arresto o in stato di fermo, con i suoi diritti spiegati in forma chiara.',
      'Ha diritto al silenzio: ciò che dichiara potrà essere usato contro di lui.',
      'Ha diritto a un avvocato; se non può permettersene uno, gliene viene assegnato uno d’ufficio.',
      'La lettura può avvenire fino a un massimo di due volte prima dell’arrivo in centrale e va pronunciata al massimo tre volte.',
    ])}
    ${block('Stato di arresto', [
      'Si dichiara lo stato di arresto in caso di flagranza o quando previsto dal codice penale; in caso di perquisizione del fermato di sesso opposto si segue la relativa procedura.',
      'Manette applicate solo alla consegna; mai prima della dichiarazione di arresto.',
      'Confisca temporanea di armi, oggetti contundenti, telefoni e radio; sequestro permanente degli oggetti usati per il reato.',
      'Bodycam attiva durante la perquisizione; il materiale è parte del procedimento.',
      'Controllo del telefono solo con autorizzazione di un sottoufficiale o ufficiale, con ticket alla Procura.',
      'Se non deve essere trattenuto: smanettamento, restituzione temporanea dei beni sequestrati e segnalazione al gestore del rapporto per la pena, con invio in carcere.',
    ])}
    ${block('Stato di fermo', [
      'Durata massima 12 ore; 24 ore solo con autorizzazione dei capidipartmento; niente zona celle, solo sala interrogatori.',
      'Dichiarazioni rese prima della lettura del Miranda sono nulle ai fini processuali.',
      'Perquisizione solo con il consenso del fermato; in caso di rifiuto si richiede un mandato alla Procura.',
    ])}
    ${block('10.80 — Inseguimento', [
      'Traffic-stop con fuga: accensione di lampeggianti e sirene, posizione comunicata in radio con formato pattuglia–posizione–modello.',
      'Manovre PIT solo se autorizzate dal coordinatore delle pattuglie; mai in città salvo casi eccezionali e dopo 5 minuti di inseguimento.',
      'Blocco a box da quattro lati solo a veicolo fermo; intimazione a scendere con mani alzate.',
      'Arresto per mancato alt e chiusura dell’inseguimento via radio.',
    ])}
    ${block('10.11 — Shotfire', [
      'Al segnale di colpi in lontananza: comunicazione radio, perimetro della zona e individuazione dei possibili tiratori.',
      'Attesa coordinatore per eventuale rinforzo; se la scena è tranquilla, fermo dei soggetti per domande e ritorno in status 1.',
      'Se scoppia un 10-10: segnalazione al coordinatore e applicazione della procedura conflitto a fuoco.',
    ])}
    ${block('10.10 — Conflitto a fuoco', [
      'Si configura quando gli agenti sono coinvolti in uno scontro diretto: la comunicazione radio segue il formato pattuglia, posizione (panic button), numero di pattuglie e soggetti, tipologia di armi.',
      'Responsabilità e gestione della tattica (TAC) al SWAT di grado più alto, o alla gerarchia in assenza di SWAT.',
      'Risposta al fuoco proteggendo i civili; zona interdetta comunicata con annunci LSPD; EMS chiamata solo dopo aver neutralizzato i soggetti.',
      'Doppi farmaci e procedure sanitarie completate: arresto dichiarato. Terzi coinvolti nella sparatoria in stato di fermo.',
    ])}
    ${block('10.99 — Rapina: intervento e contrattazione', [
      'Solo il coordinatore pattuglie chiama le unità; se assente, l’ADAM più vicina. Uscita con equipaggiamento regolamentare e GPS sull’icona giusta.',
      'Perimetro, zona interdetta e sicurezza dell’area prima di ogni contatto.',
      'La TAC è in mano al grado più alto o a un coordinatore; il contatto ai rapinatori è verbale e formale prima di qualsiasi trattativa.',
      'Priorità assoluta: salvare l’ostaggio; nessun comportamento “eroico” che metta a rischio gli agenti o i colleghi.',
      'Dopo il rilascio: controllo di salute e identità dell’ostaggio; il contrattatore si unisce all’inseguimento solo a procedura conclusa.',
    ])}
    ${block('10.99 — Ingaggio e comportamento agenti', [
      'Fuoco consentito solo se: i rapinatori sparano, feriscono o uccidono l’ostaggio, la trattativa è stanca senza punti di incontro, i rapinatori sono distratti, oppure sono in fuga senza ostaggio (solo alle ruote, da tiratore scelto appostato prima della fuga).',
      'Mai contrattare davanti all’ingresso né sistemare il veicolo a portata dell’entrata; mai tutti gli agenti da un solo lato.',
      'Mai togliere i volanti o le coperture; mai cedere a richieste che mettano a rischio la vita degli agenti. Prima gli agenti, poi l’ostaggio, poi il criminale.',
      'Rapina catturata senza bottino: sanzione doppia.',
    ])}
    ${block('10-55 — Fermo stradale (traffic-stop)', [
      'Segnalazione con sirene e lampeggianti, invito a fermarsi via megafono o voce.',
      'Pattuglia a 2 metri in diagonale di 45° verso l’esterno; il conducente fermato spegne il motore e resta a bordo, il solo conducente scende sul marciapiede.',
      'Controllo targa e generalità via radio; eventual multa o arresto.',
      'Senza documento cartaceo: il fermato sale sul proprio veicolo e viene portato in centrale per identificazione; senza patente, multa e sequestro del mezzo.',
      'Vetri oscurati legali: nessuna multa né sequestro.',
    ])}
    ${block('10-60 — Adam di supporto', [
      'Richiesta obbligatoria se a bordo ci sono soggetti mascherati, più di due soggetti o dispositivi elettronici (in quest’ultimo caso con codice 653M).',
      'Nella richiesta si indica il numero di pattuglie; le unità di supporto si posizionano dietro la pattuglia già sul posto, con il conducente pronto a intervenire.',
    ])}
    ${block('Sequestro, zona interdetta e felony stop', [
      'Sequestro del veicolo: rubato, richiesto dai reati penali/stradali o sotto pignoramento (il tablet avvisa sempre).',
      'Zona interdetta: alla commissione di un reato si notifica a tutti i presenti; la violazione ripetuta consente il fermo con la forza. Annuncio con il segnale previsto dal manuale.',
      'Felony stop: solo se conducente o passeggero è ricercato o pericoloso; pattuglia lontana, rinforzo, armi puntate durante la discesa, 3 passi indietro in ginocchio; solo dopo arresto, fermo e trasporto in centrale.',
    ])}
    ${block('Perquisizioni', [
      'Al desk: chiunque acceda oltre il desk di fronte alla corporale non subisce perquisizione, salvo fuori area desk, dove vale per tutti (inclusa la violazione di zona militare/federale).',
      'Arresto in flagranza: sequestro temporaneo di armi, contendenti e telefoni; gli oggetti del reato restano sequestrati definitivamente.',
      'Fermo: solo con consenso o con esito positivo del mandato alla Procura.',
      'Sesso opposto: con flagranza perquisisce chiunque; senza, l’interessato può usare un agente del proprio sesso o un sottoufficiale/ufficiale.',
      'Avvocato: consegna temporanea di armi e di accessi in centrale; restituzione a fine colloquio.',
      'Abitazione privata: solo con mandato del procuratore; nessuna irruzione in caso di rifugio in abitazione, solo attesa e richiesta mandato.',
      'Agenti: ufficiali, sottoufficiali e Alto Comando possono perquisire la truppa in ogni luogo; vietati silenziatori e armi civili in servizio.',
    ])}
    ${block('Richiesta avvocato', [
      'Avvocato d’ufficio: richiesta tramite giornalino alla centrale (LSPD civ. 592); avvocato privato solo dopo nome e cognome forniti.',
      'All’arrivo: controllo documento, verifica sull’albo, perquisizione di sicurezza, dispositivi elettronici spenti, accompagnamento alle celle con briefing rapido.',
      'Colloquio in privato; dopo, riaccompagnamento e restituzione degli oggetti. L’intervento dell’avvocato d’ufficio va registrato nella sezione dedicata.',
    ])}
    ${block('Rilascio documenti', [
      'Il viso d’ingresso vale 2 settimane e non sostituisce il documento; in centrale il cittadino si presenta col visto.',
      'Prima di foto e stampa: impronte, generalità, foto da tablet e rilascio da anagrafe.',
      'Non si rilascia a chi ha pittura facciale, petto nudo o volto coperto (eccezione: arresto/fermo senza documento, sempre rilasciato).',
    ])}
    ${block('Panic button e rapimento agente', [
      'Il panic button è un dispositivo che allerta la centrale operativa inviando in automatico la posizione GPS del veicolo, collegato al centro di monitoraggio tramite allarme silenzioso.',
      'In caso di tentativo esterno di accesso al database (hack via tablet), va inviato un panic button per segnalare la posizione ai colleghi e informare tramite comando che il sistema ha rilevato l’accesso esterno: il database viene bloccato.',
    ])}
    ${block('Discord e APMS', [
      'Su Discord si gestiscono ticket, richieste di fuori servizio e permessi, albo avvocati, segnalazioni (servizio avvocatura, cavigliera, soggetto trattenuto), registro ADAM per le reclute e canali dei reparti e dei gradi.',
      'Su APMS si compilano rapporto ZAR, rapporto recluta e richiesta processo; le funzioni si sbloccano per ruolo: reclute, gradi superiori e reparti operativi, reparti che rilasciano brevetti, cittadinanza (comunicati, latitanti, bandi).',
      'Per bug o azioni bloccate si apre un ticket dedicato sul server.',
    ])}
    ${block('Radio, tablet e icone', [
      'In servizio dal tablet; in assenza di coordinatore, la scorciatoia radio collega solo le ADAM, non ufficiali e centrale.',
      'Il pannello icone si apre con F7: in rapina si passa all’icona pistola, in pattuglia all’icona col numero dell’ADAM.',
      'Comunicazioni brevi e sintetiche, con annuncio della scorciatoia usata; il silenzio radio si chiede solo dalla centrale o da un superiore.',
    ])}
    ${block('Permessi e ferie', [
      'Il permesso va considerato concordato solo con la spunta verde di un sottoufficiale o superiore.',
      'Ferie: per assenze oltre 3 giorni fino a un massimo di un mese, preavviso di almeno 48 ore, reclute escluse, richiesta nella sezione permessi di Discord.',
      'Fuori servizio: per assenze di diverse ore nella giornata, preavviso di almeno 20 minuti; reclute solo tra le 00:30 e le 15:00; volontariato in ospedale fino a 1 ora al giorno.',
      'Fasce libere senza permesso: 13:30–14:30, 19:30–20:30, 03:00–8:30.',
      'Fuori servizio: niente grandi quantità di alcol né stupefacenti; si può arrestare con la stessa autorità del servizio; niente multe; arma d’ordinanza consentita solo in casi gravi, meglio richiamare il personale in servizio con GoPro attiva.',
    ])}
    ${block('Uso della forza', [
      'Non letale (resistenza a pubblico ufficiale): taser puntato, annuncio dell’uso, scarica solo senza avviso o movimento brusco, ammanettamento a terra e arresto.',
      'Letale: solo quando è in pericolo la vita di civili o agenti, come fuochi diretti, armi estratte improvvisamente, scaglie/body a corpo a corpo e ostaggi usati come scudo senza rischio aggiuntivo.',
      'La forza deve restare proporzionata alla minaccia effettiva: la forza eccessiva mette a rischio la fiducia della comunità nelle forze dell’ordine.',
    ])}
    ${block('Manovre di immobilizzazione', [
      'PIT: il volante colpisce uno dei due angoli anteriori dell’inseguita per farla sbandare; vietato in città, vietato a 200 km/h nella zona del garage centrale.',
      'Box: quattro vetture ai quattro lati per bloccare completamente la fuga.',
      'T: posizionarsi in orizzontale con il lato sinistro davanti all’inseguita per urtarne il lato sinistro e fermarla.',
      'Double T: come la T, ma con una seconda pattuglia a disegnare l’altra T sul lato destro.',
    ])}
    ${block('Matricola', [
      'Ogni agente ha una matricola univoca: all’alba del Comando, quando viene identificato in una questione, alla richiesta della struttura o da un cittadino, va sempre fornita.',
      'Nascondere o fornire una matricola falsa comporta procedimento penale e una sanzione più grave.',
    ])}
    ${block('Reati penali (sistema)', [
      'I reati si dividono per classe: le rapine (portavalori, minimarket, Blaine, Fleeca, gioielleria) e il furto con scasso seguono notifiche da script.',
      'Nel rapporto vanno elencati tutti i reati penali commessi; quelli civili vanno su una nota a parte.',
      'In una sparatoria il gestore fa partire il reato di tentativo di omicidio per tutti; gli altri reati li segnala l’agente dell’arresto.',
      'Con più reati si segnala come principale quello più grave (classe maggiore): è decisivo per gli estremi di un eventuale rinvio.',
      'La sanzione pecuniaria non può superare l’importo previsto per il reato più grave; la pena si calcola avvicinandola per eccesso al reato più grave.',
    ])}
    ${block('Compilazione del rapporto ordinario', [
      'Compila solo l’agente che ha gestito l’azione; un solo rapporto ordinario per tipo di azione.',
      'Titolo = reato principale; descrizione con data, ora e fatti; sezioni vittime, veicoli, sequestri e matricole armi (o “/”).',
      'Sezioni sospettati con i criminali arrestati, reati aggiuntivi dichiarati dall’agente e, se c’è un modello precompilato, il reato è già caricato.',
      'Ogni agente che ha arrestato comunica la pena; si applica la pena controllando che non superi il reato principale, poi si chiude il rapporto.',
      'Mai inserire reati di classe E nel rapporto (sono multe: vedi sotto); soggetti con reati diversi vanno in rapporti diversi collegati.',
    ])}
    ${block('Rinvio a processo e aggravanti', [
      'Accumulo: 6 reati di classe A in un unico rinvio (nome rinvio con riferimento al rapporto ordinario, soggetti implicati senza pena).',
      'Reato diretto: rinvio col solo reato indicato, senza sanzione né mesi.',
      'In attesa di processo, nuovi reati vanno in un rapporto separato di aggravante con oggetti sequestrati e stesso soggetto.',
      'Minorenni: senza tutore vanno a processo; con tutore reato senza sanzione pecuniaria (scontata al tutore), pena detentiva comunque applicata.',
    ])}
    ${block('Multe e sanzioni pecuniarie', [
      'Distinzione chiave: le multe sono per reati civili e stradali (classe E), applicate dal profilo cittadino; le sanzioni pecuniarie sono per reati penali (A–D), dentro il rapporto.',
      'Cap multe: la somma dei reati civili/stradali non supera 25.000$.',
      'Multe personalizzate solo per cose amministrative (rilascio/rinnovo PDA/PDT, cauzione, multa a tutore, extra per mandato), sempre nel codice penale.',
    ])}
    ${block('Pena pecuniaria e detentiva', [
      'Rapporto ordinario: chi compila chiude applicando entrambe le pene.',
      'Rinviato per accumulo di classe A: pena pecuniaria sì, detentiva scontata al 100%. Arrestato minorenne con tutore: pecuniaria scontata al 100%, detentiva sì.',
      'Rinvio a processo: niente pena detentiva né pecuniaria nel rapporto separato.',
      'Aggravante: entrambe le pene applicate. Diminuzioni o aumenti possibili da tablet in percentuale e mesi.',
    ])}
    ${block('Armadietto prove e correzioni', [
      'Dopo ogni arresto, l’agente che arresta inserisce gli oggetti sequestrati nell’armadietto prove (piano delle celle), collegando il numero di rapporto; la responsabilità sul mancato inserimento è sua, non di chi compila il rapporto.',
      'L’armadietto n.17 è riservato alle armi bianche ritirate senza rapporto collegato.',
      'Il Reparto Amministrativo corregge rapporti e fedine: l’avviso arriva su Discord dal bot, con 48 ore per accettare o contestare con ticket.',
      'Chi apre un rapporto lo compila: mai per un collega. La correttezza di oggetti e sequestri resta in capo a chi compila, verificata nel deposito prove.',
    ])}
    ${block('Rinvio a processo', [
      'Si rinvia per reati con rinvio immediato da codice penale, per 6 reati di classe A, per evasione fiscale aggravata non saldata in tempo, per minorenne senza tutore con reati D o superiori, per agenti con reati D o superiori, per minorenne con tutore con 3 reati A.',
      'Procedura: sito poliziotto con campi, bodycam caricate (intervento, arresto e Miranda, perquisizione, identificazione), fedine compilate, attesa di approvazione del procuratore e avviso a chiusura.',
      'Senza processo alla presenza del deputato: sentenza in contumacia e mandato di cattura. L’agente che arresta è lo stesso che compila la richiesta.',
      'Aggravanti: ogni reato dopo il rinvio aumenta la pena in giudizio, senza bisogno di prove video.',
    ])}
    ${block('Cauzione e cavigliera', [
      'Rinvio a processo e cauzione sono concessi solo dal Procuratore (o da ufficiale di polizia in sua assenza): se nessuno è disponibile, il soggetto resta trattenuto.',
      'Con cauzione pagata il soggetto è liberato; si applica con la multa personalizzata; senza pagamento resta in cella fino al processo.',
      'Cavigliera: insieme alla cauzione, oggetto già in dotazione, gestito nella sezione dedicata del tablet con GPS sempre attivo.',
    ])}
    ${block('Calcolo reati di classe A', [
      'Per la fedina contano solo i reati più gravi: 4 B valgono una A, 4 C valgono una B, 4 D valgono una C.',
      'I reati di classe E non “sporcano” la fedina; 5 A + 4 B + 16 C comportano il processo.',
    ])}
    ${block('Mandati di cattura e arresto', [
      'Dove vederli: Discord, database LSPD online o fedina penale del soggetto; a ogni controllo si verifica se esiste un mandato attivo.',
      'Richiesta: ticket Procura con tutte le prove. Cattura quando non è prevista per forza, dalla Procura se il soggetto non si presenta o se è fuggito dopo un crimine; arresto quando il reato è già stato commesso e va arrestato per quello.',
      'Un mandato di cattura prevede anche una multa extra quando presente nelle direttive del procuratore.',
    ])}
    ${block('Linea rossa', [
      'La linea rossa è la zona ordinata dove il personale si posiziona a inizio servizio in attesa di ordini: niente vuoti, ordine di grado, silenzio massimo, parlare solo con la parola al superiore, saluto alla linea.',
      'Mai estrarre armi dalla linea né fare capriole: ricariche e conflitti a fuoco richiedono autorizzazione del superiore.',
    ])}
    ${block('Gerarchia e gradi', [
      'Catena di comando: Chief of Police, First Assistant, Deputy Chief, Commander, Captain, Lieutenant, Sergeant, Police Officer; ogni grado supervisiona il successivo.',
      'Divise da armadietto senza modifiche (Recluta–Capitano): solo casco, cappello e visiera con scritta police; occhiali sobri di estetica; SAR e SWAT usano le divise consegnate solo su ordine del superiore.',
      'Patch in ordine discendente: Capo (4 stelle), Assistente Capo (3), Vice Capo (2), Comandante (1), Vice Capitano, Tenente, Sergente Maggiore, Sergente, Agente Coordinatore, Agente Esperto, Agente Scelto, Agente, Recluta senza patch.',
    ])}
    ${block('Promozioni', [
      'Si guadagnano con dedizione e leadership, non con favoritismi.',
      'Recluta: ciclo fino a 14 giorni, 2 corsi obbligatori, esame dal 7° giorno con almeno 5 rapporti positivi e una seconda possibilità in caso di bocciatura.',
      'Recluta → Agente è l’unica promuovita con esame; le altre dipendono da operatività, esperienza, meriti e presenza nel dipartimento.',
    ])}
    ${block('Aspetto e bodycam', [
      'Capelli: niente acconciature lunghe o colorate; per le donne i capelli lunghi si raccolgono col cerchietto; tagli eccentrici vietati perché distraggono dalla funzione di servizio e dalla percezione della polizia.',
      'Tatuaggi: vietati in testa e collo e sulle mani (che vanno coperte dai guanti); volgari o offensivi mai consentiti; tutti gli altri consentiti solo se coperti dalle divise.',
      'Orecchini e piercing in vista vietati: oltre all’aspetto inappropriato creano distrazione e rischio in servizio.',
      'Bodycam attiva per tutta la durata del servizio e conservata almeno 5 giorni; le registrazioni possono essere visionate in qualsiasi momento da ufficiali o sottoufficiali.',
      'Previo richiesta di avvocato, la bodycam va mostrata; contestazioni dell’arresto da parte del legale entro 48 ore dall’episodio davanti a un giudice.',
      'Caricamento su YouTube quando c’è un rinvio a processo (tranne accumulo di 5 reati A).',
    ])}
    ${block('Reparti del dipartimento', [
      'Risorse Umane: segue le reclute dal colloquio iniziale all’esame finale.',
      'S.W.A.T. (METRO, task force del Plotone D): antiterrorismo, supporto a indagini criminali, barricate ad alto rischio, appostamenti, sicurezza, mandati e controllo folle, con personale specializzato e graduato.',
      'Reparto Amministrativo: documenti e fascicoli, controllo magazzini, rifornimenti attrezzatura, contratti e censimenti con le attività, presenze.',
    ])}
    ${block('Brevetti e abilitazioni', [
      'HSU: inseguimento e intercettazione ad alta velocità, sicurezza stradale e prevenzione di fughe.',
      'Nautico: pattugliamento acque locali, sicurezza marittima e fluviale, emergenze acquatiche.',
      'Elicotteristi: sorveglianza e salvataggio aereo, supporto stradale; brevetti separati di pilota (chi guida) e di operatore di bordo (comunicazioni), anche insieme.',
      'Operativa: gestione e assegnazione chiamate, coordinamento pattuglie; ottenibile dal coordinatore e richiede almeno 4 ADAM.',
      'Artificiere: gestione e neutralizzazione di ordigni, sicurezza pubblica in caso di esplosivi o pacchi sospetti.',
    ])}
    ${block('Gestione detenuti e provvedimenti disciplinari', [
      'I detenuti rispettano le norme della centrale; comportamenti insolenti o maleducati comportano trattenimento finalizzato all’apprendimento della lezione, graduato per gravità, con registro dei soggetti trattenuti e durata per trasparenza.',
      'Provvedimenti variabili per gravità, contesto e precedenti: un richiamo dura 7–10 giorni; dopo un mese dal richiamo non può essere considerato per una sospensione più lunga.',
      'Tre richiami comportano sospensione automatica di 24 ore; la sospensione influisce sulla promozione; le reclute al massimo due richiami disciplinari, poi licenziamento autorizzato dall’Alto Comando.',
    ])}
    ${block('Centrale operativa', [
      'La centrale gestisce le pattuglie sul territorio, decide le convergenze e le formazioni TAC o d’intervento in caso di rapina.',
      'Divisione in ADAM che girano sul territorio; la scegli l’operativa per zone o operazioni.',
      'Frasi da non usare in radio: dare coordinate di pattuglia non ancora convergere, annunci prima dell’arrivo, invii in TAC senza assegnazione.',
    ])}
    ${block('Sanzioni rapine e furti', [
      'Rapina a mano armata di minore entità (negozietto, ATM, armeria, blindato/portavalori): 10.000$ e classe B.',
      'Media entità (Fleeca e gioielleria nelle sedi varie): 20.000$ e classe B.',
      'Grave entità (Blaine, Pacific, grande attività commerciale registrata): 50.000$ e classe A.',
      'Furti con scasso su privato (abitazione, tombe, veicolo): 2.500–5.000$ e classe C.',
    ])}
    ${block('Rilascio e rinnovo porto d’armi', [
      'PDA livello 1: dal grado Agente, certificato medico e balistico in corso di validità, costo 10.000$ e rinnovo 5.000$, durata 30 giorni, dai 18 anni con fedina pulita o ripulita; armi legali non automatiche. Il colloquio verifica motivazioni, conoscenza dei tipi d’arma e di fondina, sicurezza d’uso e casi pratici.',
      'PDA livello 2: dal grado Agente Esperto, richiede il PDA L1 valido, 50.000$ e rinnovo 25.000$, 30 giorni, fedina mai ripulita; armi legali automatiche incluse e domande più tecniche.',
      'PDA Governativo: governo e Procura lo mantengono fino alla scadenza del contratto.',
      'Procedura: pagamento via “multa” dal profilo, controllo certificati, sezione anagrafe per il rilascio; rinnovo con ritiro del vecchio documento.',
    ])}
    ${block('Porto d’armi: dettagli e tablet', [
      'Livello 1: pagamento con “multa” dal profilo cittadino, verifica di certificati validi, ricerca in anagrafe per il pulsante di rilascio; il colloquio copre motivazioni, tipi di arma, fondina, sicurezza d’uso e scenari pratici.',
      'Rinnovo L1: ritiro del documento precedente; se compare la scritta di revoca, di nuovo pulsante di rilascio.',
      'Livello 2: dal modello di rapporto precompilato con soggetto nei sospettati, fattura con causale dedicata e stampa per il cittadino.',
    ])}
    ${block('Rilascio taser e ritiro licenze', [
      'Il taser si rilascia dal Comandante e dal Responsabile del Reparto Amministrativo: fedina pulita, costo secondo il contratto del locale, rapporto precompilato e fattura al direttore; in ospedale è gratuito.',
      'Licenziamento o fine del rapporto di lavoro: ritiro obbligatorio del taser dal direttore.',
      'Ritiro PDA e taser: ritiro del cartaceo e nota in anagrafe con data e reato quando il soggetto commette reati (A, B, C o D); i reati E non sporcano la fedina.',
    ])}
    ${block('Denunce e interrogatori', [
      'Denunce contro le forze dell’ordine: in Procura con obbligo di avvocato e verifica del procuratore; quelle false seguono il codice penale.',
      'Compilazione: titolo con reato, descrizione e data/ora/luogo, eventuali prove con link, sanzioni a valutarsi, operatori che accolgono, etichette, vittime e targa se presente.',
      'Interrogatori in autonomi non autorizzati: per raccogliere informazioni rilevanti serve comunicazione e ticket CID con oggetto, rapporto breve, data, ora e bodycam integral dell’arresto con Miranda.',
    ])}
    ${block('Equipaggiamento e ore minime', [
      'Taser: due scariche ad elettricità statica, blocca muscoli e movimenti; al massimo 2 utilizzi sullo stesso soggetto.',
      'Manganello: arma non letale in gomma con barra in ferro, solo in scontri corpo a corpo; quantità 1.',
      'Pistole di ordinanza con seriale: Combat Pistol 9 mm fino a 150 munizioni; Glock 17 con gittata maggiore, stessa munizione; SMG automatica leggera fino a 250 munizioni 9 mm; Carabina M4A1 automatica pesante 5.56 mm fino a 250 munizioni (uso in rapine secondo regolamento, anche da un solo operatore in freeroam).',
      'Buoni pasto alle ricariche in locale; oggettistica standard con limiti per bende, bevande, antibiotici, munizioni, cartucce, bodycam, radio, tablet, scanner e kit.',
      'Ore minime: almeno 5 ore settimanali; per entrare in servizio basta accendere la bodycam.',
    ])}
    ${block('Stati di allerta FPCON e DEFCON', [
      'FPCON (protezione forze): Normal (pattugliamento ordinario), Alfa (minimo 3 operatori ADAM, niente Lincoln), Bravo (minimo 3 ADAM, niente Lincoln, niente automatiche da un solo operatore), Charlie (minimo 3 ADAM, pattugliamento a gruppi di 3 ADAM, niente Lincoln), Delta (minimo 3 ADAM, automatiche per tutti, briefing).',
      'DEFCON: 1 (bianco, guerra nucleare imminente, tutta la città blindata e attività amministrative sospese), 2 (rosso, schieramento entro 6 ore, punti chiave presidiati), 3 (giallo, prontezza in 15 minuti), 4 (verde) e 5 (blu) tempi di pace con controllo vigile.',
    ])}
    ${block('Protocollo Return 0 — rapimento del Capo', [
      'L’Alto Comando annuncia il codice Return 0 e un briefing; tutti gli agenti interrompono borghesi e amministrazione e si sospende il servizio immediato.',
      'Gli alti in grado organizzano le pattuglie di ricerca con mezzi e blocchi; il centralino resta disponibile al pubblico per notizie su sequestratori o ignoti.',
      'Comunicazioni radio brevi e precise; invio di almeno due borghesi per la raccolta informazioni nei punti di interesse.',
      'Se il comandante è sparito da 48 ore: comunicazioni più frequenti, segnaliamo edotti i cittadini; informazioni utili premiate; non trascurare eventuali compromissioni e collaboratori in altri posti.',
    ])}
    ${block('Protocolli Potus e Foxtrot', [
      'Potus (attacco alle istituzioni governative, sparizione di agenti): il codice si annuncia in radio e richiama tutti gli agenti a un briefing; gli alti in grado organizzano pattuglie di ricerca, il centralino resta disponibile al pubblico e le comunicazioni devono essere brevi e precise. Blocchi stradali e accessi al raggio di 500 metri per isolare la zona.',
      'Foxtrot (assalti a dipartimento, carcere, bureau o tribunale): messaggio al governo tramite il giornale con DEFCON-5 automatica per gli organi competenti, protezione delle istituzioni, mantener ordine in città e perquisizioni solo autorizzate. Quando il pericolo cessa: nuovo messaggio e DEFCON dal livello 3 al 4.',
    ])}
    ${block('Soggetti trattenuti e porto caccia', [
      'Indipendentemente dal fermo o arresto, il soggetto va trattenuto in centrale; si applica immediatamente l’eventuale pena e si registra l’incarcerazione con tutti i dati utili (nome, luogo, data e ora).',
      'Porto caccia: dal grado Agente, fedina pulita, costo 7.000$ e durata illimitata; stessa procedura del PDA via “multa” e anagrafe.',
    ])}
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

function bandiPage() {
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Portale Bandi</h1>
    <p>Vuoi entrare nel dipartimento? Compila la candidatura: il personale addetto la esamina e ti ricontatta.</p>
  </div>
  <div class="page-body">
    <div id="bandi-root">
      <form class="pin-card" id="bandi-form" novalidate style="align-items:stretch;text-align:left;max-width:32rem">
        <h2 style="text-align:center">Candidatura</h2>
        <div class="crud-form" style="margin-top:1rem">
          <label>Nome e cognome <input name="nome" type="text" required maxlength="80" placeholder="Es. Mario Rossi" /></label>
          <label>Contatto (Discord/username) <input name="contatto" type="text" required maxlength="80" placeholder="Es. mario.rossi" /></label>
          <label>Perché vuoi entrare in polizia? <textarea name="motivazione" rows="4" required maxlength="1000" placeholder="Racconta la tua motivazione…"></textarea></label>
          <label>Esperienza RP precedente (facoltativo) <textarea name="esperienza" rows="3" maxlength="1000" placeholder="Se hai già giocato su altri server…"></textarea></label>
        </div>
        <button class="btn" style="width:100%;margin-top:1.25rem" type="submit">Invia candidatura</button>
        <p class="demo-note" style="text-align:center">Demo: la candidatura è salvata su questo browser e visibile in Area riservata → Candidature.</p>
      </form>
    </div>
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

function bindBandi() {
  const form = $('#bandi-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const item = {
      nome: String(fd.get('nome') || '').trim(),
      contatto: String(fd.get('contatto') || '').trim(),
      motivazione: String(fd.get('motivazione') || '').trim(),
      esperienza: String(fd.get('esperienza') || '').trim(),
      data: new Date().toISOString().slice(0, 10),
    };
    if (!item.nome || !item.contatto || !item.motivazione) { toast('Compila nome, contatto e motivazione', true); return; }
    createItem('applications', item);
    toast('Candidatura inviata');
    $('#bandi-root').innerHTML = `
      <div class="pin-card" style="max-width:32rem">
        <div class="pin-badge">${icon('check', 22)}</div>
        <h2>Candidatura ricevuta</h2>
        <p class="pin-desc">Grazie ${esc(item.nome)}: la tua candidatura è stata registrata. Verrai ricontattato dal personale addetto.</p>
      </div>`;
  });
}

const AMBECEBUS_SECTIONS = [
  { value: 'FDO', label: 'FDO' },
  { value: 'Governo', label: 'Governo' },
  { value: 'CID', label: 'CID' },
  { value: 'FIBA', label: 'FIBA' },
  { value: 'CIA', label: 'CIA' },
  { value: 'Funzionari', label: 'Funzionari' },
];
const AMBECEBUS_LEVELS = [
  { value: 'standard', label: 'Standard' },
  { value: 'federal', label: 'Federale' },
];
const DOC_LEVELS = ['FDO', 'Governo', 'CID', 'FIBA', 'CIA', 'Funzionari'];

function ambecebusCanView(user, doc) {
  if (!user || !doc) return false;
  if (isAdmin(user)) return true;
  if (doc.sections?.includes('Tutti')) return true;
  if (user.role === doc.section) return true;
  if (isFederal(user) && doc.level === 'federal') return true;
  return (doc.addedUsers || []).includes(user.username);
}

function ambecebusPage() {
  const user = getSession() || { username: '', nome: 'Ospite', role: 'FDO', level: 'standard' };
  const canEdit = isAdmin(user) || isFederal(user) || user.role === 'Governo';
  const accounts = listAccounts();
  const labels = listItems('ambecebusRoleLabels');
  const reprimands = listItems('ambecebusReprimands');
  const documents = listItems('ambecebusDocuments').filter((d) => ambecebusCanView(user, d));
  const circulars = listItems('ambecebusCirculars').filter((c) => c.section === 'Tutti' || c.section === user.role || isFederal(user) || isAdmin(user));
  const roles = [...new Set([...AMBECEBUS_SECTIONS.map((s) => s.value), ...accounts.map((a) => a.role), ...labels.map((l) => l.role)])].filter(Boolean);
  const roleOptions = roles.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
  const accountByUser = Object.fromEntries(accounts.map((a) => [a.username, a]));
  const given = reprimands.filter((r) => r.giver === user.username);
  const received = reprimands.filter((r) => r.receiver === user.username);
  const showAllRoles = isAdmin(user) || isFederal(user);
  const mySection = user.role;
  const myDocuments = documents.filter((d) => d.section === mySection || d.level === 'federal' || isAdmin(user) || (d.addedUsers || []).includes(user.username));
  const myReprimands = showAllRoles ? reprimands : received;
  const roleLabelFor = (role) => {
    const row = labels.find((l) => l.role === role);
    return row?.label || role;
  };
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">AMBECEBUS · Ruoli e procedure</p>
    <h1>Ambecebus</h1>
    <p>Hai il ruolo <strong>${esc(roleLabelFor(user.role))}</strong>${user.level ? ` · livello ${user.level === 'federal' ? 'Federale' : 'Standard'}` : ''}. ${canSeeAll(user) ? 'Vedi tutto tra le leggi a livello federale.' : 'Solo la tua sezione.'}</p>
  </div>
  <div class="page-body">
    <section class="reg-block">
      <h2>I tuoi ruoli</h2>
      <p class="empty-desc">Account: <strong>${esc(user.username)}</strong> · Ruolo attuale: <strong>${esc(roleLabelFor(user.role))}</strong>. Le sezioni di riferimento sono FDO, Governo, CID, FIBA, CIA e Funzionari.</p>
    </section>
    ${canSeeAll(user) ? `<section class="reg-block"><h2>Leggi federali (visione completa)</h2><p class="empty-desc">Vedi tutti i documenti federali e le circolari destinate a tutte le sezioni.</p></section>` : ''}
    <section class="reg-block">
      <h2>Richiami ricevuti</h2>
      ${received.length ? `<table class="cens-table"><thead><tr><th>Chi l’ha dato</th><th>Motivo</th><th>Stato</th></tr></thead><tbody>${received.map((r) => `<tr${r.nullified ? ' style="opacity:.55;text-decoration:line-through"' : ''}><td>${esc(accountByUser[r.giver]?.nome || r.giver)}</td><td>${esc(r.reason)}</td><td>${r.nullified ? 'Annullato' : 'Valido'}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-desc">Nessun richiamo ricevuto.</p>'}
    </section>
    <section class="reg-block">
      <h2>Richiami dati</h2>
      ${given.length ? `<table class="cens-table"><thead><tr><th>Destinatario</th><th>Motivo</th><th>Stato</th></tr></thead><tbody>${given.map((r) => `<tr${r.nullified ? ' style="opacity:.55;text-decoration:line-through"' : ''}><td>${esc(accountByUser[r.receiver]?.nome || r.receiver)}</td><td>${esc(r.reason)}</td><td>${r.nullified ? 'Annullato' : 'Valido'}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-desc">Non hai ancora dato richiami.</p>'}
    </section>
    <section class="reg-block">
      <h2>Nuovo richiamo</h2>
      <form class="pin-card" id="reprimand-form" novalidate style="max-width:32rem;align-items:stretch;text-align:left">
        <div class="crud-form">
          <label>Destinatario <select name="receiver" required>${accounts.map((a) => `<option value="${esc(a.username)}">${esc(a.nome)} (${esc(a.role)})</option>`).join('')}</select></label>
          <label>Motivo <input name="reason" type="text" required maxlength="120" placeholder="Perché viene dato il richiamo?" /></label>
          <label>Annotazioni (facoltativo) <input name="note" type="text" maxlength="200" /></label>
        </div>
        <button class="btn" style="width:100%;margin-top:1rem" type="submit">Registra richiamo</button>
      </form>
    </section>
    <section class="reg-block">
      <h2>Tutti i richiami</h2>
      ${reprimands.length ? `<table class="cens-table"><thead><tr><th>Dato da</th><th>Destinatario</th><th>Motivo</th><th>Stato</th><th></th></tr></thead><tbody>${reprimands.map((r) => {
        const roleOfReceiver = accountByUser[r.receiver]?.role || '';
        const canNull = canEdit && roleOfReceiver !== 'Admin' && r.receiver !== user.username;
        return `<tr${r.nullified ? ' style="opacity:.55"' : ''}><td>${esc(accountByUser[r.giver]?.nome || r.giver)}</td><td>${esc(accountByUser[r.receiver]?.nome || r.receiver)}</td><td>${esc(r.reason)}</td><td>${r.nullified ? 'Annullato' : 'Valido'}</td><td>${canNull ? `<button class="link-btn" data-reprimand-null="${r.id}">${r.nullified ? 'Riattiva' : 'Annulla'}</button>` : ''}</td></tr>`;
      }).join('')}</tbody></table>` : '<p class="empty-desc">Nessun richiamo registrato.</p>'}
    </section>
    <section class="reg-block">
      <h2>Notizie e circolari</h2>
      <form class="pin-card" id="circular-form" novalidate style="max-width:32rem;align-items:stretch;text-align:left">
        <div class="crud-form">
          <label>Titolo <input name="title" type="text" required maxlength="120" /></label>
          <label>Sezione destinataria <select name="section" required>${AMBECEBUS_SECTIONS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}<option value="Tutti">Tutti</option></select></label>
          <label>Testo <textarea name="body" rows="3" required maxlength="1000"></textarea></label>
        </div>
        <button class="btn" style="width:100%;margin-top:1rem" type="submit">Pubblica circolare</button>
      </form>
      ${circulars.length ? `<table class="cens-table"><thead><tr><th>Data</th><th>Sezione</th><th>Titolo</th><th>Testo</th></tr></thead><tbody>${circulars.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.section)}</td><td>${esc(c.title)}</td><td>${esc(c.body)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-desc">Nessuna circolare per la tua sezione.</p>'}
    </section>
    <section class="reg-block">
      <h2>Documenti e leggi</h2>
      <p class="empty-desc">Il Governatore e il FIB vedono tutto a livello federale; gli altri gradi vedono la propria sezione più i documenti dove sono stati aggiunti. Gli assenteisti (assenti per esigenze) possono essere raggiunti per i trattenuti in cella.</p>
      <form class="pin-card" id="doc-form" novalidate style="max-width:32rem;align-items:stretch;text-align:left">
        <div class="crud-form">
          <label>Titolo <input name="title" type="text" required maxlength="120" /></label>
          <label>Sezione <select name="section" required>${AMBECEBUS_SECTIONS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}</select></label>
          <label>Livello <select name="level" required>${AMBECEBUS_LEVELS.map((l) => `<option value="${l.value}">${l.label}</option>`).join('')}</select></label>
          <label>Testo <textarea name="body" rows="4" required maxlength="2000"></textarea></label>
          <label>Aggiungi account (username, separati da virgola) <input name="addedUsers" type="text" maxlength="200" placeholder="es. cid.demo, cia.demo" /></label>
        </div>
        <button class="btn" style="width:100%;margin-top:1rem" type="submit">Crea documento</button>
      </form>
      ${documents.length ? `<table class="cens-table"><thead><tr><th>Sezione</th><th>Livello</th><th>Titolo</th><th>Testo</th><th>Aggiunti</th></tr></thead><tbody>${documents.map((d) => `<tr><td>${esc(d.section)}</td><td>${d.level === 'federal' ? 'Federale' : 'Standard'}</td><td>${esc(d.title)}</td><td>${esc(d.body)}</td><td>${esc((d.addedUsers || []).join(', ') || '—')}</td></tr>`).join('')}</tbody></table>` : '<p class="empty-desc">Nessun documento visibile per il tuo ruolo.</p>'}
    </section>
    ${isAdmin(user) ? `
    <section class="reg-block">
      <h2>Gestione account (Admin)</h2>
      <p class="empty-desc">Puoi creare account, cambiare ruolo e permessi. Gli account esistenti restano validi finché non li modifichi.</p>
      <form class="pin-card" id="account-form" novalidate style="max-width:32rem;align-items:stretch;text-align:left">
        <div class="crud-form">
          <label>Username <input name="username" type="text" required maxlength="40" /></label>
          <label>Password <input name="password" type="text" required maxlength="80" /></label>
          <label>Nome visualizzato <input name="nome" type="text" required maxlength="80" /></label>
          <label>Ruolo <select name="role" required>${roleOptions}</select></label>
          <label>Livello <select name="level" required>${AMBECEBUS_LEVELS.map((l) => `<option value="${l.value}">${l.label}</option>`).join('')}</select></label>
          <label>Grado (testo libero) <input name="grado" type="text" maxlength="80" /></label>
        </div>
        <button class="btn" style="width:100%;margin-top:1rem" type="submit">Crea account</button>
      </form>
      <table class="cens-table"><thead><tr><th>Username</th><th>Nome</th><th>Ruolo</th><th>Livello</th><th>Grado</th><th></th></tr></thead><tbody>${accounts.map((a) => `<tr><td>${esc(a.username)}</td><td>${esc(a.nome)}</td><td><select data-account-role="${esc(a.username)}" ${a.role === 'Admin' ? 'disabled' : ''}>${roles.map((r) => `<option value="${esc(r)}"${r === a.role ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></td><td><select data-account-level="${esc(a.username)}" ${a.role === 'Admin' ? 'disabled' : ''}>${AMBECEBUS_LEVELS.map((l) => `<option value="${l.value}"${l.value === a.level ? ' selected' : ''}>${l.label}</option>`).join('')}</select></td><td>${esc(a.grado || '—')}</td><td>${a.role === 'Admin' ? 'Protetto' : `<button class="link-btn" data-account-save="${esc(a.username)}">Salva</button>`}</td></tr>`).join('')}</tbody></table>
    </section>` : ''}
    <p class="page-sign">Alto Comando Los Santos Police Department</p>
  </div>`;
}

function bindAmbecebus(path) {
  const user = getSession();
  const reprimandForm = $('#reprimand-form');
  reprimandForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(reprimandForm);
    const receiver = String(fd.get('receiver') || '').trim();
    const reason = String(fd.get('reason') || '').trim();
    if (!receiver || !reason) { toast('Compila destinatario e motivo', true); return; }
    createItem('ambecebusReprimands', {
      giver: user?.username || 'sconosciuto',
      receiver,
      reason,
      note: String(fd.get('note') || '').trim(),
      date: new Date().toISOString().slice(0, 10),
      nullified: false,
    });
    toast('Richiamo registrato');
    render(path);
  });
  view().querySelectorAll('[data-reprimand-null]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-reprimand-null');
      const item = listItems('ambecebusReprimands').find((r) => r.id === id);
      if (!item) return;
      updateItem('ambecebusReprimands', id, { nullified: !item.nullified });
      toast(item.nullified ? 'Richiamo riattivato' : 'Richiamo annullato (non rimosso)');
      render(path);
    });
  });
  const circularForm = $('#circular-form');
  circularForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(circularForm);
    const title = String(fd.get('title') || '').trim();
    const section = String(fd.get('section') || '').trim();
    const body = String(fd.get('body') || '').trim();
    if (!title || !section || !body) { toast('Compila titolo, sezione e testo', true); return; }
    createItem('ambecebusCirculars', {
      title,
      section,
      body,
      author: user?.username || '',
      date: new Date().toISOString().slice(0, 10),
    });
    toast('Circolare pubblicata');
    render(path);
  });
  const docForm = $('#doc-form');
  docForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(docForm);
    const title = String(fd.get('title') || '').trim();
    const section = String(fd.get('section') || '').trim();
    const level = String(fd.get('level') || 'standard').trim();
    const body = String(fd.get('body') || '').trim();
    const addedUsers = String(fd.get('addedUsers') || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!title || !section || !body) { toast('Compila titolo, sezione, livello e testo', true); return; }
    createItem('ambecebusDocuments', {
      title,
      section,
      level,
      body,
      author: user?.username || '',
      addedUsers,
      date: new Date().toISOString().slice(0, 10),
    });
    toast('Documento creato');
    render(path);
  });
  const accountForm = $('#account-form');
  accountForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(accountForm);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '').trim();
    const nome = String(fd.get('nome') || '').trim();
    const role = String(fd.get('role') || '').trim();
    const level = String(fd.get('level') || 'standard').trim();
    const grado = String(fd.get('grado') || '').trim();
    if (!username || !password || !nome || !role) { toast('Compila tutti i campi obbligatori', true); return; }
    const existing = findAccount(username);
    if (existing) {
      const ok = updateAccount(username, { password, nome, role, level, grado });
      toast(ok ? 'Account aggiornato' : 'Impossibile aggiornare', !ok);
    } else {
      const created = createAccount({ username, password, nome, role, level, grado, note: '' });
      if (!created) { toast('Username già esistente', true); return; }
      toast('Account creato');
    }
    render(path);
  });
  view().querySelectorAll('[data-account-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const username = btn.getAttribute('data-account-save');
      const roleSel = document.querySelector(`[data-account-role="${CSS.escape(username)}"]`);
      const levelSel = document.querySelector(`[data-account-level="${CSS.escape(username)}"]`);
      if (!roleSel || !levelSel) return;
      updateAccount(username, { role: roleSel.value, level: levelSel.value });
      toast('Permessi aggiornati');
      render(path);
    });
  });
}

function loginPage() {
  const creds = demoCredentials();
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Los Santos Police Department</p>
    <h1>Area Riservata</h1>
    <p>Accedi con le tue credenziali per gestire notizie, denunce, multe, avvisi e ufficiali.</p>
  </div>
  <div class="page-body">
    <form class="pin-card" id="login-form" novalidate>
      <div class="pin-badge">${icon('key-round', 22)}</div>
      <h2>Accesso agenti</h2>
      <div class="crud-form" style="max-width:20rem;width:100%">
        <label>Username <input name="username" type="text" autocomplete="username" required /></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
      </div>
      <p class="pin-error" id="login-error" role="alert"></p>
      <button class="btn" type="submit">Accedi</button>
      <p class="demo-note">Login FDO: <code>${esc(creds.username)}</code> / <code>${esc(creds.password)}</code></p>
      <p class="demo-note">Account AMBECEBUS demo: ${ambecebusCredentials().map((c) => `<code>${esc(c.username)}</code> / <code>${esc(c.password)}</code> <span>(${esc(c.role)})</span>`).join(' · ')}</p>
    </form>
  </div>`;
}

const CRUD_SECTIONS = {
  news: {
    title: 'News', desc: 'Comunicati e notizie ufficiali pubblicati sulla pagina pubblica Comunicati Stampa.',
    fields: [
      { key: 'title', label: 'Titolo', type: 'text', required: true },
      { key: 'description', label: 'Descrizione', type: 'textarea', required: true },
    ],
    columns: (n) => [`${esc(n.title)}`, `${esc(n.description)}`, esc(new Date(n.createdAt).toLocaleDateString('it-IT'))],
    headers: ['Titolo', 'Descrizione', 'Data'],
  },
  complaints: {
    title: 'Denunce', desc: 'Reati segnalati e denunce registrate dal dipartimento.',
    fields: [
      { key: 'reason', label: 'Motivo', type: 'text', required: true },
      { key: 'victim', label: 'Vittima', type: 'text', required: true },
      { key: 'witnesses', label: 'Testimoni', type: 'text', required: true },
      { key: 'suspect', label: 'Sospettato', type: 'text', required: true },
      { key: 'date', label: 'Data', type: 'date', required: true },
      { key: 'hours', label: 'Ora', type: 'time', required: true },
    ],
    columns: (c) => [`${esc(c.reason)}`, `${esc(c.victim)}`, `${esc(c.witnesses)}`, `${esc(c.suspect)}`, `${esc(c.date)}`, `${esc(c.hours)}`],
    headers: ['Motivo', 'Vittima', 'Testimoni', 'Sospettato', 'Data', 'Ora'],
  },
  contraventions: {
    title: 'Multe — infrazioni', desc: 'Multe emesse dagli ufficiali sul campo.',
    fields: [
      { key: 'name', label: 'Infrazione', type: 'text', required: true },
      { key: 'officer', label: 'Ufficiale', type: 'text', required: true },
      { key: 'given_to', label: 'Destinatario', type: 'text', required: true },
      { key: 'price', label: 'Importo', type: 'text', required: true },
      { key: 'date', label: 'Data', type: 'date', required: true },
    ],
    columns: (c) => [`${esc(c.name)}`, `${esc(c.officer)}`, `${esc(c.given_to)}`, `${esc(c.price)}`, `${esc(c.date)}`],
    headers: ['Infrazione', 'Ufficiale', 'Destinatario', 'Importo', 'Data'],
  },
  fines: {
    title: 'Multe — catalogo', desc: 'Catalogo delle ammende applicabili.',
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'category', label: 'Categoria', type: 'text', required: true },
      { key: 'price', label: 'Prezzo', type: 'text', required: true },
    ],
    columns: (f) => [`${esc(f.name)}`, `${esc(f.category)}`, `${esc(f.price)}`],
    headers: ['Nome', 'Categoria', 'Prezzo'],
  },
  wanted: {
    title: 'Avvisi di ricerca', desc: 'Persone ricercate pubblicate sulla bacheca pubblica Latitanti e Ricercati.',
    fields: [
      { key: 'wanted_person', label: 'Persona ricercata', type: 'text', required: true },
      { key: 'officer', label: 'Ufficiale', type: 'text', required: true },
      { key: 'date', label: 'Data', type: 'date', required: true },
    ],
    columns: (w) => [`${esc(w.wanted_person)}`, `${esc(w.officer)}`, `${esc(w.date)}`],
    headers: ['Persona ricercata', 'Ufficiale', 'Data'],
  },
  robberies: {
    title: 'Rapine', desc: 'Numeri ufficiali per tipo di rapina dal Regolamento VYCE RP sezione 9.1. Elicottero consentito solo per Blaine e Pacific.',
    fields: [
      { key: 'tipo', label: 'Tipo', type: 'text', required: true },
      { key: 'criminali', label: 'Criminali', type: 'text', required: true },
      { key: 'polizia', label: 'Polizia', type: 'text', required: true },
      { key: 'armi', label: 'Armi', type: 'text', required: true },
      { key: 'ostaggi', label: 'Ostaggi', type: 'text', required: true },
      { key: 'caschi', label: 'Caschi', type: 'text', required: true },
      { key: 'esterno', label: 'Esterno', type: 'text', required: true },
    ],
    columns: (r) => [`${esc(r.tipo)}`, `${esc(r.criminali)}`, `${esc(r.polizia)}`, `${esc(r.armi)}`, `${esc(r.ostaggi)}`, `${esc(r.caschi)}`, `${esc(r.esterno)}`],
    headers: ['Tipo', 'Criminali', 'Polizia', 'Armi', 'Ostaggi', 'Caschi', 'Esterno'],
  },
  patrols: {
    title: 'Pattuglie', desc: 'Tipi di pattuglia e requisiti d’uso dal Manuale Interno (riepilogo operativo).',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'composizione', label: 'Composizione', type: 'text', required: true },
      { key: 'requisito', label: 'Requisito', type: 'text', required: true },
    ],
    columns: (p) => [`${esc(p.nome)}`, `${esc(p.composizione)}`, `${esc(p.requisito)}`],
    headers: ['Nome', 'Composizione', 'Requisito'],
  },
  officers: {
    title: 'Ufficiali', desc: 'Elenco del personale del dipartimento.',
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'grado', label: 'Grado', type: 'text', required: true },
      { key: 'date', label: 'Data di entrata', type: 'date', required: true },
    ],
    columns: (o) => [`${esc(o.username)}`, `${esc(o.grado)}`, `${esc(o.date)}`],
    headers: ['Username', 'Grado', 'Data di entrata'],
  },
  applications: {
    title: 'Candidature', desc: 'Candidature ricevute dal Portale Bandi.',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'contatto', label: 'Contatto', type: 'text', required: true },
      { key: 'motivazione', label: 'Motivazione', type: 'textarea', required: true },
      { key: 'esperienza', label: 'Esperienza RP', type: 'textarea', required: false },
      { key: 'data', label: 'Data', type: 'date', required: true },
    ],
    columns: (a) => [`${esc(a.nome)}`, `${esc(a.contatto)}`, `${esc(a.motivazione)}`, `${esc(a.esperienza || '—')}`, `${esc(a.data)}`],
    headers: ['Nome', 'Contatto', 'Motivazione', 'Esperienza RP', 'Data'],
  },
};

function crudPage(section) {
  const cfg = CRUD_SECTIONS[section];
  if (!cfg) return notFoundPage('/area-riservata');
  const block = (sec) => {
    const c = CRUD_SECTIONS[sec];
    const items = listItems(sec);
    const fields = c.fields.map((f) => f.type === 'textarea'
      ? `<label>${f.label} <textarea name="${f.key}" rows="3" ${f.required ? 'required' : ''}></textarea></label>`
      : `<label>${f.label} <input name="${f.key}" type="${f.type}" ${f.required ? 'required' : ''} /></label>`).join('');
    const rows = items.length
      ? items.map((item) => `<tr data-row="${item.id}">${c.columns(item).map((col) => `<td>${col}</td>`).join('')}<td style="white-space:nowrap"><button class="link-btn" type="button" data-section="${sec}" data-edit="${item.id}">Modifica</button> <button class="link-btn danger" type="button" data-section="${sec}" data-delete="${item.id}">Elimina</button></td></tr>`).join('')
      : `<tr><td colspan="${c.headers.length + 1}" style="text-align:center;color:hsl(var(--muted-foreground))">Nessun elemento registrato.</td></tr>`;
    return `<section class="crud-sub">
      <h2 class="crud-sub-title">${esc(c.title)}</h2>
      <div class="crud-grid">
        <form class="pin-card crud-create" data-section="${sec}" novalidate>
          <h2 class="crud-form-title">Nuovo elemento</h2>
          <div class="crud-form">${fields}</div>
          <button class="btn crud-submit" type="submit">Aggiungi</button>
          <button class="btn-outline crud-cancel" type="button" hidden>Annulla modifica</button>
        </form>
        <div class="crud-list">
          <div class="crud-search"><input type="search" placeholder="Cerca in ${esc(c.title.toLowerCase())}…" aria-label="Cerca in ${esc(c.title)}" data-search /></div>
          <table class="cens-table"><thead><tr>${c.headers.map((h) => `<th>${esc(h)}</th>`).join('')}<th></th></tr></thead><tbody>${rows}</tbody></table>
        </div>
      </div>
    </section>`;
  };
  const extra = section === 'contraventions' ? block('fines') : '';
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Area riservata</p>
    <h1>${esc(cfg.title)}</h1>
    <p>${esc(cfg.desc)}</p>
  </div>
  <div class="page-body">
    ${block(section)}
    ${extra}
  </div>`;
}

function overviewPage() {
  const cards = [
    { href: '/area-riservata/news', icon: 'newspaper', title: 'News', desc: `${countItems('news')} pubblicate`, countSection: 'news' },
    { href: '/area-riservata/complaints', icon: 'file-pen', title: 'Denunce', desc: `${countItems('complaints')} registrate`, countSection: 'complaints' },
    { href: '/area-riservata/contraventions', icon: 'file-pen', title: 'Multe', desc: `${countItems('contraventions')} emesse · ${countItems('fines')} in catalogo`, countSection: 'contraventions' },
    { href: '/area-riservata/wanted', icon: 'user-search', title: 'Avvisi di ricerca', desc: `${countItems('wanted')} attivi`, countSection: 'wanted' },
    { href: '/area-riservata/officers', icon: 'user-search', title: 'Ufficiali', desc: `${countItems('officers')} nel roster`, countSection: 'officers' },
    { href: '/area-riservata/robberies', icon: 'user-search', title: 'Rapine', desc: `${countItems('robberies')} tipi monitorati`, countSection: 'robberies' },
    { href: '/area-riservata/patrols', icon: 'user-search', title: 'Pattuglie', desc: `${countItems('patrols')} tipi di pattuglia`, countSection: 'patrols' },
    { href: '/area-riservata/applications', icon: 'file-pen', title: 'Candidature', desc: `${countItems('applications')} inviate dal Portale Bandi`, countSection: 'applications' },
    { href: '/area-riservata/ambecebus', icon: 'key-round', title: 'Ambecebus', desc: 'Ruoli, richiami, circolari e account', countSection: 'ambecebusReprimands' },
  ];
  return `
  <div class="page-head">
    ${crest(72, 'Los Santos Police Department')}
    <p class="crumb2">Area riservata</p>
    <h1>Panoramica</h1>
    <p>Gestione operativa del dipartimento. I dati sono salvati in locale su questo browser.</p>
  </div>
  <div class="page-body">
    <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))">
      ${cards.map((c) => `<article class="card"><a href="${c.href}" data-link><div class="card-head">${icon(c.icon, 16)}<div class="card-title">${esc(c.title)}</div></div><p>${esc(c.desc)}</p></a></article>`).join('')}
    </div>
  </div>`;
}

function notFoundPage(path) {
  const now = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `
  <div class="nf-wrap">
    <div class="nf" role="alert">
      <div class="nf-stripes" aria-hidden="true"><span>LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · </span><span>LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · LSPD · AREA DELIMITATA · NON OLTREPASSARE · </span></div>
      <div class="nf-body">
        <div class="nf-code">
          <div class="nf-icon">${icon('map-pin-off', 26)}</div>
          <div class="nf-404">404</div>
        </div>
        <div class="nf-head">
          <span class="nf-badge"><i></i>10-20 · Posizione non rilevata</span>
          <h1 class="nf-title">Pagina non trovata</h1>
          <p class="nf-kicker">APMS · Los Santos Police Department</p>
        </div>
        <p class="nf-lead">Nessuna pagina risponde a questo indirizzo. Potrebbe essere stata spostata o rimossa, oppure il link che hai seguito contiene un errore.</p>
        <dl class="nf-dl">
          <div><dt>Ultima posizione nota</dt><dd>${esc(path)}</dd></div>
          <div><dt>Rilevato</dt><dd>${esc(now)}</dd></div>
          <div><dt>Esito ricerca</dt><dd>Nessun riscontro</dd></div>
        </dl>
        <div class="nf-actions">
          <button class="btn-outline" id="nf-back" type="button">${icon('chevron-left', 16)}Indietro</button>
          <button class="btn btn-lg" id="nf-home" type="button">${icon('house', 16)}Torna alla dashboard</button>
        </div>
      </div>
    </div>
  </div>`;
}

function bindPage(path) {
  if (path === '/bandi') bindBandi();
  if (path === '/censimento') bindCensimento();
  if (path === '/login') bindLogin();
  if (path.startsWith(PRIVATE_PREFIX + '/')) bindCrud(path);
  if (path === PRIVATE_PREFIX + '/ambecebus') bindAmbecebus(path);
  if (!routes[path]) {
    $('#nf-back')?.addEventListener('click', () => (history.length > 1 ? history.back() : navigate('/')));
    $('#nf-home')?.addEventListener('click', () => navigate('/'));
  }
}

function bindLogin() {
  const form = $('#login-form');
  if (!form) return;
  const err = $('#login-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const user = sessionLogin(String(fd.get('username') || ''), String(fd.get('password') || ''));
    if (!user) {
      err.textContent = 'Credenziali non valide';
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      return;
    }
    toast(`Benvenuto, ${user.nome}`);
    refreshAuth();
    navigate(PRIVATE_PREFIX);
  });
}

function bindCrud(path) {
  view().querySelectorAll('.crud-search input').forEach((input) => {
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      input.closest('.crud-list').querySelectorAll('tbody tr[data-row]').forEach((row) => {
        row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  });
  view().querySelectorAll('.crud-create').forEach((form) => {
    const section = form.dataset.section;
    const cfg = CRUD_SECTIONS[section];
    if (!cfg) return;
    const submitBtn = form.querySelector('.crud-submit');
    const cancelBtn = form.querySelector('.crud-cancel');
    const formTitle = form.querySelector('.crud-form-title');
    const resetForm = () => {
      form.reset();
      delete form.dataset.editingId;
      submitBtn.textContent = 'Aggiungi';
      cancelBtn.hidden = true;
      formTitle.textContent = 'Nuovo elemento';
    };
    cancelBtn?.addEventListener('click', resetForm);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const fields = {};
      for (const f of cfg.fields) fields[f.key] = String(fd.get(f.key) || '').trim();
      if (cfg.fields.some((f) => f.required && !fields[f.key])) { toast('Compila tutti i campi obbligatori', true); return; }
      const editingId = form.dataset.editingId;
      if (editingId) {
        if (!updateItem(section, editingId, fields)) { toast('Elemento non trovato', true); return; }
        toast('Elemento aggiornato');
      } else {
        createItem(section, fields);
        toast('Elemento aggiunto');
      }
      render(path);
    });
  });
  view().querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      const cfg = CRUD_SECTIONS[section];
      const item = listItems(section).find((i) => i.id === btn.getAttribute('data-edit'));
      if (!item || !cfg) return;
      const form = view().querySelector(`.crud-create[data-section="${section}"]`);
      if (!form) return;
      for (const f of cfg.fields) {
        const el = form.elements[f.key];
        if (el) el.value = item[f.key] ?? '';
      }
      form.dataset.editingId = item.id;
      form.querySelector('.crud-submit').textContent = 'Salva modifiche';
      form.querySelector('.crud-cancel').hidden = false;
      form.querySelector('.crud-form-title').textContent = 'Modifica elemento';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.querySelector('input, textarea')?.focus();
    });
  });
  view().querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      if (!btn.dataset.armed) {
        btn.dataset.armed = '1';
        btn.textContent = 'Confermi?';
        setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = 'Elimina'; } }, 3000);
        return;
      }
      const id = btn.getAttribute('data-delete');
      if (deleteItem(section, id)) { toast('Elemento eliminato'); render(path); }
    });
  });
}

async function loadCensus() {
  const r = await fetch('/api/censimento');
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function bindCensimento() {
  const root = $('#censimento-root');
  if (!root) return;
  const { status, data } = await loadCensus();
  if (status === 200 && data?.ok) {
    root.innerHTML = censusListHtml(data);
    bindTaxCalculator();
    bindEmployees();
    return;
  }
  const boxes = [...root.querySelectorAll('.pin-box')];
  const btn = $('#pin-btn');
  const err = $('#pin-error');
  const form = $('#pin-form');
  const code = () => boxes.map((b) => b.value).join('');
  const sync = () => { btn.disabled = code().length !== boxes.length; };
  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      err.textContent = '';
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
      sync();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; sync(); }
      if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener('paste', (e) => {
      const digits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, boxes.length);
      if (!digits) return;
      e.preventDefault();
      digits.split('').forEach((d, k) => { if (boxes[k]) boxes[k].value = d; });
      boxes[Math.min(digits.length, boxes.length - 1)].focus();
      sync();
    });
    box.addEventListener('focus', () => box.select());
  });
  sync();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.textContent = 'Verifica in corso…';
    form.setAttribute('aria-busy', 'true');
    const r = await fetch('/api/censimento/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: code() }) });
    const body = await r.json().catch(() => ({}));
    form.removeAttribute('aria-busy');
    if (r.ok && body?.ok) {
      toast('Accesso al censimento effettuato');
      root.innerHTML = censusListHtml(body);
      bindTaxCalculator();
      bindEmployees();
      return;
    }
    err.textContent = body?.message || 'PIN non valido';
    form.classList.remove('shake');
    void form.offsetWidth;
    form.classList.add('shake');
    btn.disabled = false;
    btn.textContent = 'Accedi';
    boxes.forEach((b) => { b.value = ''; });
    boxes[0].focus();
  });
}

const TAX_ACTIVITY_FEES = [
  { value: 'negozio', label: 'Negozio', fee: 500 },
  { value: 'ristorante', label: 'Ristorante', fee: 750 },
  { value: 'officina', label: 'Officina', fee: 600 },
  { value: 'bar', label: 'Bar', fee: 650 },
  { value: 'servizi', label: 'Servizi', fee: 400 },
  { value: 'altro', label: 'Altro', fee: 350 },
];
const TAX_BRACKETS = [[10000, 0.05], [50000, 0.10], [100000, 0.15], [Infinity, 0.20]];
const TAX_WASTE_FEE = 120;

const fmtMoney = (n) => `$${Math.round(n).toLocaleString('it-IT')}`;

function computeTaxes(reddito, fee, mesi) {
  let incomeTax = 0;
  let prev = 0;
  for (const [cap, rate] of TAX_BRACKETS) {
    if (reddito <= prev) break;
    incomeTax += (Math.min(reddito, cap) - prev) * rate;
    prev = cap;
  }
  const months = Math.min(12, Math.max(1, mesi || 12));
  const prorata = (annual) => annual * months / 12;
  const licence = prorata(fee);
  const waste = prorata(TAX_WASTE_FEE);
  const total = incomeTax + licence + waste;
  const effectiveRate = reddito > 0 ? total / reddito * 100 : 0;
  return { incomeTax, licence, waste, total, months, effectiveRate, reddito };
}

function taxCalculatorHtml() {
  return `
  <div class="pin-card tax-card">
    <div class="pin-badge">${icon('banknote', 22)}</div>
    <h2>Calcolo tasse (demo)</h2>
    <p class="pin-desc">Schema inventato per la demo: imposta progressiva sul reddito d'attività, licenza annua per tipo di attività e tassa rifiuti prorata sul periodo.</p>
    <div class="crud-form tax-form">
      <label>Reddito annuo (USD) <input id="tax-income" type="number" min="0" step="1" inputmode="numeric" placeholder="0" /></label>
      <label>Tipo di attività <select id="tax-activity">${TAX_ACTIVITY_FEES.map((a) => `<option value="${a.value}">${esc(a.label)} — ${fmtMoney(a.fee)}/anno</option>`).join('')}</select></label>
      <label>Mesi di attività <input id="tax-months" type="number" min="1" max="12" step="1" inputmode="numeric" value="12" /></label>
    </div>
    <table class="cens-table tax-result">
      <tbody>
        <tr><td>Imposta sul reddito (progressiva)</td><td id="tax-income-tax">$0</td></tr>
        <tr><td>Licenza attività</td><td id="tax-licence">$0</td></tr>
        <tr><td>Tassa rifiuti</td><td id="tax-waste">$0</td></tr>
        <tr class="tax-total"><td>Totale da versare</td><td id="tax-total">$0</td></tr>
        <tr><td>Aliquota effettiva</td><td id="tax-effective">0,00%</td></tr>
      </tbody>
    </table>
    <p class="demo-note">Scaglioni demo: 5% fino a 10.000$, 10% fino a 50.000$, 15% fino a 100.000$, 20% oltre. Licenze e rifiuti prorate sui mesi indicati.</p>
  </div>`;
}

function bindTaxCalculator() {
  const income = $('#tax-income');
  const activity = $('#tax-activity');
  const months = $('#tax-months');
  if (!income || !activity || !months) return;
  const update = () => {
    const fee = TAX_ACTIVITY_FEES.find((a) => a.value === activity.value)?.fee ?? 0;
    const r = computeTaxes(Math.max(0, Number(income.value) || 0), fee, Number(months.value) || 12);
    $('#tax-income-tax').textContent = fmtMoney(r.incomeTax);
    $('#tax-licence').textContent = fmtMoney(r.licence);
    $('#tax-waste').textContent = fmtMoney(r.waste);
    $('#tax-total').textContent = fmtMoney(r.total);
    $('#tax-effective').textContent = `${r.effectiveRate.toFixed(2).replace('.', ',')}%`;
  };
  [income, activity, months].forEach((el) => el.addEventListener('input', update));
  update();
}

const PAY_UNITS = { ora: 'all’ora', settimana: 'a settimana', mese: 'al mese' };

function formatPay(e) {
  const amount = e.paga === '' || e.paga == null ? '—' : `$${Number(e.paga).toLocaleString('it-IT')}`;
  return `${amount} ${PAY_UNITS[e.unita] || ''}`.trim();
}

function employeesHtml() {
  const items = listItems('employees');
  const rows = items.map((e) => `
    <tr>
      <td>${e.foto ? `<img class="emp-thumb" src="${e.foto}" alt="Foto documenti di ${esc(e.nome)}" />` : '<span class="emp-nophoto">Nessuna foto</span>'}</td>
      <td>${esc(e.nome)}</td>
      <td>${esc(e.ruolo)}</td>
      <td>${esc(formatPay(e))}</td>
      <td style="white-space:nowrap"><button type="button" class="link-btn" data-emp-edit="${e.id}">Modifica</button> <button type="button" class="link-btn danger" data-emp-delete="${e.id}">Elimina</button></td>
    </tr>`).join('');
  return `
  <div class="pin-card emp-card">
    <div class="pin-badge">${icon('users', 22)}</div>
    <h2>Dipendenti</h2>
    <p class="pin-desc">Carica la foto dei documenti del dipendente, indica il ruolo che ricopre nell’azienda (testo libero) e la sua paga (per ora, per settimana o per mese).</p>
    <form class="crud-form emp-form" id="emp-form">
      <label>Nome e cognome <input name="nome" type="text" required maxlength="80" placeholder="Es. Mario Rossi" /></label>
      <label>Ruolo in azienda <input name="ruolo" type="text" required maxlength="80" placeholder="Es. Cassiere, Manager, Autista…" /></label>
      <div class="emp-pay-row">
        <label style="flex:1">Paga (USD) <input name="paga" type="number" min="0" step="1" inputmode="numeric" required placeholder="0" /></label>
        <label>Unità <select name="unita"><option value="ora">All’ora</option><option value="settimana">A settimana</option><option value="mese">Al mese</option></select></label>
      </div>
      <label>Foto documenti <input name="foto" type="file" accept="image/*" /></label>
      <img id="emp-preview" class="emp-preview" alt="Anteprima foto documenti" hidden />
      <button class="btn emp-submit" type="submit">Aggiungi dipendente</button>
      <button class="btn-outline emp-cancel" type="button" hidden>Annulla modifica</button>
    </form>
    ${items.length ? `<table class="cens-table"><thead><tr><th>Foto</th><th>Nome</th><th>Ruolo</th><th>Paga</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : '<p class="demo-note">Nessun dipendente registrato.</p>'}
    <p class="demo-note">Foto salvate solo su questo dispositivo (localStorage), come anteprima compressa.</p>
  </div>`;
}

async function fileToDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

function bindEmployees() {
  const form = $('#emp-form');
  if (!form) return;
  const preview = $('#emp-preview');
  const submitBtn = form.querySelector('.emp-submit');
  const cancelBtn = form.querySelector('.emp-cancel');
  let fotoDataUrl = '';
  const resetForm = () => {
    form.reset();
    delete form.dataset.editingId;
    fotoDataUrl = '';
    preview.hidden = true;
    submitBtn.textContent = 'Aggiungi dipendente';
    cancelBtn.hidden = true;
  };
  cancelBtn?.addEventListener('click', resetForm);
  const fileInput = form.elements.foto;
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) { fotoDataUrl = ''; preview.hidden = true; return; }
    if (!file.type.startsWith('image/')) { toast('Carica un file immagine', true); return; }
    try {
      fotoDataUrl = await fileToDataUrl(file);
      preview.src = fotoDataUrl;
      preview.hidden = false;
    } catch { toast('Impossibile leggere la foto', true); }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = String(data.get('nome') || '').trim();
    const ruolo = String(data.get('ruolo') || '').trim();
    const paga = String(data.get('paga') || '').trim();
    const unita = String(data.get('unita') || 'ora');
    if (!nome || !ruolo || paga === '') { toast('Compila nome, ruolo e paga', true); return; }
    const editingId = form.dataset.editingId;
    const fields = { nome, ruolo, paga, unita, foto: fotoDataUrl || '' };
    if (editingId) {
      if (!updateItem('employees', editingId, fields)) { toast('Dipendente non trovato', true); return; }
      toast('Dipendente aggiornato');
    } else {
      createItem('employees', fields);
      toast('Dipendente aggiunto');
    }
    refreshEmployees();
  });
  document.querySelectorAll('[data-emp-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = listItems('employees').find((i) => i.id === btn.getAttribute('data-emp-edit'));
      if (!item) return;
      form.elements.nome.value = item.nome || '';
      form.elements.ruolo.value = item.ruolo || '';
      form.elements.paga.value = item.paga || '';
      form.elements.unita.value = item.unita || 'ora';
      fotoDataUrl = item.foto || '';
      preview.src = fotoDataUrl;
      preview.hidden = !fotoDataUrl;
      form.dataset.editingId = item.id;
      submitBtn.textContent = 'Salva modifiche';
      cancelBtn.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.elements.nome.focus();
    });
  });
  document.querySelectorAll('[data-emp-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.armed) {
        btn.dataset.armed = '1';
        btn.textContent = 'Confermi?';
        setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = 'Elimina'; } }, 3000);
        return;
      }
      deleteItem('employees', btn.getAttribute('data-emp-delete'));
      toast('Dipendente eliminato');
      refreshEmployees();
    });
  });
}

function refreshEmployees() {
  const card = $('.emp-card');
  if (!card) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = employeesHtml();
  const next = tmp.firstElementChild;
  card.replaceWith(next);
  bindEmployees();
}

function censusListHtml(data) {
  const rows = (data.attivita || []).map((a) => `<tr><td>${esc(a.nome)}</td><td>${esc(a.titolare)}</td><td>${esc(a.stato)}</td></tr>`).join('');
  return `
  <div class="pin-card" style="max-width:48rem">
    <h2>Censimento Attività</h2>
    <p class="pin-desc">Sessione valida. Anteprima demo: in produzione qui compili chi possiede, dirige e lavora nella tua attività.</p>
    ${data.attivita?.length ? `<table class="cens-table"><thead><tr><th>Attività</th><th>Titolare</th><th>Stato</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>Nessuna attività registrata.</p>'}
    <p class="demo-note">La sessione PIN è valida per 24 ore.</p>
  </div>
  ${employeesHtml()}
  ${taxCalculatorHtml()}`;
}

function closeMobileSidebar() {
  $('#sidebar').classList.remove('mobile-open');
  document.querySelector('.mobile-backdrop')?.remove();
}
function toggleSidebar() {
  const sb = $('#sidebar');
  if (window.innerWidth < 768) {
    const open = sb.classList.toggle('mobile-open');
    if (open) {
      const b = document.createElement('div');
      b.className = 'mobile-backdrop';
      b.addEventListener('click', closeMobileSidebar);
      document.body.appendChild(b);
    } else closeMobileSidebar();
  } else sb.classList.toggle('collapsed');
}

function renderThemeIcon(theme) {
  $('#theme-btn').innerHTML = icon(theme === 'light' ? 'moon' : 'sun', 16);
  $('#theme-btn').setAttribute('aria-label', theme === 'light' ? 'Passa al tema scuro' : 'Passa al tema chiaro');
}

function setTheme(next) {
  const r = document.documentElement;
  r.classList.toggle('light', next === 'light');
  r.classList.toggle('dark', next !== 'light');
  r.style.colorScheme = next === 'light' ? 'light' : 'dark';
  try { localStorage.setItem('theme', next); } catch (e) {}
  renderThemeIcon(next);
}

function refreshAuth() {
  const user = getSession();
  const slot = $('#auth-slot');
  const privateGroup = $('#side-private');
  const lb = $('#sidebar-login');
  if (user) {
    slot.innerHTML = `<span class="user-chip"><strong>${esc(user.nome)}</strong><span class="user-role">${esc(user.grado || '')}</span><button class="link-btn" id="logout-btn" style="font-size:.75rem">Esci</button></span>`;
    if (lb) lb.style.display = 'none';
    if (privateGroup) privateGroup.style.display = '';
    $('#logout-btn').addEventListener('click', () => { sessionLogout(); toast('Accesso chiuso'); refreshAuth(); navigate('/'); });
  } else {
    slot.innerHTML = `<a class="access-btn" href="/login" data-link aria-label="Accedi">${icon('log-in', 14)}<span class="btn-label">Accedi</span></a>`;
    if (lb) lb.style.display = '';
    if (privateGroup) privateGroup.style.display = 'none';
  }
}

const paletteItems = [
  { label: 'Dashboard', href: '/', hint: 'Home' },
  { label: 'Comunicati Stampa', href: '/comunicati', hint: 'Pubblico' },
  { label: 'Censimento Attività', href: '/censimento', hint: 'PIN' },
  { label: 'Latitanti e Ricercati', href: '/bacheca-latitanti', hint: 'Pubblico' },
  { label: 'Portale Bandi', href: '/bandi', hint: 'Ingresso' },
  { label: 'Accedi', href: '/login', hint: 'Login' },
  { label: 'Panoramica (riservata)', href: '/area-riservata', hint: 'Privato' },
  { label: 'News (riservata)', href: '/area-riservata/news', hint: 'Privato' },
  { label: 'Denunce (riservata)', href: '/area-riservata/complaints', hint: 'Privato' },
  { label: 'Multe (riservata)', href: '/area-riservata/contraventions', hint: 'Privato' },
  { label: 'Avvisi di ricerca (riservata)', href: '/area-riservata/wanted', hint: 'Privato' },
  { label: 'Ufficiali (riservata)', href: '/area-riservata/officers', hint: 'Privato' },
  { label: 'Rapine (riservata)', href: '/area-riservata/robberies', hint: 'Privato' },
  { label: 'Pattuglie (riservata)', href: '/area-riservata/patrols', hint: 'Privato' },
  { label: 'Candidature (riservata)', href: '/area-riservata/applications', hint: 'Privato' },
  { label: 'Ambecebus', href: '/area-riservata/ambecebus', hint: 'Ruoli e richiami' },
  { label: 'Codici Radio', href: '/codici-radio', hint: 'Pubblico' },
  { label: 'Procedure operative', href: '/procedure', hint: 'Pubblico' },
  { label: 'Regolamento FDO', href: '/regolamento-fdo', hint: 'Pubblico' },
];
function openPalette() {
  const d = $('#palette-dialog');
  d.showModal();
  const input = $('#palette-input');
  const list = $('#palette-list');
  input.value = '';
  const paint = () => {
    const q = input.value.trim().toLowerCase();
    const filtered = paletteItems.filter((i) => i.label.toLowerCase().includes(q));
    list.innerHTML = filtered.map((i, ix) => `<button type="button" data-href="${i.href}" class="${ix === 0 ? 'sel' : ''}"><span>${esc(i.label)}</span><span class="hint">${esc(i.hint)}</span></button>`).join('') || '<p style="padding:1rem;font-size:.875rem;color:hsl(var(--muted-foreground))">Nessun risultato.</p>';
    list.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const href = b.dataset.href;
      d.close();
      if (href.startsWith('/api/')) window.location.assign(href);
      else navigate(href);
    }));
  };
  input.oninput = paint;
  paint();
  input.focus();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href.startsWith('/api/')) return;
  e.preventDefault();
  navigate(href);
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape') closeMobileSidebar();
});
window.addEventListener('popstate', () => render(location.pathname));
$('#sidebar-trigger').addEventListener('click', toggleSidebar);
$('#theme-btn').addEventListener('click', () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));
$('#search-btn').addEventListener('click', openPalette);
$('#disclaimer-btn').addEventListener('click', () => $('#disclaimer-dialog').showModal());

setTheme(localStorage.getItem('theme') || 'dark');
render(location.pathname);
refreshAuth();
