#!/usr/bin/env bash
set -euo pipefail

# scripts/create-env-from-envvars.sh
# Genera un archivo .env a partir de las variables de entorno disponibles en el entorno
# (por ejemplo: Codespaces, Actions o un contenedor de desarrollo).
# No almacena secretos en el repositorio; debe ejecutarse en el entorno donde las variables
# ya están presentes como Secrets.

OUT=".env"

if [ "${1:-}" = "--force" ]; then
  FORCE=true
else
  FORCE=false
fi

if [ -f "$OUT" ] && [ "$FORCE" = false ]; then
  echo "ERROR: $OUT ya existe. Para sobrescribir usa: ./scripts/create-env-from-envvars.sh --force"
  exit 1
fi

# Helper: devuelve el valor de la variable o imprime una advertencia si no existe
env_or_warn() {
  local var_name="$1"
  local val="${!var_name-}"
  if [ -z "$val" ]; then
    echo "ADVERTENCIA: la variable de entorno $var_name no está definida. El .env contendrá un valor vacío para esta variable."
  fi
  printf "%s" "$val"
}

SHOPIFY_API_KEY=$(env_or_warn SHOPIFY_API_KEY)
SHOPIFY_API_SECRET=$(env_or_warn SHOPIFY_API_SECRET)
SHOPIFY_ACCESS_TOKEN=$(env_or_warn SHOPIFY_ACCESS_TOKEN)
SHOP=$(env_or_warn SHOP)
SCOPES="${SCOPES:-write_orders,read_orders,write_draft_orders,read_products,read_locations,read_inventory}"
CLIP_API_KEY="${CLIP_API_KEY:-pendiente}"
CLIP_MERCHANT_ID="${CLIP_MERCHANT_ID:-pendiente}"
CLIP_SANDBOX_MODE="${CLIP_SANDBOX_MODE:-true}"

# Escribe el archivo .env (los valores provienen de las variables de entorno)
cat > "$OUT" <<EOF
SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET}
SHOPIFY_ACCESS_TOKEN=${SHOPIFY_ACCESS_TOKEN}
SHOP=${SHOP}
SCOPES=${SCOPES}
CLIP_API_KEY=${CLIP_API_KEY}
CLIP_MERCHANT_ID=${CLIP_MERCHANT_ID}
CLIP_SANDBOX_MODE=${CLIP_SANDBOX_MODE}
EOF

# Restringe permisos del archivo
chmod 600 "$OUT"

echo "Archivo $OUT creado correctamente (permisos 600). No subas este archivo al repositorio."
