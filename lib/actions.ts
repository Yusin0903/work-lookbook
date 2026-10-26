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

async function resolveSeriesId(formData: FormData): Promise<string | null> {
  const newSeriesName = formData.get("newSeriesName")?.toString().trim();
  if (newSeriesName) {
    const maxOrder = await prisma.series.aggregate({ _max: { order: true } });
    const series = await prisma.series.create({
      data: { name: newSeriesName, order: (maxOrder._max.order ?? -1) + 1 },
    });
    return series.id;
  }

  const seriesId = formData.get("seriesId")?.toString();
  return seriesId || null;
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

  const seriesId = await resolveSeriesId(formData);
  const work = await prisma.work.create({
    data: { title, description, seriesId },
  });

  for (let i = 0; i < prepared.length; i++) {
    const media = prepared[i];
    const { key, url } = await uploadToR2(media.buffer, media.contentType, media.extension);
    await prisma.media.create({
      data: { workId: work.id, type: media.type, key, url, size: media.size, order: i, isCover: i === 0 },
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

  const seriesId = await resolveSeriesId(formData);
  await prisma.work.update({
    where: { id: workId },
    data: { title, description, published, seriesId },
  });

  const files = formData.getAll("media").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 0) {
    const prepared = await prepareMedia(files);

    const limitError = await checkStorageLimit(prepared.reduce((sum, m) => sum + m.size, 0));
    if (limitError) {
      return { error: limitError };
    }

    const existingCount = await prisma.media.count({ where: { workId } });
    const hasExistingCover = (await prisma.media.count({ where: { workId, isCover: true } })) > 0;
    for (let i = 0; i < prepared.length; i++) {
      const media = prepared[i];
      const { key, url } = await uploadToR2(media.buffer, media.contentType, media.extension);
      await prisma.media.create({
        data: {
          workId,
          type: media.type,
          key,
          url,
          size: media.size,
          order: existingCount + i,
          isCover: !hasExistingCover && i === 0,
        },
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

  if (media.isCover) {
    const next = await prisma.media.findFirst({
      where: { workId: media.workId },
      orderBy: { order: "asc" },
    });
    if (next) {
      await prisma.media.update({ where: { id: next.id }, data: { isCover: true } });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${media.workId}/edit`);
}

export async function setCoverMedia(mediaId: string) {
  await requireAdmin();

  const media = await prisma.media.findUniqueOrThrow({ where: { id: mediaId } });
  await prisma.$transaction([
    prisma.media.updateMany({ where: { workId: media.workId }, data: { isCover: false } }),
    prisma.media.update({ where: { id: mediaId }, data: { isCover: true } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${media.workId}/edit`);
}

export async function reorderWorks(orderedWorkIds: string[]) {
  await requireAdmin();

  await prisma.$transaction(
    orderedWorkIds.map((id, index) => prisma.work.update({ where: { id }, data: { order: index } }))
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createSeriesStandalone(name: string) {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) return;

  const maxOrder = await prisma.series.aggregate({ _max: { order: true } });
  await prisma.series.create({ data: { name: trimmed, order: (maxOrder._max.order ?? -1) + 1 } });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function renameSeries(seriesId: string, name: string) {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) return;

  await prisma.series.update({ where: { id: seriesId }, data: { name: trimmed } });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSeries(seriesId: string) {
  await requireAdmin();

  await prisma.series.delete({ where: { id: seriesId } });

  revalidatePath("/");
  revalidatePath("/admin");
}
