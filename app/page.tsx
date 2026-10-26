import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface WorkCard {
  id: string;
  title: string;
  cover: { url: string; type: "IMAGE" | "VIDEO" } | null;
}

function resolveCover(media: { url: string; type: string; isCover: boolean }[]) {
  const cover = media.find((m) => m.isCover) ?? media[0];
  return cover ? { url: cover.url, type: cover.type as "IMAGE" | "VIDEO" } : null;
}

export default async function HomePage() {
  const [seriesList, works] = await Promise.all([
    prisma.series.findMany({ orderBy: { order: "asc" } }),
    prisma.work.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { order: "asc" } } },
    }),
  ]);

  const sections: { key: string; label: string | null; works: WorkCard[] }[] = [
    ...seriesList.map((series) => ({
      key: series.id,
      label: series.name,
      works: works
        .filter((w) => w.seriesId === series.id)
        .map((w) => ({ id: w.id, title: w.title, cover: resolveCover(w.media) })),
    })),
    {
      key: "none",
      label: null,
      works: works
        .filter((w) => !w.seriesId)
        .map((w) => ({ id: w.id, title: w.title, cover: resolveCover(w.media) })),
    },
  ].filter((section) => section.works.length > 0);

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Lookbook</h1>
        <p className="text-sm text-neutral-500 mt-1">3D 列印作品集</p>
      </header>

      {sections.length === 0 ? (
        <p className="text-neutral-500">目前還沒有作品。</p>
      ) : (
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.key}>
              {section.label && (
                <h2 className="text-lg font-medium tracking-tight mb-4">{section.label}</h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {section.works.map((work) => (
                  <Link key={work.id} href={`/work/${work.id}`} className="group block">
                    <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
                      {work.cover?.type === "IMAGE" ? (
                        <img
                          src={work.cover.url}
                          alt={work.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : work.cover?.type === "VIDEO" ? (
                        <video
                          src={work.cover.url}
                          muted
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium">{work.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
