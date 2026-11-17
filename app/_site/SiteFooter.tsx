import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-foreground">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12">
          <p className="md:col-span-7 text-2xl sm:text-4xl font-semibold tracking-[-0.03em]">Lookbook</p>
          <dl className="md:col-span-4 md:col-start-9 grid grid-cols-2 gap-x-6 gap-y-6 text-sm">
            <div>
              <dt className="font-mono text-xs uppercase text-muted mb-2">Practice</dt>
              <dd>手工打磨</dd>
              <dd>客製 3D 列印</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-muted mb-2">Browse</dt>
              <dd>
                <Link href="/" className="hover:underline underline-offset-4">
                  Collections
                </Link>
              </dd>
              <dd>
                <Link href="/?book=all" className="hover:underline underline-offset-4">
                  Index of Works
                </Link>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex items-center justify-between border-t border-divider py-5 font-mono text-xs text-muted">
          <span>© {new Date().getFullYear()} Lookbook</span>
          <a href="#top" className="hover:text-foreground">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
