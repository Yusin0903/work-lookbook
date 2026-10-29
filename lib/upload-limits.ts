// 單次表單送出的請求大小上限(所有檔案加總)。
// 需與 next.config.ts 的 proxyClientMaxBodySize / serverActions.bodySizeLimit 保持一致。
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export function checkUploadSize(files: File[]): string | undefined {
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_UPLOAD_BYTES) {
    return `選擇的檔案總大小為 ${(total / 1024 / 1024).toFixed(1)}MB,超過單次上傳上限 ${MAX_UPLOAD_MB}MB,請減少檔案或分次上傳。`;
  }
}
