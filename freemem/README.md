# freemem — OpenRouter free models (aggiornato live)

> Integrazione conoscenza modelli gratuiti OpenRouter, consultabile localmente.
> **Nessuna API key committata in questo repo.** La chiave va passata solo via env var `OPENROUTER_API_KEY`.

## Stato chiave (testato via terminale)

- Endpoint `GET /auth/key` → `is_free_tier: true`, `limit $10`, `spent $0`.
- Label `sk-or-v1-528...e87`, usage 0 al test.
- Parallelo: 3 chiamate `chat/completions` lanciate con `&` + `wait` in bash.

## Modelli gratis (17, live da `/models`)

- `baidu/ernie-5.5-flash-preview:free` — ctx 1.024.000
- `cohere/north-mini-code:free` — ctx 256.000
- `dots-studio/dots-3-note-preview:free` — ctx 512.000
- `google/gemma-4-26b-a4b-it:free` — ctx 262.144 (noto rate-limit 429 upstream, retry)
- `google/gemma-4-31b-it:free` — ctx 262.144
- `google/lyria-3-clip-preview` — ctx 1.048.576 (free tier)
- `google/lyria-3-pro-preview` — ctx 1.048.576 (free tier)
- `inclusionai/ling-3.2-flash:free` — ctx 1.048.576
- `liquid/lfm-3-1.7b:free` — ctx 262.144 (test parallelo OK)
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` — ctx 256.000
- `nvidia/nemotron-3-ultra-550b-a55b:free` — ctx 1.000.000
- `nvidia/nemotron-3.5-lightning:free` — ctx 1.000.000
- `nvidia/nemotron-3.5-super-vl:free` — ctx 1.000.000
- `openrouter/free` — router gratis, ctx 200.000
- `particles-ai/particle-1:free` — ctx 1.048.576 (endpoint non valido al test → 400)
- `recursive/flint-v1.0:free` — ctx 262.144
- `thinkingmachines/inkling-2-small:free` — ctx 1.048.576 (bloccato per region → 403)

Lista completa raw in `models-all.json`, solo free in `models-free.json`.

## Uso parallelo (subagent via terminale)

```sh
export OPENROUTER_API_KEY=sk-or-v1-...   # mai committare
bash freemem/ask-parallel.sh "Rispondi solo: OK"
# oppure modello singolo:
bash freemem/ask-parallel.sh "Riassumi APMS in 2 righe" liquid/lfm-3-1.7b:free
```

Vedi `ask-parallel.sh`. Nota: i modelli free sono flaky (429 rate-limit, 403 region, `content: null` con `reasoning` per modelli thinking) → usa `max_tokens >= 100`, retry, e più modelli in parallelo come voter.

## Avvisi

- La chiave in chat è esposta → ruotala se la usi in pubblico.
- `models-all.json` è snapshot live, rigenerabile con `curl https://openrouter.ai/api/v1/models`.
- Questo progetto resta senza test automatici su richiesta utente: i free models sono per **pre-testo/parere parallelo**, non sostituti del test manuale umano.
