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
      include: { media: { orderBy: { order: "asc" } }, series: true },
    }),
  ]);

  // The featured work also still appears in its own series grid below — a
  // single-work series would otherwise vanish from the page entirely once
  // its one work was "promoted" out of the grid.
  const featured = works.find((w) => resolveCover(w.media));

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
        <header className="mb-14 sm:mb-16 text-center">
          <p className="text-xs font-medium tracking-[0.28em] text-accent mb-3">手工打磨 · 客製 3D 列印</p>
          <h1 className="font-serif italic text-5xl sm:text-7xl tracking-tight text-foreground">Lookbook</h1>
          <p className="mt-4 font-serif text-lg text-muted max-w-md mx-auto">
            從螢幕上的模型,到手上的實體——紀錄每一件作品的材質與表情
          </p>
        </header>

        {works.length === 0 ? (
          <p className="text-muted text-center">目前還沒有作品。</p>
        ) : (
          <>
            {featured && (
              <section className="mb-16 sm:mb-20">
                <div className="flex flex-wrap gap-10 items-end">
                  <Link href={`/work/${featured.id}`} className="group block flex-[999_1_560px] min-w-0">
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-surface">
                      {resolveCover(featured.media)?.type === "IMAGE" ? (
                        <img
                          src={resolveCover(featured.media)!.url}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <video
                          src={resolveCover(featured.media)!.url}
                          muted
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 p-8">
                        <p className="text-xs font-medium tracking-[0.22em] text-background/85 mb-2">
                          {featured.series ? `FEATURED — ${featured.series.name}` : "FEATURED"}
                        </p>
                        <h2 className="font-serif italic text-3xl sm:text-4xl text-background">{featured.title}</h2>
                      </div>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-[240px]">
                    <p className="font-serif italic text-xl leading-relaxed text-foreground">
                      「每一件作品,都是列印層與打磨時間堆出來的表情。」
                    </p>
                    <a
                      href="#gallery"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-accent border-b border-accent pb-1"
                    >
                      瀏覽全部作品 →
                    </a>
                  </div>
                </div>
              </section>
            )}

            <div id="gallery" className="space-y-16 sm:space-y-20">
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

          </>
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
