import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({
    where: { id },
    include: { media: { orderBy: { order: "asc" } } },
  });

  if (!work || !work.published) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← 回作品集
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight mt-4">{work.title}</h1>
      {work.description && (
        <p className="text-neutral-600 mt-2 whitespace-pre-line">{work.description}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {work.media.map((item) =>
          item.type === "IMAGE" ? (
            <img
              key={item.id}
              src={item.url}
              alt={work.title}
              className="w-full rounded-lg"
            />
          ) : (
            <video key={item.id} src={item.url} controls className="w-full rounded-lg" />
          )
        )}
      </div>
    </main>
  );
}
