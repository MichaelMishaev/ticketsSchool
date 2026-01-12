#!/bin/bash
# Simulate Railway environment
export PORT=8080
export NODE_ENV=production
export DATABASE_URL="postgresql://test:test@localhost:5432/test"

echo "Testing with Railway-like environment..."
docker run --rm -d \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL="$DATABASE_URL" \
  --name railway-test \
  ticketschool-test2

echo "Waiting for startup..."
sleep 10

echo -e "\n=== Container Logs ==="
docker logs railway-test

echo -e "\n=== Testing Health Check ==="
for i in {1..3}; do
  echo "Attempt $i:"
  curl -v http://localhost:8080/api/health 2>&1 | grep -E "(HTTP|Connected|Connection refused)"
  sleep 2
done

docker stop railway-test
