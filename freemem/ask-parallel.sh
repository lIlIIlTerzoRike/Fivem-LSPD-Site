#!/bin/bash
# freemem/ask-parallel.sh — subagent paralleli via OpenRouter free models
# Uso: OPENROUTER_API_KEY=sk-or-v1-... bash freemem/ask-parallel.sh "prompt"
#      bash freemem/ask-parallel.sh "prompt" liquid/lfm-3-1.7b:free
# Mai committare la chiave: la legge solo da env var.
set -u
PROMPT="${1:-Rispondi solo: OK}"
KEY="${OPENROUTER_API_KEY:-}"
if [ -z "$KEY" ]; then echo "Manca OPENROUTER_API_KEY (export ...). Non committare la chiave."; exit 1; fi

ask() {
  local model="$1"
  echo "=== $model ==="
  curl -s -X POST https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}],\"max_tokens\":100}" \
    | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('choices',[{}])[0].get('message',{}).get('content') if d.get('choices') else 'ERR:'+str(d.get('error'))[:300])"
}

if [ "${2:-}" ]; then ask "$2"; exit 0; fi

# Parallelo: 3 modelli free diversi
ask "liquid/lfm-3-1.7b:free" &
ask "cohere/north-mini-code:free" &
ask "baidu/ernie-5.5-flash-preview:free" &
wait
echo "FINISH"
