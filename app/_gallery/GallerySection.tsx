import type { ReactNode } from "react";

export function GallerySection({
  label,
  count,
  children,
}: {
  label: string | null;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      {label && (
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="text-xl font-medium tracking-tight">{label}</h2>
          {count !== undefined && <span className="text-sm text-muted">{count}</span>}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-10">{children}</div>
    </section>
  );
}
