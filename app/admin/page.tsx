import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/actions";
import { WorkList, type WorkGroup } from "./WorkList";
import { SeriesManager } from "./SeriesManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [seriesList, works] = await Promise.all([
    prisma.series.findMany({ orderBy: { order: "asc" } }),
    prisma.work.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { order: "asc" } } },
    }),
  ]);

  const groups: WorkGroup[] = [
    ...seriesList.map((series) => ({
      key: series.id,
      label: series.name,
      works: works
        .filter((w) => w.seriesId === series.id)
        .map((w) => ({
          id: w.id,
          title: w.title,
          published: w.published,
          cover: resolveCover(w.media),
        })),
    })),
    {
      key: "none",
      label: "其他作品",
      works: works
        .filter((w) => !w.seriesId)
        .map((w) => ({
          id: w.id,
          title: w.title,
          published: w.published,
          cover: resolveCover(w.media),
        })),
    },
  ];

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
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

      <SeriesManager series={seriesList} />

      <WorkList groups={groups} />
    </main>
  );
}

function resolveCover(media: { url: string; type: string; isCover: boolean }[]) {
  const cover = media.find((m) => m.isCover) ?? media[0];
  return cover ? { url: cover.url, type: cover.type as "IMAGE" | "VIDEO" } : null;
}
