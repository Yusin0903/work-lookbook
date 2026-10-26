#!/bin/bash
# Brings up the test dependencies (fake R2 + a clean schema) before the
# webServer command starts the app. Playwright's own webServer/globalSetup
# ordering runs webServer before globalSetup, so this has to happen inline
# in the webServer command instead of in a globalSetup hook.
set -euo pipefail

rm -rf "$TEST_S3_DIR"
mkdir -p "$TEST_S3_DIR"

node_modules/.bin/s3rver \
  --port "$TEST_S3_PORT" \
  --address 0.0.0.0 \
  --directory "$TEST_S3_DIR" \
  --configure-bucket "$R2_BUCKET" \
  --silent &

for _ in $(seq 1 50); do
  curl -sf "http://localhost:${TEST_S3_PORT}/${R2_BUCKET}" >/dev/null 2>&1 && break
  sleep 0.2
done

npx prisma migrate reset --force
