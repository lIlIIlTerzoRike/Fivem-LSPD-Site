#!/bin/bash
# freemem/parallel-usage-test.sh
# Tutti i modelli free usano l'app IN PARALLELO come 17 utenti con ruoli diversi.
# Uso: OPENROUTER_API_KEY=sk-or-v1-... bash freemem/parallel-usage-test.sh
set -u
KEY="${OPENROUTER_API_KEY:-}"
if [ -z "$KEY" ]; then echo "Manca OPENROUTER_API_KEY"; exit 1; fi
OUT="freemem/parallel-results-$(date +%s).txt"
echo "Risultati in $OUT" > "$OUT"

# model|ruolo|task
TASKS=(
"baidu/ernie-5.5-flash-preview:free|Recluta|Prova /bandi: compili nome, contatto, motivazione. Dimmi 1 bug UX o ansia da abbandono."
"cohere/north-mini-code:free|Agente|Prova login demo agente.demo/demo123 e CRUD news. Dimmi 1 fregatura in main.js."
"dots-studio/dots-3-note-preview:free|Cittadino|Prova /censimento PIN 1234 e calcolatore tasse. Dimmi se capisci il flusso."
"google/gemma-4-26b-a4b-it:free|Lettrice|Prova /comunicati e /bacheca-latitanti vuote. Dimmi se lo stato vuoto è chiaro."
"google/gemma-4-31b-it:free|Ufficiale|Prova sezione Multe (contraventions+fines). Che campi mancano secondo te?"
"inclusionai/ling-3.2-flash:free|ReclutaMobile|Prova sidebar mobile 390px e theme toggle. Dimmi 1 attrito."
"liquid/lfm-3-1.7b:free|TesterRapido|Fai finta di cliccare tutto in 30 secondi. Qual è la prima cosa che confonde?"
"nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free|Agente|Valuta CRUD localStorage: cosa si perde cambiando PC? Proponi fix in 1 riga."
"nvidia/nemotron-3-ultra-550b-a55b:free|Comando|Review architettura APMS (main.js 1619 righe, store, session). 3 rischi critici in 3 righe."
"nvidia/nemotron-3.5-lightning:free|Ufficiale|Prova Rapine e Pattuglie precompilate. Numeri e requisiti ti sembrano RP credibili?"
"nvidia/nemotron-3.5-super-vl:free|OcchioUI|Immagina dashboard VYCE PD. Dimmi 3 cose che guarderesti per primo come giocatore."
"openrouter/free|Cittadino|Prova 404 con strisce gialle. Ti blocca o ti fa tornare al menu?"
"recursive/flint-v1.0:free|Admin|Prova AMBECEBUS: ruoli, richiami, circolari. Quale permesso è troppo largo?"
"google/lyria-3-clip-preview|GenZ|Prova hero animato + ticker. Dimmi se è troppo o ha stile."
"google/lyria-3-pro-preview|Redattore|Valuta testi Procedure/Codici Radio/Regolamento FDO. Sono chiari per un nuovo?"
"particles-ai/particle-1:free|Ospite|Entra la prima volta: homepage APMS, non sai nulla di RP. Cosa fai nei primi 10 secondi?"
"thinkingmachines/inkling-2-small:free|Ragionatore|Trova 2 bug logici del mock API (OAuth, PIN). Solo bullet point."
)

ask() {
  local model="$1" role="$2" task="$3"
  local safe; safe=$(echo "$model" | tr '/' '_' | tr ':' '_')
  curl -s -X POST https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"system\",\"content\":\"Sei un utente RP che usa APMS VYCE PD. Rispondi in italiano, 3 righe max, niente preamboli.\"},{\"role\":\"user\",\"content\":\"Ruolo: $role. $task\"}],\"max_tokens\":120}" \
    | python -c "import sys,json; d=json.load(sys.stdin); r=d.get('choices',[{}])[0].get('message',{}) if d.get('choices') else {}; c=r.get('content') or r.get('reasoning') or 'ERR:'+str(d.get('error'))[:250]; open('freemem/.tmp-$safe.txt','w',encoding='utf-8').write(f\"=== $model [$role] ===\n\"+str(c)+\"\n\")" 2>&1
}

for t in "${TASKS[@]}"; do
  IFS='|' read -r m r tk <<< "$t"
  ask "$m" "$r" "$tk" &
done
wait

# Aggrega in ordine
for t in "${TASKS[@]}"; do
  IFS='|' read -r m r tk <<< "$t"
  safe=$(echo "$m" | tr '/' '_' | tr ':' '_')
  if [ -f "freemem/.tmp-$safe.txt" ]; then cat "freemem/.tmp-$safe.txt" >> "$OUT"; rm "freemem/.tmp-$safe.txt"; else echo "=== $m [$r] === NO OUTPUT" >> "$OUT"; fi
done
echo "DONE -> $OUT"
cat "$OUT"
