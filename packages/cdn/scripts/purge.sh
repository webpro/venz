#!/bin/bash
set -euo pipefail

ZONE_ID="b936d96af11100f2e414b58a48b75054"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "error: CLOUDFLARE_API_TOKEN is not set" >&2
  echo "create one at https://dash.cloudflare.com/profile/api-tokens with 'Zone > Cache Purge > venz.dev'" >&2
  exit 1
fi

curl -fsS -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache"
echo
