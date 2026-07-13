#!/usr/bin/env bash
# One-time bootstrap: issues the first real Let's Encrypt cert for DOMAIN.
# Run this once, on the EC2 instance, before the first `docker compose up`.
# Renewals afterwards are handled automatically by the certbot service in
# docker-compose.yml.
#
# Usage: ./init-letsencrypt.sh you@example.com

set -euo pipefail

if [ ! -f .env.production ]; then
  echo "Error: .env.production not found. Copy .env.example to .env.production and fill it in first." >&2
  exit 1
fi

EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
  echo "Usage: $0 you@example.com" >&2
  exit 1
fi

DOMAIN=$(grep -E '^DOMAIN=' .env.production | cut -d '=' -f2-)
if [ -z "$DOMAIN" ]; then
  echo "Error: DOMAIN= is not set in .env.production" >&2
  exit 1
fi

DATA_PATH="./certbot"
RSA_KEY_SIZE=4096

echo "### Creating dummy certificate for $DOMAIN so nginx can start ..."
mkdir -p "$DATA_PATH/conf/live/$DOMAIN" "$DATA_PATH/www"
docker run --rm \
  -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  --entrypoint openssl certbot/certbot \
  req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
  -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
  -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
  -subj "/CN=localhost"

echo "### Starting nginx (serving the dummy cert for now) ..."
docker compose --env-file .env.production up -d app nginx

echo "### Deleting dummy certificate ..."
rm -rf "$DATA_PATH/conf/live/$DOMAIN" "$DATA_PATH/conf/archive/$DOMAIN" "$DATA_PATH/conf/renewal/$DOMAIN.conf"

echo "### Requesting real Let's Encrypt certificate for $DOMAIN ..."
docker run --rm \
  -v "$(pwd)/$DATA_PATH/conf:/etc/letsencrypt" \
  -v "$(pwd)/$DATA_PATH/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" -d "$DOMAIN" \
  --rsa-key-size $RSA_KEY_SIZE --agree-tos --no-eff-email --force-renewal

echo "### Reloading nginx with the real certificate ..."
docker compose --env-file .env.production exec nginx nginx -s reload

echo "### Done. Starting the certbot renewal sidecar ..."
docker compose --env-file .env.production up -d certbot

echo "Visit https://$DOMAIN to confirm it's live."
