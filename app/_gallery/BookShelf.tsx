"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GalleryCard, GalleryCaption, type GalleryCover } from "@/app/_gallery/GalleryCard";
import { GallerySection } from "@/app/_gallery/GallerySection";

export interface ShelfWork {
  id: string;
  title: string;
  cover: GalleryCover | null;
  seriesId: string | null;
  tagIds: string[];
}

export interface ShelfBook {
  id: string;
  name: string;
  cover: GalleryCover | null;
  count: number;
}

export interface ShelfTag {
  id: string;
  name: string;
}

const ALL_BOOK_ID = "all";
const OPEN_DELAY_MS = 900;

export function BookShelf({
  books,
  works,
  tags,
  initialBookId,
  initialTagId,
}: {
  books: ShelfBook[];
  works: ShelfWork[];
  tags: ShelfTag[];
  initialBookId: string | null;
  initialTagId: string | null;
}) {
  const validInitial = books.some((b) => b.id === initialBookId) ? initialBookId : null;
  const [openId, setOpenId] = useState<string | null>(validInitial);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(validInitial ? initialTagId : null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Keep the URL shareable and let the work page link back to the open book.
  useEffect(() => {
    const params = new URLSearchParams();
    if (openId) params.set("book", openId);
    if (openId && tagId) params.set("tag", tagId);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }, [openId, tagId]);

  // The intro sits above the shelf, so bring the opened (or closed) shelf into view.
  function scrollToShelf() {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openBook(id: string) {
    if (openingId) return;
    setTagId(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpenId(id);
      scrollToShelf();
      return;
    }
    setOpeningId(id);
    timer.current = setTimeout(() => {
      setOpenId(id);
      setOpeningId(null);
      scrollToShelf();
    }, OPEN_DELAY_MS);
  }

  function closeBook() {
    setOpenId(null);
    setTagId(null);
    scrollToShelf();
  }

  function scrollShelf(direction: 1 | -1) {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: "smooth" });
  }

  const openBookData = books.find((b) => b.id === openId) ?? null;

  if (!openBookData) {
    return (
      <div ref={rootRef} className="scroll-mt-24">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Collections</h2>
            <p className="mt-1 text-sm text-muted">左右滑動瀏覽,點選系列打開</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <ArrowButton label="上一本" onClick={() => scrollShelf(-1)}>
              ←
            </ArrowButton>
            <ArrowButton label="下一本" onClick={() => scrollShelf(1)}>
              →
            </ArrowButton>
          </div>
        </div>

        <div
          ref={trackRef}
          className="shelf-track -mx-4 sm:-mx-8 mt-6 flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 pb-2"
          aria-label="作品系列"
        >
          {books.map((book) => (
            <div key={book.id} className="snap-start shrink-0">
              <button
                type="button"
                onClick={() => openBook(book.id)}
                data-opening={openingId === book.id}
                data-dimmed={openingId !== null && openingId !== book.id}
                className="volume group"
                aria-label={`打開 ${book.name}`}
              >
                <span className="volume-book">
                  <span className="volume-pages" />
                  <span className="volume-cover">
                    <span className="volume-face volume-face--front">
                      {book.cover?.type === "IMAGE" ? (
                        <img src={book.cover.url} alt="" className="h-full w-full object-cover" />
                      ) : book.cover?.type === "VIDEO" ? (
                        <video src={book.cover.url} muted className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="volume-face volume-face--back" />
                  </span>
                </span>
                <span className="mt-3 flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{book.name}</span>
                  <span className="text-muted">{book.count}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isAll = openBookData.id === ALL_BOOK_ID;
  const inBook = works.filter((w) => isAll || w.seriesId === openBookData.id);
  const availableTags = tags.filter((t) => inBook.some((w) => w.tagIds.includes(t.id)));
  const visible = tagId ? inBook.filter((w) => w.tagIds.includes(tagId)) : inBook;
  const tagName = new Map(tags.map((t) => [t.id, t.name]));

  type Section = { key: string; label: string | null; works: ShelfWork[] };
  const sections: Section[] = isAll
    ? [
        ...books
          .filter((b) => b.id !== ALL_BOOK_ID)
          .map((b): Section => ({ key: b.id, label: b.name, works: visible.filter((w) => w.seriesId === b.id) })),
        { key: "none", label: "Other Works", works: visible.filter((w) => !w.seriesId) },
      ].filter((section) => section.works.length > 0)
    : [{ key: openBookData.id, label: null, works: visible }];

  return (
    <div ref={rootRef} className="page-in scroll-mt-24">
      <div className="flex items-center gap-2 text-sm text-muted">
        <button type="button" onClick={closeBook} className="hover:text-foreground">
          ← Collections
        </button>
        <span>/</span>
        <span className="text-foreground">{openBookData.name}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{openBookData.name}</h2>
        <span className="text-sm text-muted">{inBook.length} works</span>
      </div>

      {availableTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" aria-label="標籤篩選">
          <FilterPill active={tagId === null} onClick={() => setTagId(null)} count={inBook.length}>
            All
          </FilterPill>
          {availableTags.map((t) => (
            <FilterPill
              key={t.id}
              active={tagId === t.id}
              onClick={() => setTagId(t.id)}
              count={inBook.filter((w) => w.tagIds.includes(t.id)).length}
            >
              {t.name}
            </FilterPill>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-12 text-muted">這個標籤下還沒有作品。</p>
      ) : (
        <div id="gallery" className="mt-10 space-y-16">
          {sections.map((section) => (
            <GallerySection
              key={section.key}
              label={isAll ? section.label : null}
              count={isAll ? section.works.length : undefined}
            >
              {section.works.map((work) => (
                <Link key={work.id} href={`/work/${work.id}`} className="group block" data-work-id={work.id}>
                  <GalleryCard title={work.title} cover={work.cover} />
                  <GalleryCaption
                    title={work.title}
                    meta={work.tagIds.map((id) => tagName.get(id)).filter(Boolean).join(", ")}
                  />
                </Link>
              ))}
            </GallerySection>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-10 w-10 rounded-full bg-surface text-sm transition-colors hover:bg-foreground hover:text-background"
    >
      {children}
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${
        active ? "bg-foreground text-background" : "bg-surface hover:bg-divider"
      }`}
    >
      {children}
      <span aria-hidden="true" className={`ml-1.5 ${active ? "text-background/60" : "text-muted"}`}>
        {count}
      </span>
    </button>
  );
}
