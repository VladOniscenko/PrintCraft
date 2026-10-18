#!/usr/bin/env bash
set -e

# Default to docker-compose.yml, or use docker-compose.prod.yml if --prod flag is passed
COMPOSE_FILE="docker-compose.yml"
if [ "$1" == "--prod" ] || [ "$PROD" == "1" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "=========================================================="
echo " Running PrintCraft Database Seeder (Force Overwrite)"
echo " Compose file: $COMPOSE_FILE"
echo "=========================================================="

docker compose -f "$COMPOSE_FILE" run --rm --build seeder

