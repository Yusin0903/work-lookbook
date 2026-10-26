import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditWorkForm } from "./EditWorkForm";
import { DeleteMediaButton } from "./DeleteMediaButton";

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await prisma.work.findUnique({
    where: { id },
    include: { media: { orderBy: { order: "asc" } } },
  });

  if (!work) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">編輯作品</h1>
      <EditWorkForm work={work} />

      {work.media.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium mb-3">目前的媒體</h2>
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
                <DeleteMediaButton mediaId={item.id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
