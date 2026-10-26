export interface GalleryCover {
  url: string;
  type: "IMAGE" | "VIDEO";
}

export function GalleryCard({ title, cover }: { title: string; cover: GalleryCover | null }) {
  return (
    <div className="aspect-square overflow-hidden rounded-sm bg-surface shadow-sm ring-1 ring-black/5">
      {cover?.type === "IMAGE" ? (
        <img
          src={cover.url}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : cover?.type === "VIDEO" ? (
        <video
          src={cover.url}
          muted
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
    </div>
  );
}

export function GalleryCaption({ title }: { title: string }) {
  return <p className="mt-3 font-serif text-base sm:text-lg tracking-wide text-foreground">{title}</p>;
}
