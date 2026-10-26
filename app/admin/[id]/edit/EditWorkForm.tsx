"use client";

import { useActionState } from "react";
import { updateWork } from "@/lib/actions";

type State = { error?: string } | undefined;

interface WorkInput {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  seriesId: string | null;
}

interface SeriesOption {
  id: string;
  name: string;
}

export function EditWorkForm({ work, seriesList }: { work: WorkInput; seriesList: SeriesOption[] }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prevState, formData) => updateWork(work.id, formData),
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">標題</label>
        <input
          name="title"
          type="text"
          defaultValue={work.title}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">描述(選填)</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={work.description ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">系列(選填)</label>
        <select
          name="seriesId"
          defaultValue={work.seriesId ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">沒有系列</option>
          {seriesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          name="newSeriesName"
          type="text"
          placeholder="或建立新系列(填了會優先使用)"
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={work.published} />
        公開顯示
      </label>
      <div>
        <label className="block text-sm font-medium mb-1">新增照片 / 影片(選填)</label>
        <input
          name="media"
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="w-full text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "儲存中..." : "儲存"}
      </button>
    </form>
  );
}
