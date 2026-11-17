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

  const works: ShelfWork[] = rows.map((w, i) => ({
    id: w.id,
    no: i + 1,
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
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <section className="pt-10 sm:pt-16">
            <h1 className="text-[clamp(4.5rem,17vw,16rem)] font-semibold leading-[0.82] tracking-[-0.045em]">
              Lookbook
            </h1>
            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-foreground pt-5 md:grid-cols-12">
              <p className="md:col-span-3 font-mono text-xs uppercase leading-relaxed text-muted">
                手工打磨 · 客製 3D 列印
                <br />
                Hand-finished printed objects
              </p>
              <p className="md:col-span-6 md:col-start-5 text-xl sm:text-2xl leading-snug tracking-tight text-pretty">
                從螢幕上的模型,到手上的實體——紀錄每一件作品的材質與表情。
              </p>
              <p className="md:col-span-2 md:col-start-11 font-mono text-xs text-muted md:text-right">
                {String(works.length).padStart(3, "0")} Objects
                <br />
                {String(books.length - 1).padStart(2, "0")} Collections
              </p>
            </div>
          </section>

          <section className="mt-20 sm:mt-28">
            {works.length === 0 ? (
              <p className="text-muted">目前還沒有作品。</p>
            ) : (
              <BookShelf
                books={books}
                works={works}
                tags={tagList}
                initialBookId={book ?? null}
                initialTagId={tag ?? null}
              />
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
