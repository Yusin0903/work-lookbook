import type { ReactNode } from "react";

export function GallerySection({ label, children }: { label: string | null; children: ReactNode }) {
  return (
    <section>
      {label && (
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="font-serif italic text-2xl sm:text-3xl tracking-tight text-neutral-900 shrink-0">
            {label}
          </h2>
          <div className="flex-1 h-px bg-neutral-300" />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">{children}</div>
    </section>
  );
}
