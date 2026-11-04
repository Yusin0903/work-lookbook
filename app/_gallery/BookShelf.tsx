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

  function openBook(id: string) {
    if (openingId) return;
    setTagId(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpenId(id);
      return;
    }
    setOpeningId(id);
    timer.current = setTimeout(() => {
      setOpenId(id);
      setOpeningId(null);
    }, OPEN_DELAY_MS);
  }

  function closeBook() {
    setOpenId(null);
    setTagId(null);
  }

  function scrollShelf(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 300, behavior: "smooth" });
  }

  const openBookData = books.find((b) => b.id === openId) ?? null;

  if (!openBookData) {
    return (
      <div className="relative">
        <p className="text-center text-xs tracking-[0.28em] text-muted mb-6">左右滑動翻閱 · 點擊書本打開</p>
        <div
          ref={trackRef}
          className="book-track flex gap-8 sm:gap-12 overflow-x-auto snap-x snap-mandatory px-[max(1.5rem,calc(50%-8rem))] py-8"
          aria-label="作品書架"
        >
          {books.map((book) => (
            <div key={book.id} className="snap-center shrink-0">
              <button
                type="button"
                onClick={() => openBook(book.id)}
                data-opening={openingId === book.id}
                data-dimmed={openingId !== null && openingId !== book.id}
                className="book"
                aria-label={`打開 ${book.name}`}
              >
                <span className="book-body" />
                <span className="book-cover">
                  <span className="book-face book-face--front">
                    {book.cover?.type === "IMAGE" ? (
                      <img src={book.cover.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : book.cover?.type === "VIDEO" ? (
                      <video src={book.cover.url} muted className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-foreground/20" />
                    <span className="book-spine" />
                    <span className="absolute inset-x-0 bottom-0 p-6 text-left">
                      <span className="block text-[10px] font-medium tracking-[0.3em] text-background/80 mb-2">
                        {book.count} WORKS
                      </span>
                      <span className="block font-serif italic text-3xl leading-tight text-background">
                        {book.name}
                      </span>
                    </span>
                  </span>
                  <span className="book-face book-face--back" />
                </span>
              </button>
            </div>
          ))}
        </div>
        <div className="hidden sm:flex justify-center gap-6 mt-2">
          <button
            type="button"
            onClick={() => scrollShelf(-1)}
            className="text-sm tracking-widest text-muted hover:text-accent"
            aria-label="上一本"
          >
            ← PREV
          </button>
          <button
            type="button"
            onClick={() => scrollShelf(1)}
            className="text-sm tracking-widest text-muted hover:text-accent"
            aria-label="下一本"
          >
            NEXT →
          </button>
        </div>
      </div>
    );
  }

  const isAll = openBookData.id === ALL_BOOK_ID;
  const inBook = works.filter((w) => isAll || w.seriesId === openBookData.id);
  const availableTags = tags.filter((t) => inBook.some((w) => w.tagIds.includes(t.id)));
  const visible = tagId ? inBook.filter((w) => w.tagIds.includes(tagId)) : inBook;

  type Section = { key: string; label: string | null; works: ShelfWork[] };
  const sections: Section[] = isAll
    ? [
        ...books
          .filter((b) => b.id !== ALL_BOOK_ID)
          .map((b): Section => ({ key: b.id, label: b.name, works: visible.filter((w) => w.seriesId === b.id) })),
        { key: "none", label: null, works: visible.filter((w) => !w.seriesId) },
      ].filter((section) => section.works.length > 0)
    : [{ key: openBookData.id, label: null, works: visible }];

  return (
    <div className="book-page-in">
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={closeBook}
          className="text-sm tracking-widest text-muted hover:text-accent"
        >
          ← 回書架
        </button>
        <p className="text-xs tracking-[0.28em] text-accent">{inBook.length} WORKS</p>
      </div>

      <h2 className="font-serif italic text-4xl sm:text-5xl tracking-tight text-foreground text-center mb-8">
        {openBookData.name}
      </h2>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-12" aria-label="標籤篩選">
          <TagChip active={tagId === null} onClick={() => setTagId(null)}>
            All
          </TagChip>
          {availableTags.map((t) => (
            <TagChip key={t.id} active={tagId === t.id} onClick={() => setTagId(t.id)}>
              {t.name}
            </TagChip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-muted text-center">這個標籤下還沒有作品。</p>
      ) : (
        <div id="gallery" className="space-y-16 sm:space-y-20">
          {sections.map((section) => (
            <GallerySection key={section.key} label={isAll ? section.label : null}>
              {section.works.map((work) => (
                <Link
                  key={work.id}
                  href={`/work/${work.id}`}
                  className="group block"
                  data-work-id={work.id}
                >
                  <GalleryCard title={work.title} cover={work.cover} />
                  <GalleryCaption title={work.title} />
                </Link>
              ))}
            </GallerySection>
          ))}
        </div>
      )}
    </div>
  );
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm tracking-wide transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-divider text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
