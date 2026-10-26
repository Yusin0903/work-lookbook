export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://lookbook:lookbook@localhost:55433/lookbook_test?schema=public";

export const TEST_S3_PORT = "54569";
export const TEST_S3_BUCKET = "lookbook-test";
export const TEST_S3_DIR = "/tmp/lookbook-e2e-s3";

export const TEST_ADMIN_USERNAME = "admin";
export const TEST_ADMIN_PASSWORD = "test-password";

export const testEnv = {
  DATABASE_URL: TEST_DATABASE_URL,
  TEST_S3_PORT,
  TEST_S3_DIR,
  R2_ENDPOINT: `http://localhost:${TEST_S3_PORT}`,
  R2_ACCOUNT_ID: "test",
  R2_ACCESS_KEY_ID: "S3RVER",
  R2_SECRET_ACCESS_KEY: "S3RVER",
  R2_BUCKET: TEST_S3_BUCKET,
  R2_PUBLIC_URL: `http://localhost:${TEST_S3_PORT}/${TEST_S3_BUCKET}`,
  ADMIN_USERNAME: TEST_ADMIN_USERNAME,
  ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
  SESSION_SECRET: "e2e-test-session-secret-at-least-32-characters-long",
};
