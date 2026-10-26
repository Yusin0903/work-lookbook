import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_URL &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(file: Buffer, contentType: string, extension: string) {
  const key = `${randomUUID()}.${extension}`;
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );
  const url = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  return { key, url };
}

export async function deleteFromR2(key: string) {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
}
