"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToR2, deleteFromR2, r2Configured } from "@/lib/r2";
import { prepareMedia } from "@/lib/media";

// R2's free tier is 10GB; default to a bit under that so normal usage never
// crosses into billed storage by accident.
const DEFAULT_STORAGE_LIMIT_BYTES = 9 * 1024 ** 3;

function storageLimitBytes() {
  const parsed = Number(process.env.R2_STORAGE_LIMIT_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STORAGE_LIMIT_BYTES;
}

async function checkStorageLimit(incomingBytes: number) {
  const { _sum } = await prisma.media.aggregate({ _sum: { size: true } });
  const used = _sum.size ?? 0;
  const limit = storageLimitBytes();
  if (used + incomingBytes > limit) {
    const usedGb = (used / 1024 ** 3).toFixed(2);
    const limitGb = (limit / 1024 ** 3).toFixed(2);
    return `儲存空間即將超過上限(目前已用 ${usedGb}GB,上限 ${limitGb}GB),請先刪除一些舊媒體再上傳。`;
  }
  return null;
}

export async function login(formData: FormData) {
  const username = formData.get("username")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return { error: "帳號或密碼錯誤" };
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

async function requireAdmin() {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }
}

export async function createWork(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  if (!title) {
    return { error: "請輸入標題" };
  }

  if (!r2Configured()) {
    return { error: "尚未設定 R2 環境變數,請先完成設定" };
  }

  const files = formData.getAll("media").filter((f): f is File => f instanceof File && f.size > 0);
  const prepared = await prepareMedia(files);

  const limitError = await checkStorageLimit(prepared.reduce((sum, m) => sum + m.size, 0));
  if (limitError) {
    return { error: limitError };
  }

  const work = await prisma.work.create({
    data: { title, description },
  });

  let order = 0;
  for (const media of prepared) {
    const { key, url } = await uploadToR2(media.buffer, media.contentType, media.extension);
    await prisma.media.create({
      data: { workId: work.id, type: media.type, key, url, size: media.size, order: order++ },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateWork(workId: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const published = formData.get("published") === "on";
  if (!title) {
    return { error: "請輸入標題" };
  }

  await prisma.work.update({
    where: { id: workId },
    data: { title, description, published },
  });

  const files = formData.getAll("media").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0) {
    const prepared = await prepareMedia(files);

    const limitError = await checkStorageLimit(prepared.reduce((sum, m) => sum + m.size, 0));
    if (limitError) {
      return { error: limitError };
    }

    const existingCount = await prisma.media.count({ where: { workId } });
    let order = existingCount;
    for (const media of prepared) {
      const { key, url } = await uploadToR2(media.buffer, media.contentType, media.extension);
      await prisma.media.create({
        data: { workId, type: media.type, key, url, size: media.size, order: order++ },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${workId}/edit`);
  redirect("/admin");
}

export async function deleteWork(workId: string) {
  await requireAdmin();

  const media = await prisma.media.findMany({ where: { workId } });
  await prisma.work.delete({ where: { id: workId } });

  for (const item of media) {
    await deleteFromR2(item.key).catch(() => {});
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteMedia(mediaId: string) {
  await requireAdmin();

  const media = await prisma.media.delete({ where: { id: mediaId } });
  await deleteFromR2(media.key).catch(() => {});

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${media.workId}/edit`);
}
