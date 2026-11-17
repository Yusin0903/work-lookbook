import { prisma } from "@/lib/prisma";
import { type GalleryCover } from "@/app/_gallery/GalleryCard";
import { BookShelf, type ShelfBook, type ShelfWork } from "@/app/_gallery/BookShelf";
import { SiteHeader } from "@/app/_site/SiteHeader";
import { SiteFooter } from "@/app/_site/SiteFooter";

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
      <SiteHeader />
      <main id="top" className="flex-1 w-full">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <section className="flex flex-col gap-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:py-16">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Lookbook</h1>
              <p className="mt-3 max-w-md text-base text-muted text-pretty">
                從螢幕上的模型,到手上的實體——紀錄每一件作品的材質與表情。
              </p>
            </div>
            <p className="text-sm text-muted">手工打磨 · 客製 3D 列印</p>
          </section>

          {works.length === 0 ? (
            <p className="text-muted">目前還沒有作品。</p>
          ) : (
            <BookShelf
              key={book ?? "shelf"}
              books={books}
              works={works}
              tags={tagList}
              initialBookId={book ?? null}
              initialTagId={tag ?? null}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
