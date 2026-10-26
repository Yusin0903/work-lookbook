import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions";
import { DeleteWorkButton } from "./DeleteWorkButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const works = await prisma.work.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { media: { orderBy: { order: "asc" }, take: 1 } },
  });

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">作品管理</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/new"
            className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium"
          >
            新增作品
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-neutral-500 hover:underline">
              登出
            </button>
          </form>
        </div>
      </div>

      {works.length === 0 ? (
        <p className="text-neutral-500">還沒有作品,點「新增作品」開始上傳。</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {works.map((work) => {
            const cover = work.media[0];
            return (
              <li key={work.id} className="flex items-center gap-4 py-4">
                <div className="h-16 w-16 rounded-md bg-neutral-100 overflow-hidden shrink-0">
                  {cover?.type === "IMAGE" ? (
                    <img src={cover.url} alt="" className="h-full w-full object-cover" />
                  ) : cover?.type === "VIDEO" ? (
                    <video src={cover.url} muted className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{work.title}</p>
                  <p className="text-xs text-neutral-500">
                    {work.published ? "公開" : "隱藏"} · {work.media.length > 0 ? "" : "無媒體"}
                  </p>
                </div>
                <Link
                  href={`/admin/${work.id}/edit`}
                  className="text-sm text-neutral-600 hover:underline shrink-0"
                >
                  編輯
                </Link>
                <DeleteWorkButton workId={work.id} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
