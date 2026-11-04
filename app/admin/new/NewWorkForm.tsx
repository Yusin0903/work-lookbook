"use client";

import { useActionState } from "react";
import { createWork } from "@/lib/actions";
import { checkUploadSize, MAX_UPLOAD_MB } from "@/lib/upload-limits";

type State = { error?: string } | undefined;

interface TagOption {
  id: string;
  name: string;
}

interface SeriesOption {
  id: string;
  name: string;
}

export function NewWorkForm({
  seriesList,
  tagList,
}: {
  seriesList: SeriesOption[];
  tagList: TagOption[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => {
      const files = formData.getAll("media").filter((f): f is File => f instanceof File);
      const sizeError = checkUploadSize(files);
      if (sizeError) return { error: sizeError };
      return createWork(formData);
    },
    undefined
  );

  const selectedTagIds: string[] = [];

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
        <label className="block text-sm font-medium mb-1">分類(選填)</label>
        <select name="seriesId" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
          <option value="">沒有分類</option>
          {seriesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          name="newSeriesName"
          type="text"
          placeholder="或建立新分類(填了會優先使用)"
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">標籤(材質與風格,選填)</label>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
            {tagList.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="tagIds" value={t.id} defaultChecked={selectedTagIds.includes(t.id)} />
                {t.name}
              </label>
            ))}
          </div>
        )}
        <input
          name="newTagNames"
          type="text"
          placeholder="或新增標籤,多個用逗號分隔,例如:Silk, Translucent"
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
        <p className="text-xs text-neutral-500 mt-1">單次上傳檔案總大小上限 {MAX_UPLOAD_MB}MB。</p>
        <p className="text-xs text-neutral-500 mt-1">
          可一次選擇多個檔案,支援 jpg/png/webp/gif 與 mp4/webm/mov,第一張會自動設為首圖(之後可以在編輯頁面改)。
        </p>
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
