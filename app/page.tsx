import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GalleryCard, GalleryCaption, type GalleryCover } from "@/app/_gallery/GalleryCard";
import { GallerySection } from "@/app/_gallery/GallerySection";

export const dynamic = "force-dynamic";

interface WorkCard {
  id: string;
  title: string;
  cover: GalleryCover | null;
}

function resolveCover(media: { url: string; type: string; isCover: boolean }[]): GalleryCover | null {
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
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 sm:py-20">
      <header className="mb-16 sm:mb-20 text-center">
        <h1 className="font-serif text-4xl sm:text-6xl tracking-tight text-neutral-900">Lookbook</h1>
        <p className="mt-3 font-serif italic text-neutral-500 text-lg">3D 列印作品集</p>
      </header>

      {sections.length === 0 ? (
        <p className="text-neutral-500 text-center">目前還沒有作品。</p>
      ) : (
        <div className="space-y-16 sm:space-y-20">
          {sections.map((section) => (
            <GallerySection key={section.key} label={section.label}>
              {section.works.map((work) => (
                <Link key={work.id} href={`/work/${work.id}`} className="group block" data-work-id={work.id}>
                  <GalleryCard title={work.title} cover={work.cover} />
                  <GalleryCaption title={work.title} />
                </Link>
              ))}
            </GallerySection>
          ))}
        </div>
      )}
    </main>
  );
}
