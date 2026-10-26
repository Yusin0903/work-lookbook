"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderWorks } from "@/lib/actions";
import { DeleteWorkButton } from "./DeleteWorkButton";

export interface WorkItem {
  id: string;
  title: string;
  published: boolean;
  cover: { url: string; type: "IMAGE" | "VIDEO" } | null;
}

export interface WorkGroup {
  key: string;
  label: string;
  works: WorkItem[];
}

export function WorkList({ groups: initialGroups }: { groups: WorkGroup[] }) {
  const [groups, setGroups] = useState(initialGroups);
  // initialGroups comes from the server component and changes whenever a
  // work is deleted, hidden, etc. elsewhere on the page — resync local drag
  // state to it so those changes actually show up here. Adjusting state
  // during render (rather than in an effect) avoids an extra render pass.
  const [prevInitialGroups, setPrevInitialGroups] = useState(initialGroups);
  if (initialGroups !== prevInitialGroups) {
    setPrevInitialGroups(initialGroups);
    setGroups(initialGroups);
  }

  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(groupKey: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroups((prev) =>
      prev.map((group) => {
        if (group.key !== groupKey) return group;
        const oldIndex = group.works.findIndex((w) => w.id === active.id);
        const newIndex = group.works.findIndex((w) => w.id === over.id);
        const reordered = arrayMove(group.works, oldIndex, newIndex);
        startTransition(() => {
          reorderWorks(reordered.map((w) => w.id));
        });
        return { ...group, works: reordered };
      })
    );
  }

  if (groups.every((g) => g.works.length === 0)) {
    return <p className="text-neutral-500">還沒有作品,點「新增作品」開始上傳。</p>;
  }

  return (
    <div className="space-y-10">
      {groups.map(
        (group) =>
          group.works.length > 0 && (
            <section key={group.key}>
              <h2 className="text-sm font-medium text-neutral-500 mb-3">{group.label}</h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(group.key, event)}
              >
                <SortableContext items={group.works.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                  <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
                    {group.works.map((work) => (
                      <SortableWorkRow key={work.id} work={work} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </section>
          )
      )}
    </div>
  );
}

function SortableWorkRow({ work }: { work: WorkItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-3 bg-white">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-neutral-400 px-1 shrink-0"
        aria-label="拖曳調整順序"
      >
        ⠿
      </button>
      <div className="h-16 w-16 rounded-md bg-neutral-100 overflow-hidden shrink-0">
        {work.cover?.type === "IMAGE" ? (
          <img src={work.cover.url} alt="" className="h-full w-full object-cover" />
        ) : work.cover?.type === "VIDEO" ? (
          <video src={work.cover.url} muted className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{work.title}</p>
        <p className="text-xs text-neutral-500">{work.published ? "公開" : "隱藏"}</p>
      </div>
      <Link href={`/admin/${work.id}/edit`} className="text-sm text-neutral-600 hover:underline shrink-0">
        編輯
      </Link>
      <DeleteWorkButton workId={work.id} />
    </li>
  );
}
