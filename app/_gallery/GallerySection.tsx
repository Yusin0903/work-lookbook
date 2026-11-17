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
        <div className="mb-8 flex items-baseline justify-between border-t border-foreground pt-4">
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">{label}</h2>
          {count !== undefined && (
            <span className="font-mono text-xs text-muted">{String(count).padStart(2, "0")} Objects</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-12 sm:gap-y-16">{children}</div>
    </section>
  );
}
