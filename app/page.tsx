import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const works = await prisma.work.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { media: { orderBy: { order: "asc" }, take: 1 } },
  });

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Lookbook</h1>
        <p className="text-sm text-neutral-500 mt-1">3D 列印作品集</p>
      </header>

      {works.length === 0 ? (
        <p className="text-neutral-500">目前還沒有作品。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {works.map((work) => {
            const cover = work.media[0];
            return (
              <Link
                key={work.id}
                href={`/work/${work.id}`}
                className="group block"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  {cover?.type === "IMAGE" ? (
                    <img
                      src={cover.url}
                      alt={work.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : cover?.type === "VIDEO" ? (
                    <video
                      src={cover.url}
                      muted
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium">{work.title}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
