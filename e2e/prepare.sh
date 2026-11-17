#!/bin/bash
# Brings up the test dependencies (fake R2 + a clean schema) before the
# webServer command starts the app. Playwright's own webServer/globalSetup
# ordering runs webServer before globalSetup, so this has to happen inline
# in the webServer command instead of in a globalSetup hook.
set -euo pipefail

rm -rf "$TEST_S3_DIR"
mkdir -p "$TEST_S3_DIR"

node e2e/fake-s3.mjs "$TEST_S3_PORT" "$TEST_S3_DIR" "$R2_BUCKET" &

for _ in $(seq 1 50); do
  curl -sf "http://localhost:${TEST_S3_PORT}/${R2_BUCKET}" >/dev/null 2>&1 && break
  sleep 0.2
done

npx prisma migrate reset --force
