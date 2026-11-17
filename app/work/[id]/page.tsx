import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatObjectNo } from "@/app/_gallery/GalleryCard";
import { SiteHeader } from "@/app/_site/SiteHeader";
import { SiteFooter } from "@/app/_site/SiteFooter";

export const dynamic = "force-dynamic";

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

  // Object numbers follow the public index order, so they match the homepage.
  const index = await prisma.work.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, seriesId: true },
  });
  const no = index.findIndex((w) => w.id === work.id) + 1;
  const siblings = index.filter((w) => w.seriesId === work.seriesId);
  const position = siblings.findIndex((w) => w.id === work.id);
  const prev = position > 0 ? siblings[position - 1] : null;
  const next = position < siblings.length - 1 ? siblings[position + 1] : null;
  const backHref = `/?book=${work.seriesId ?? "all"}`;

  return (
    <>
      <SiteHeader />
      <main id="top" className="flex-1 w-full">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <nav className="flex items-center gap-2 border-b border-divider py-4 text-sm">
            <Link href={backHref} className="hover:underline underline-offset-4">
              ← {work.series?.name ?? "Index"}
            </Link>
          </nav>

          <div className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {work.media.map((item) =>
                item.type === "IMAGE" ? (
                  <img key={item.id} src={item.url} alt={work.title} className="w-full bg-surface" />
                ) : (
                  <video key={item.id} src={item.url} controls className="w-full bg-surface" />
                )
              )}
            </div>

            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <p className="font-mono text-xs uppercase text-muted">{formatObjectNo(no)}</p>
                <h1 className="mt-3 text-4xl sm:text-6xl font-semibold leading-[0.95] tracking-[-0.035em]">
                  {work.title}
                </h1>
                {work.description && (
                  <p className="mt-8 max-w-md whitespace-pre-line text-base leading-relaxed">{work.description}</p>
                )}

                <dl className="mt-10 border-t border-foreground text-sm">
                  <Detail label="Collection">{work.series?.name ?? "—"}</Detail>
                  <Detail label="Material / Finish">
                    {work.tags.length > 0 ? work.tags.map((t) => t.name).join(", ") : "—"}
                  </Detail>
                  <Detail label="Technique">3D 列印 · 手工打磨</Detail>
                  <Detail label="Images">{String(work.media.length).padStart(2, "0")}</Detail>
                </dl>

                <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                  {prev ? (
                    <Link href={`/work/${prev.id}`} className="group block">
                      <span className="font-mono text-[11px] uppercase text-muted">← Previous</span>
                      <span className="mt-1 block truncate group-hover:underline underline-offset-4">{prev.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {next && (
                    <Link href={`/work/${next.id}`} className="group block text-right">
                      <span className="font-mono text-[11px] uppercase text-muted">Next →</span>
                      <span className="mt-1 block truncate group-hover:underline underline-offset-4">{next.title}</span>
                    </Link>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-divider py-3">
      <dt className="font-mono text-[11px] uppercase text-muted pt-0.5">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}
