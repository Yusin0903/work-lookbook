import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditWorkForm } from "./EditWorkForm";
import { DeleteMediaButton } from "./DeleteMediaButton";
import { SetCoverButton } from "./SetCoverButton";

export const dynamic = "force-dynamic";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [work, seriesList] = await Promise.all([
    prisma.work.findUnique({
      where: { id },
      include: { media: { orderBy: { order: "asc" } } },
    }),
    prisma.series.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!work) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">編輯作品</h1>
      <EditWorkForm work={work} seriesList={seriesList} />

      {work.media.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium mb-3">目前的媒體(點「設為首圖」選擇列表縮圖要用哪一張)</h2>
          <div className="grid grid-cols-3 gap-3">
            {work.media.map((item) => (
              <div key={item.id} className="relative">
                <div className="aspect-square rounded-md overflow-hidden bg-neutral-100">
                  {item.type === "IMAGE" ? (
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={item.url} muted className="h-full w-full object-cover" />
                  )}
                </div>
                {item.isCover && (
                  <span className="absolute top-1 left-1 rounded bg-neutral-900/80 text-white text-xs px-1.5 py-0.5">
                    首圖
                  </span>
                )}
                <DeleteMediaButton mediaId={item.id} />
                <SetCoverButton mediaId={item.id} isCover={item.isCover} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
