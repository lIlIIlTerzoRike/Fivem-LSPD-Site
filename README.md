# APMS: Los Santos Police Department (replica)

Recreazione front-end di **APMS v3.1** (Advanced Police Management System,
lspdb.it) a partire dall'analisi REA della superficie pubblica.

## Fedeltà per rotta

Confronto fatto a 1440×900 e 390×844, in tema scuro e chiaro, con screenshot
reali dell'originale e del clone messi a confronto a vista e misurati sul DOM
(font-size, line-height, letter-spacing, box, colori, spaziature).

| Rotta | Stato | Note |
|---|---|---|
| `/` | **Fedele + motion** | Sidebar, topbar, hero con crest 128, tre card e footer hanno gli stessi testi, ordine, misure e colori dell'originale. Unica differenza voluta: il credito nel footer riporta `@.aiden_pearce.` invece dell'handle dello sviluppatore originale. Aggiunte animate su richiesta (ispirate a preymaker.com, senza copiarne asset o contenuti): sfondo ambientale con gradiente blu/oro che deriva lentamente dietro l'hero, striscia ticker con le parole del dipartimento e riflesso luminoso sulle card in hover. |
| `/comunicati` | **Fedele** | Testata centrata con crest 72, kicker 11 px tracciato, h1 36 px, divisore e stato vuoto con icona in cerchio. |
| `/bacheca-latitanti` | **Fedele** | Come sopra più la riga finale "Alto Comando Los Santos Police Department". |
| `/censimento` | **Adattata** | Testata, card e PIN a 4 caselle riproducono l'originale (448×366, icone e spaziature identiche). Il backend reale non è disponibile: la verifica è demo (`1234`) e sotto la card compare una nota "Ambiente demo" che l'originale non ha. La nota è fuori dalla card per non alterarne le dimensioni. Il testo originale con l'apostrofo (`attivita'`) è mantenuto identico. |
| `/bandi` | **Portale Bandi** | Pagina pubblica con modulo candidatura (nome, contatto, motivazione, esperienza RP opzionale); le candidature sono visibili in Area riservata → Candidature. |
| `/pagina-inesistente` (404) | **Fedele** | Strisce gialle inclinate, icona `map-pin-off` in cerchio 80 px, badge "10-20", h1 36 px tracciato 4.32 px, lista `dl`, pulsanti "Indietro" e "Torna alla dashboard". Il timestamp è in formato `it-IT`, come l'originale. |
| `/api/oauth/login` | **Adattata** | L'originale rimanda a `discord.com/oauth2/authorize` (client `1335891472020668466`). Qui c'è una pagina di consenso locale che mostra scope, client id e redirect: senza client secret e redirect registrato il flusso Discord reale non è riproducibile. |
| Stato autenticato | **Adattata** | Il chip con nome, grado e "Esci" sostituisce il pulsante "Accedi". Non è stato possibile osservarlo sull'originale (richiede un account Discord autorizzato). |
| `/login` e `/area-riservata/*` | **Adattata** | Area riservata costruita dallo schema del vecchio pannello `lspd-panel/` (SQL 2020) e dal Manuale Interno: News, Denunce, Multe (infrazioni + catalogo), Avvisi di ricerca, Ufficiali, Rapine, Pattuglie, Candidature, Ambecebus (ruoli, richiami, circolari, documenti e account). Login con credenziali demo e sessione lato client, CRUD persistito in `localStorage` con creazione, modifica, eliminazione e ricerca nelle liste. Non replica nessuna schermata dell'originale: è un pannello demo privo di backend. |

Scostamenti noti e accettati:

- Il font è **Geist** (variabile), lo stesso dell'originale; è self-hosted perché la build non ha accesso al CDN di Next.js.
- Il crest del brand è servito a 32 px come nell'originale, il crest dell'hero a 256 px (resa 128 px).
- Le dimensioni restano entro pochi pixel dall'originale (footer 42 px, card 92 px, card PIN 366 px, card 404 588/593 px).

## Rotte

| Rotta | Comportamento |
|---|---|
| `/` | Dashboard con 3 card (Comunicati, Latitanti, Bandi) |
| `/comunicati` | Comunicati Stampa; mostra le News create in area riservata, altrimenti stato vuoto |
| `/bacheca-latitanti` | Latitanti e Ricercati; mostra gli Avvisi di ricerca creati in area riservata, altrimenti stato vuoto |
| `/censimento` | Gate PIN a 4 caselle, sessione demo 10 min + scheda dipendenti (foto documenti con anteprima, ruolo a testo libero, paga all'ora/a settimana/al mese) + calcolatore tasse demo (imposta progressiva sul reddito, licenza per tipo di attività, tassa rifiuti prorata) |
| `/bandi` | Form candidatura pubblica → sezione riservata Candidature (salvataggio in `localStorage`, demo) |
| `/login` | Form di accesso demo (FDO `agente.demo`/`demo123`; account AMBECEBUS `admin`/`admin123`, `governatore`/`demo123`, `fib.demo`/`demo123`, `cid.demo`, `cia.demo`, `funzionario.demo`, `recluta.demo`) |
| `/area-riservata` | Panoramica con conteggi e collegamenti alle sezioni |
| `/area-riservata/news` | News: elenco, creazione, eliminazione (titolo, descrizione, data) |
| `/area-riservata/complaints` | Denunce (motivo, vittima, testimoni, sospettato, data, ora) |
| `/area-riservata/contraventions` | Multe: infrazioni emesse (infrazione, ufficiale, destinatario, importo, data) + catalogo ammende (nome, categoria, prezzo) |
| `/area-riservata/wanted` | Avvisi di ricerca (persona ricercata, ufficiale, data) |
| `/area-riservata/officers` | Ufficiali (username, grado, data di entrata) |
| `/area-riservata/robberies` | Rapine: numeri ufficiali per tipo dal Regolamento VYCE RP §9.1 (Negozietto, Fleeca, Gioielleria, Blaine, Pacific), precompilata, CRUD completo |
| `/regolamento-fdo` | Regolamento Forze dell'Ordine dal Regolamento VYCE RP §§4–4.2, 7.3, 9.1 (ingaggio, assalto convoglio, permajail, PDB, numeri rapine) |
| `/codici-radio` | Tabella rapida Ten Code / Status Code / Car Code dal Manuale Interno LSPD §5 (testi rielaborati) |
| `/procedure` | Riepilogo operativo delle procedure del Manuale Interno §§0–51 in forma rielaborata (requisiti, Miranda, arresto, fermo, 10.80, 10.11, 10.10, 10.99, 10-55, 10-60, sequestro, zona interdetta, felony stop, perquisizioni, avvocato, rilascio documenti, panic button, Discord/APMS, radio e icone, permessi e ferie, uso della forza, manovre PIT/box/T/Double T, matricola, reati penali, compilazione rapporto e rinvio a processo, multe vs sanzioni, pene pecuniarie e detentive, armadietto prove, correzione rapporti, cauzione e cavigliera, calcolo classe A, mandati, linea rossa, gerarchia e patch, promozioni, aspetto e bodycam, reparti e brevetti, gestione detenuti, provvedimenti disciplinari, centrale operativa, sanzioni rapine/furti, rilascio/rinnovo porto d'armi, rilascio taser e ritiro licenze, denunce e interrogatori, equipaggiamento e ore minime, stati FPCON e DEFCON, protocolli Return 0/Potus/Foxtrot, soggetti trattenuti, porto caccia) — niente trascrizione integrale per l'avviso di copyright del documento |
| `/area-riservata/patrols` | Pattuglie (Mary, Lincoln, Stradale/HSU, Eagle) con composizione e requisiti dal Manuale §4, CRUD precompilato |
| `/area-riservata/ambecebus` | AMBECEBUS: ruoli per sezione (FDO, Governo, CID, FIBA, CIA, Funzionari + Governatore/FIB), richiami con annullamento senza rimozione, circolari per sezione, documenti e leggi con aggiunta account, visione federale per Governatore/FIB/Admin, gestione account solo per Admin |
| qualsiasi altra | 404 "LSPD · AREA DELIMITATA" |

Le rotte `/area-riservata/*` sono protette: senza sessione attiva redirigono a `/login`.

## API (in `worker/mockApi.js`)

Lo stesso modulo serve il Worker su Sites e il dev server Vite, tramite il plugin in `vite.config.js`. Quindi PIN e pagina di consenso Discord funzionano anche in locale. L'area riservata, invece, **non usa queste API**: è interamente lato client.

- `GET /api/oauth/session` → sessione anonima osservata, o ufficiale demo se il cookie è presente
- `GET /api/oauth/login` → pagina di autorizzazione; `?code=demo` imposta il cookie di sessione e torna a `/`
- `GET /api/oauth/logout` → chiude la sessione
- `GET /api/censimento` → `401 {"message":"Accesso scaduto: inserisci di nuovo il PIN"}` senza sessione PIN
- `POST /api/censimento/verify {"pin":"1234"}` → apre la sessione PIN

## Area riservata (lato client)

- Login con credenziali demo: `agente.demo` / `demo123`. La sessione è salvata in `localStorage` (`apms_session_v1`) con scadenza 30 giorni.
- CRUD persistito in `localStorage` (`apms_store_v1`). I dati non escono dal browser e si cancellano svuotando il sito.
- Sezioni e campi mappati dalle tabelle dello schema `lspd-panel/lspd_panel.sql` (`news`, `complaints`, `contravention`, `fines`, `wanted_notice`, `users`): il vecchio pannello PHP del 2020 **non è stato riusato** — aveva password in chiaro, query non preparate e config nel webroot.
- Le News create qui appaiono in `/comunicati`; gli Avvisi di ricerca in `/bacheca-latitanti`. Senza dati, le pagine pubbliche mostrano lo stato vuoto originale.
- `lspd-panel/` resta nel repo solo come riferimento alla struttura dati: non va mai esposto in produzione.

## Demo

- Login area riservata: `agente.demo` / `demo123` su `/login`. "Esci" chiude la sessione.
- PIN censimento: `1234`, valido 24 ore. Login area riservata: sessione di 30 giorni.
- Accesso reale con Discord: richiede un client OAuth tuo (`DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`) e un redirect registrato. Questa build non li include.

## Asset e licenze

- **Crest** (`public/lspd-crest.webp`, `lspd-badge-32.png`, `lspd-icon.png`, `favicon-32.png`, `lspd-og.png`): ricavato dal file `/lspd.webp` servito da lspdb.it, ridimensionato. In precedenza veniva usata l'immagine `LSPD_LOGO.PNG` del repo [nghiadz1997/lspd](https://github.com/nghiadz1997/lspd/tree/main/images), che è un crest diverso da quello in produzione.
- **Nessuna delle due fonti dichiara una licenza**: il materiale resta dei rispettivi titolari. Il crest è fan art legata a GTA V e al ruolo LSPD. Se pubblichi il sito, verifica di averne diritto o sostituiscilo con un'immagine tua.
- **Font Geist**: SIL Open Font License 1.1, testo in `public/fonts/OFL.txt`. Il file `geist-variable.woff2` è lo stesso servito dall'originale.
- **Icone**: set Lucide (ISC), path copiati dall'originale.

## Run

```sh
npm install
npm run dev
```

Build: `npm run build` → deploy con `deploy.json` (Freebuff Sites).
