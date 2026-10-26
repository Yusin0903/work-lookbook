"use client";

import { useState, useTransition } from "react";
import { createSeriesStandalone, renameSeries, deleteSeries } from "@/lib/actions";

export interface SeriesItem {
  id: string;
  name: string;
}

export function SeriesManager({ series }: { series: SeriesItem[] }) {
  const [newName, setNewName] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-neutral-500 mb-2">系列</h2>
      <div className="flex flex-wrap items-center gap-2">
        {series.map((s) => (
          <SeriesChip key={s.id} series={s} />
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            startTransition(() => createSeriesStandalone(newName));
            setNewName("");
          }}
          className="flex items-center gap-1"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新增系列"
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

function SeriesChip({ series }: { series: SeriesItem }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(series.name);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(() => renameSeries(series.id, name));
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
        {series.name}
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`刪除系列「${series.name}」?裡面的作品不會被刪除,只會變成沒有系列。`)) {
            startTransition(() => deleteSeries(series.id));
          }
        }}
        className="text-neutral-400 hover:text-red-600"
        aria-label={`刪除系列 ${series.name}`}
      >
        ×
      </button>
    </span>
  );
}
