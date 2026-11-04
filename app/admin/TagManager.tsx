"use client";

import { useState, useTransition } from "react";
import { createTagStandalone, renameTag, deleteTag } from "@/lib/actions";

export interface TagItem {
  id: string;
  name: string;
}

export function TagManager({ tags }: { tags: TagItem[] }) {
  const [newName, setNewName] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-neutral-500 mb-2">標籤(材質與風格)</h2>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((s) => (
          <TagChip key={s.id} tag={s} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            startTransition(() => createTagStandalone(newName));
            setNewName("");
          }}
          className="flex items-center gap-1"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新增標籤"
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm w-28"
          />
          <button type="submit" className="text-sm text-neutral-500 hover:underline">
            新增
          </button>
        </form>
      </div>
    </div>
  );
}

function TagChip({ tag }: { tag: TagItem }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(() => renameTag(tag.id, name));
          setEditing(false);
        }}
        className="flex items-center gap-1"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-full border border-neutral-300 px-3 py-1 text-sm w-28"
          autoFocus
          onBlur={() => setEditing(false)}
        />
      </form>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm">
      <button type="button" onClick={() => setEditing(true)}>
        {tag.name}
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`刪除標籤「${tag.name}」?作品不會被刪除,只會移除這個標籤。`)) {
            startTransition(() => deleteTag(tag.id));
          }
        }}
        className="text-neutral-400 hover:text-red-600"
        aria-label={`刪除標籤 ${tag.name}`}
      >
        ×
      </button>
    </span>
  );
}
