import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GalleryCard, GalleryCaption, type GalleryCover } from "@/app/_gallery/GalleryCard";
import { SiteHeader } from "@/app/_site/SiteHeader";
import { SiteFooter } from "@/app/_site/SiteFooter";

export const dynamic = "force-dynamic";

const RELATED_COUNT = 4;

function resolveCover(media: { url: string; type: string; isCover: boolean }[]): GalleryCover | null {
  const cover = media.find((m) => m.isCover) ?? media[0];
  return cover ? { url: cover.url, type: cover.type as "IMAGE" | "VIDEO" } : null;
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({
    where: { id },
    include: { media: { orderBy: { order: "asc" } }, series: true, tags: { orderBy: { order: "asc" } } },
  });

  if (!work || !work.published) {
    notFound();
  }

  const related = await prisma.work.findMany({
    where: { published: true, seriesId: work.seriesId, id: { not: work.id } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: RELATED_COUNT,
    include: { media: { orderBy: { order: "asc" } }, tags: { orderBy: { order: "asc" } } },
  });
  const backHref = `/?book=${work.seriesId ?? "all"}`;
  const [firstMedia, ...restMedia] = work.media;

  return (
    <>
      <SiteHeader />
      <main id="top" className="flex-1 w-full">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
          <nav className="flex items-center gap-2 py-5 text-sm text-muted">
            <Link href="/?book=all" className="hover:text-foreground">
              All Works
            </Link>
            {work.series && (
              <>
                <span>/</span>
                <Link href={backHref} className="hover:text-foreground">
                  {work.series.name}
                </Link>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              {firstMedia && <MediaTile item={firstMedia} title={work.title} />}
              {restMedia.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {restMedia.map((item) => (
                    <MediaTile key={item.id} item={item} title={work.title} />
                  ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <h1 className="text-3xl font-semibold tracking-tight">{work.title}</h1>
                {work.tags.length > 0 && (
                  <p className="mt-2 text-sm text-muted">{work.tags.map((t) => t.name).join(", ")}</p>
                )}
                {work.description && (
                  <p className="mt-6 whitespace-pre-line text-sm leading-relaxed">{work.description}</p>
                )}

                <dl className="mt-8 border-t border-divider text-sm">
                  <Detail label="Collection">{work.series?.name ?? "—"}</Detail>
                  <Detail label="Material / Finish">
                    {work.tags.length > 0 ? work.tags.map((t) => t.name).join(", ") : "—"}
                  </Detail>
                  <Detail label="Technique">3D 列印 · 手工打磨</Detail>
                </dl>

                <Link
                  href={backHref}
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-foreground text-sm text-background transition-opacity hover:opacity-80"
                >
                  {work.series ? `More from ${work.series.name}` : "Back to all works"}
                </Link>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-24">
              <h2 className="mb-5 text-xl font-medium tracking-tight">
                {work.series ? `More from ${work.series.name}` : "More works"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-10">
                {related.map((w) => (
                  <Link key={w.id} href={`/work/${w.id}`} className="group block">
                    <GalleryCard title={w.title} cover={resolveCover(w.media)} />
                    <GalleryCaption title={w.title} meta={w.tags.map((t) => t.name).join(", ")} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function MediaTile({ item, title }: { item: { type: string; url: string }; title: string }) {
  return item.type === "IMAGE" ? (
    <img src={item.url} alt={title} className="w-full bg-surface" />
  ) : (
    <video src={item.url} controls className="w-full bg-surface" />
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-divider py-3.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
