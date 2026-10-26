"use client";

import { useActionState } from "react";
import { createWork } from "@/lib/actions";

type State = { error?: string } | undefined;

export function NewWorkForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => createWork(formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">標題</label>
        <input
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">描述(選填)</label>
        <textarea
          name="description"
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">照片 / 影片</label>
        <input
          name="media"
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="w-full text-sm"
        />
        <p className="text-xs text-neutral-500 mt-1">可一次選擇多個檔案,支援 jpg/png/webp/gif 與 mp4/webm/mov。</p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "上傳中..." : "建立作品"}
      </button>
    </form>
  );
}
