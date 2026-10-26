"use client";

import { useTransition } from "react";
import { setCoverMedia } from "@/lib/actions";

export function SetCoverButton({ mediaId, isCover }: { mediaId: string; isCover: boolean }) {
  const [pending, startTransition] = useTransition();

  if (isCover) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setCoverMedia(mediaId))}
      className="absolute bottom-1 left-1 rounded bg-white/90 text-neutral-700 text-xs px-1.5 py-0.5 shadow-sm disabled:opacity-50"
    >
      設為首圖
    </button>
  );
}
