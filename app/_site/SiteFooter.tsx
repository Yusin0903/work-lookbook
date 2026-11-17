import Link from "next/link";
import { getNavCollections } from "./collections";

export async function SiteFooter() {
  const collections = await getNavCollections();

  return (
    <footer className="mt-24 bg-surface">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
          <div className="col-span-2">
            <p className="text-xl font-bold tracking-tight">Lookbook</p>
            <p className="mt-3 max-w-xs text-sm text-muted">手工打磨 · 客製 3D 列印</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-4">Collections</p>
            <ul className="space-y-2 text-sm text-muted">
              {collections.map((c) => (
                <li key={c.id}>
                  <Link href={`/?book=${c.id}`} className="hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-4">Browse</p>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/?book=all" className="hover:text-foreground">
                  All Works
                </Link>
              </li>
              <li>
                <a href="#top" className="hover:text-foreground">
                  Back to top
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-divider py-6 text-xs text-muted">© {new Date().getFullYear()} Lookbook</div>
      </div>
    </footer>
  );
}
