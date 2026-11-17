import Link from "next/link";
import { getNavCollections } from "./collections";

export async function SiteHeader() {
  const collections = await getNavCollections();
  const links = [{ href: "/?book=all", label: "All Works" }].concat(
    collections.map((c) => ({ href: `/?book=${c.id}`, label: c.name }))
  );

  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-background">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-10 px-4 sm:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Lookbook
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-muted transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="shelf-track flex gap-5 overflow-x-auto border-t border-divider px-4 py-3 text-sm md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
