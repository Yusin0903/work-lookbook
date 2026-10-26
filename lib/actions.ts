"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToR2, deleteFromR2, r2Configured } from "@/lib/r2";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function extensionFor(mimeType: string) {
  return mimeType.split("/")[1]?.replace("quicktime", "mov") ?? "bin";
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

  const work = await prisma.work.create({
    data: { title, description },
  });

  let order = 0;
  for (const file of files) {
    const type = IMAGE_TYPES.has(file.type) ? "IMAGE" : VIDEO_TYPES.has(file.type) ? "VIDEO" : null;
    if (!type) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await uploadToR2(buffer, file.type, extensionFor(file.type));
    await prisma.media.create({
      data: { workId: work.id, type, key, url, order: order++ },
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
    const existingCount = await prisma.media.count({ where: { workId } });
    let order = existingCount;
    for (const file of files) {
      const type = IMAGE_TYPES.has(file.type) ? "IMAGE" : VIDEO_TYPES.has(file.type) ? "VIDEO" : null;
      if (!type) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { key, url } = await uploadToR2(buffer, file.type, extensionFor(file.type));
      await prisma.media.create({
        data: { workId, type, key, url, order: order++ },
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
