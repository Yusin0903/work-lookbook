"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GalleryCard, GalleryCaption, type GalleryCover } from "@/app/_gallery/GalleryCard";
import { GallerySection } from "@/app/_gallery/GallerySection";

export interface ShelfWork {
  id: string;
  no: number;
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

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

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
  const [activeIndex, setActiveIndex] = useState(0);
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

  // The hero sits above the shelf, so bring the opened (or closed) shelf into view.
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

  function itemStride() {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.offsetWidth + gap;
  }

  function scrollShelf(direction: 1 | -1) {
    trackRef.current?.scrollBy({ left: direction * itemStride(), behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    const stride = itemStride();
    if (!track || !stride) return;
    setActiveIndex(Math.min(books.length - 1, Math.round(track.scrollLeft / stride)));
  }

  const openBookData = books.find((b) => b.id === openId) ?? null;

  if (!openBookData) {
    return (
      <div ref={rootRef} className="scroll-mt-20">
        <div className="flex items-end justify-between border-t border-foreground pt-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight">Collections</h2>
            <p className="mt-1 font-mono text-xs text-muted">左右滑動瀏覽 · 點選圖錄打開</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-muted">
              {pad(activeIndex + 1)} / {pad(books.length)}
            </span>
            <button
              type="button"
              onClick={() => scrollShelf(-1)}
              className="h-9 w-9 border border-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="上一本"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollShelf(1)}
              className="h-9 w-9 border border-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="下一本"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="shelf-track -mx-4 sm:-mx-8 mt-10 flex gap-6 sm:gap-10 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 pb-4"
          aria-label="作品圖錄"
        >
          {books.map((book, i) => (
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
                <span className="mt-4 flex items-baseline justify-between font-mono text-[11px] uppercase text-muted">
                  <span>Vol. {pad(i + 1)}</span>
                  <span>{pad(book.count)} Objects</span>
                </span>
                <span className="mt-1 block text-xl font-medium tracking-tight underline-offset-4 decoration-1 group-hover:underline">
                  {book.name}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isAll = openBookData.id === ALL_BOOK_ID;
  const volumeNo = books.findIndex((b) => b.id === openBookData.id) + 1;
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
    <div ref={rootRef} className="page-in scroll-mt-20">
      <div className="flex items-center justify-between border-t border-foreground pt-4 text-sm">
        <button type="button" onClick={closeBook} className="hover:underline underline-offset-4">
          ← Collections
        </button>
        <span className="font-mono text-xs text-muted">Vol. {pad(volumeNo)}</span>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[clamp(2.75rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
          {openBookData.name}
        </h2>
        <p className="font-mono text-xs text-muted">{pad(inBook.length, 3)} Objects</p>
      </div>

      {availableTags.length > 0 && (
        <div
          className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-y border-divider py-4"
          aria-label="標籤篩選"
        >
          <span className="font-mono text-[11px] uppercase text-muted">Material / Finish</span>
          <FilterButton active={tagId === null} onClick={() => setTagId(null)} count={inBook.length}>
            All
          </FilterButton>
          {availableTags.map((t) => (
            <FilterButton
              key={t.id}
              active={tagId === t.id}
              onClick={() => setTagId(t.id)}
              count={inBook.filter((w) => w.tagIds.includes(t.id)).length}
            >
              {t.name}
            </FilterButton>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="mt-16 text-muted">這個標籤下還沒有作品。</p>
      ) : (
        <div id="gallery" className="mt-12 sm:mt-16 space-y-20 sm:space-y-28">
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
                    no={work.no}
                    title={work.title}
                    meta={work.tagIds.map((id) => tagName.get(id)).filter(Boolean).join(" · ")}
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

function FilterButton({
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
      className={`text-sm transition-colors underline-offset-[6px] decoration-1 ${
        active ? "text-foreground underline" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
      <sup aria-hidden="true" className="ml-0.5 font-mono text-[10px]">
        {count}
      </sup>
    </button>
  );
}
