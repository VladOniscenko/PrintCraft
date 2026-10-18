#!/usr/bin/env bash
set -e

COMPOSE_FILE="docker-compose.yml"
if [ "$1" == "--prod" ] || [ "$PROD" == "1" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
elif [ -f "docker-compose.prod.yml" ] && docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "printcraft"; then
  COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "=========================================================="
echo " Running PrintCraft Database Seeder (Force Overwrite)"
echo " Compose file: $COMPOSE_FILE"
echo "=========================================================="

# 1. If printcraft-api is already running, execute seeder directly inside it
if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -E "printcraft-api.*(Up|running)"; then
  echo "==> Detected running printcraft-api container. Executing seeder..."
  docker compose -f "$COMPOSE_FILE" exec -e SEED_FORCE_RELOAD=true printcraft-api dotnet PrintCraftApi.dll --seed --force
  echo "==> Done! Database seeded and overwritten."
  exit 0
fi

# 2. Otherwise run via dedicated seeder container with build
docker compose -f "$COMPOSE_FILE" run --rm --build -e SEED_FORCE_RELOAD=true -e FORCE_SEED=true seeder dotnet PrintCraftApi.dll --seed --force
echo "==> Done! Database seeded and overwritten."
