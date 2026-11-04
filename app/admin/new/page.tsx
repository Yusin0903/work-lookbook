import { prisma } from "@/lib/prisma";
import { NewWorkForm } from "./NewWorkForm";

export const dynamic = "force-dynamic";

export default async function NewWorkPage() {
  const [seriesList, tagList] = await Promise.all([
    prisma.series.findMany({ orderBy: { order: "asc" } }),
    prisma.tag.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">新增作品</h1>
      <NewWorkForm seriesList={seriesList} tagList={tagList} />
    </main>
  );
}
