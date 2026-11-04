import { prisma } from "@/lib/prisma";
import { type GalleryCover } from "@/app/_gallery/GalleryCard";
import { BookShelf, type ShelfBook, type ShelfWork } from "@/app/_gallery/BookShelf";

export const dynamic = "force-dynamic";

function resolveCover(media: { url: string; type: string; isCover: boolean }[]): GalleryCover | null {
  const cover = media.find((m) => m.isCover) ?? media[0];
  return cover ? { url: cover.url, type: cover.type as "IMAGE" | "VIDEO" } : null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; tag?: string }>;
}) {
  const { book, tag } = await searchParams;

  const [seriesList, tagList, rows] = await Promise.all([
    prisma.series.findMany({ orderBy: { order: "asc" } }),
    prisma.tag.findMany({ orderBy: { order: "asc" } }),
    prisma.work.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { media: { orderBy: { order: "asc" } }, tags: { select: { id: true } } },
    }),
  ]);

  const works: ShelfWork[] = rows.map((w) => ({
    id: w.id,
    title: w.title,
    cover: resolveCover(w.media),
    seriesId: w.seriesId,
    tagIds: w.tags.map((t) => t.id),
  }));

  // Each category (series) is a "book" on the shelf; All Works comes first.
  const books: ShelfBook[] = [
    {
      id: "all",
      name: "All Works",
      cover: works.find((w) => w.cover)?.cover ?? null,
      count: works.length,
    },
    ...seriesList
      .map((series) => {
        const inSeries = works.filter((w) => w.seriesId === series.id);
        return {
          id: series.id,
          name: series.name,
          cover: inSeries.find((w) => w.cover)?.cover ?? null,
          count: inSeries.length,
        };
      })
      .filter((b) => b.count > 0),
  ];

  return (
    <>
      <div className="intro-curtain" aria-hidden="true">
        <div className="intro-curtain-panel intro-curtain-panel--left" />
        <div className="intro-curtain-panel intro-curtain-panel--right" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-serif italic text-4xl sm:text-5xl text-background">Lookbook</p>
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <header className="mb-10 sm:mb-12 text-center">
            <p className="text-xs font-medium tracking-[0.28em] text-accent mb-3">手工打磨 · 客製 3D 列印</p>
            <h1 className="font-serif italic text-5xl sm:text-7xl tracking-tight text-foreground">Lookbook</h1>
            <p className="mt-4 font-serif text-lg text-muted max-w-md mx-auto">
              從螢幕上的模型,到手上的實體——紀錄每一件作品的材質與表情
            </p>
          </header>

          {works.length === 0 ? (
            <p className="text-muted text-center">目前還沒有作品。</p>
          ) : (
            <BookShelf
              books={books}
              works={works}
              tags={tagList}
              initialBookId={book ?? null}
              initialTagId={tag ?? null}
            />
          )}
        </div>

        {works.length > 0 && (
          <section className="bg-foreground px-6 py-20 sm:py-24">
            <p className="max-w-2xl mx-auto text-center font-serif italic text-2xl sm:text-3xl leading-relaxed text-background">
              從原型到成品,每一件 3D 列印作品都值得被好好看一眼
              <span className="text-accent">,也值得被好好收藏。</span>
            </p>
          </section>
        )}
      </main>
    </>
  );
}
