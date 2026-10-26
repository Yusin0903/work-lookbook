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
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderWorks } from "@/lib/actions";
import { GalleryCard, type GalleryCover } from "@/app/_gallery/GalleryCard";
import { GallerySection } from "@/app/_gallery/GallerySection";
import { DeleteWorkButton } from "./DeleteWorkButton";

export interface WorkItem {
  id: string;
  title: string;
  published: boolean;
  cover: GalleryCover | null;
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
    <div className="space-y-16">
      {groups.map(
        (group) =>
          group.works.length > 0 && (
            <GallerySection key={group.key} label={group.label}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(group.key, event)}
              >
                <SortableContext items={group.works.map((w) => w.id)} strategy={rectSortingStrategy}>
                  {group.works.map((work) => (
                    <SortableWorkTile key={work.id} work={work} />
                  ))}
                </SortableContext>
              </DndContext>
            </GallerySection>
          )
      )}
    </div>
  );
}

function SortableWorkTile({ work }: { work: WorkItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} data-work-id={work.id}>
      <div className="relative">
        <GalleryCard title={work.title} cover={work.cover} />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="拖曳調整順序"
          className="absolute top-2 left-2 h-7 w-7 rounded-full bg-white/90 text-neutral-600 shadow-sm cursor-grab touch-none flex items-center justify-center"
        >
          ⠿
        </button>
        {!work.published && (
          <span className="absolute top-2 right-2 rounded bg-neutral-900/80 text-white text-xs px-1.5 py-0.5">
            隱藏
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="font-serif text-base truncate">{work.title}</p>
        <div className="flex items-center gap-3 shrink-0">
          <Link href={`/admin/${work.id}/edit`} className="text-sm text-neutral-600 hover:underline">
            編輯
          </Link>
          <DeleteWorkButton workId={work.id} />
        </div>
      </div>
    </div>
  );
}
