"use client";

import { useTransition } from "react";
import { deleteWork } from "@/lib/actions";

export function DeleteWorkButton({ workId }: { workId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("確定要刪除這個作品嗎?媒體檔案也會一併刪除。")) {
          startTransition(() => deleteWork(workId));
        }
      }}
      className="text-sm text-red-600 hover:underline shrink-0 disabled:opacity-50"
    >
      刪除
    </button>
  );
}
