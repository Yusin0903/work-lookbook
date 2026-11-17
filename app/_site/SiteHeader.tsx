import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em]">
          Lookbook
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/?book=all" className="hover:underline underline-offset-4">
            Index
          </Link>
          <span className="hidden font-mono text-xs text-muted sm:inline">3D Printed Objects</span>
        </nav>
      </div>
    </header>
  );
}
