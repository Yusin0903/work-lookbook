import { prisma } from "@/lib/prisma";

// Collections that have at least one published work, for site navigation.
export async function getNavCollections() {
  return prisma.series.findMany({
    where: { works: { some: { published: true } } },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
}
