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
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : cover?.type === "VIDEO" ? (
        <video
          src={cover.url}
          muted
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : null}
    </div>
  );
}

export function GalleryCaption({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mt-3 text-sm">
      <p className="font-medium">{title}</p>
      {meta && <p className="mt-0.5 text-muted">{meta}</p>}
    </div>
  );
}
