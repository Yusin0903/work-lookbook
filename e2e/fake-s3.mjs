// Minimal path-style S3 stand-in for the e2e suite: just enough of
// PutObject / GetObject / DeleteObject for lib/r2.ts, with no dependencies.
// Usage: node e2e/fake-s3.mjs <port> <directory> <bucket>
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [port, directory, bucket] = process.argv.slice(2);
if (!port || !directory || !bucket) {
  console.error("usage: node e2e/fake-s3.mjs <port> <directory> <bucket>");
  process.exit(1);
}
await mkdir(directory, { recursive: true });

// Streaming uploads arrive as "<hex size>;chunk-signature=...\r\n<data>\r\n" frames.
function decodeAwsChunked(buffer) {
  const parts = [];
  let offset = 0;
  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf("\r\n", offset);
    if (lineEnd === -1) break;
    const size = parseInt(buffer.subarray(offset, lineEnd).toString().split(";")[0], 16);
    if (!size) break;
    parts.push(buffer.subarray(lineEnd + 2, lineEnd + 2 + size));
    offset = lineEnd + 2 + size + 2;
  }
  return Buffer.concat(parts);
}

function objectPath(key) {
  return join(directory, encodeURIComponent(key));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const [, requestBucket, ...rest] = url.pathname.split("/");
  const key = decodeURIComponent(rest.join("/"));

  if (requestBucket !== bucket) {
    res.writeHead(404).end();
    return;
  }
  if (!key) {
    res.writeHead(200, { "content-type": "application/xml" }).end("<ListBucketResult/>");
    return;
  }

  try {
    if (req.method === "PUT") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      let body = Buffer.concat(chunks);
      const encoding = `${req.headers["content-encoding"] ?? ""} ${req.headers["x-amz-content-sha256"] ?? ""}`;
      if (/aws-chunked|STREAMING/i.test(encoding)) body = decodeAwsChunked(body);
      await writeFile(objectPath(key), body);
      await writeFile(`${objectPath(key)}.type`, req.headers["content-type"] ?? "application/octet-stream");
      const etag = `"${createHash("md5").update(body).digest("hex")}"`;
      res.writeHead(200, { etag }).end();
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      const [body, type] = await Promise.all([
        readFile(objectPath(key)),
        readFile(`${objectPath(key)}.type`, "utf8"),
      ]);
      res.writeHead(200, { "content-type": type, "content-length": body.length });
      res.end(req.method === "GET" ? body : undefined);
      return;
    }
    if (req.method === "DELETE") {
      await rm(objectPath(key), { force: true });
      await rm(`${objectPath(key)}.type`, { force: true });
      res.writeHead(204).end();
      return;
    }
    res.writeHead(405).end();
  } catch {
    res.writeHead(404).end();
  }
});

server.listen(Number(port), "0.0.0.0");
