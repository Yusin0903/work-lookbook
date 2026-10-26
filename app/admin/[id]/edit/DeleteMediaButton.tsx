"use client";

import { useTransition } from "react";
import { deleteMedia } from "@/lib/actions";

export function DeleteMediaButton({ mediaId }: { mediaId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("刪除這個媒體檔案?")) {
          startTransition(() => deleteMedia(mediaId));
        }
      }}
      className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-xs w-6 h-6 flex items-center justify-center disabled:opacity-50"
    >
      ×
    </button>
  );
}
