export interface GalleryCover {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export function GalleryCard({ title, cover }: { title: string; cover: GalleryCover | null }) {
  return (
    <div className="aspect-[4/5] overflow-hidden bg-surface">
      {cover?.type === "IMAGE" ? (
        <img
          src={cover.url}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
      ) : cover?.type === "VIDEO" ? (
        <video
          src={cover.url}
          muted
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}

export function formatObjectNo(no: number) {
  return `No. ${String(no).padStart(3, "0")}`;
}

export function GalleryCaption({ no, title, meta }: { no: number; title: string; meta?: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] uppercase text-muted">
        <span>{formatObjectNo(no)}</span>
        {meta && <span className="truncate">{meta}</span>}
      </div>
      <p className="mt-1 text-base sm:text-lg font-medium tracking-tight underline-offset-4 decoration-1 group-hover:underline">
        {title}
      </p>
    </div>
  );
}
