import sharp from "sharp";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

// Long enough for full-width display without wasting storage on resolutions
// no viewer will ever see at full size.
const MAX_IMAGE_DIMENSION = 2000;
const IMAGE_QUALITY = 85;

export interface PreparedMedia {
  type: "IMAGE" | "VIDEO";
  buffer: Buffer;
  contentType: string;
  extension: string;
  size: number;
}

export async function prepareMedia(files: File[]): Promise<PreparedMedia[]> {
  const prepared: PreparedMedia[] = [];

  for (const file of files) {
    if (IMAGE_TYPES.has(file.type)) {
      const original = Buffer.from(await file.arrayBuffer());

      // Animated GIFs lose their animation if naively recompressed; leave them as-is.
      if (file.type === "image/gif") {
        prepared.push({ type: "IMAGE", buffer: original, contentType: file.type, extension: "gif", size: original.length });
        continue;
      }

      const compressed = await sharp(original)
        .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer();

      prepared.push({ type: "IMAGE", buffer: compressed, contentType: "image/webp", extension: "webp", size: compressed.length });
    } else if (VIDEO_TYPES.has(file.type)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.type.split("/")[1]?.replace("quicktime", "mov") ?? "bin";
      prepared.push({ type: "VIDEO", buffer, contentType: file.type, extension, size: buffer.length });
    }
  }

  return prepared;
}
