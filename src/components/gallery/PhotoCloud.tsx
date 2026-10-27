"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StageFrame } from "@/components/layout/StageFrame";
import { HYMAKAR_PHOTOS } from "@/components/gallery/hymakarPhotos";
import styles from "./photo-cloud.module.css";

const WORLD_W = 5200;
const WORLD_H = 3400;
const COLS = 22;
const ROWS = 14;
const PERSPECTIVE = 1100;
/** 0 = images close to the camera, 1 = images deep inside the field. */
const START_DEPTH = 0.2;
const DRAG_THRESHOLD = 6;

type Tile = {
  id: number;
  src: string;
  alt: string;
  x: number;
  y: number;
  size: number;
  z: number;
  duplicate: boolean;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTiles(): Tile[] {
  const rand = mulberry32(20261027);
  const cellW = WORLD_W / COLS;
  const cellH = WORLD_H / ROWS;
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const photo = HYMAKAR_PHOTOS[(row * COLS + col * 5) % HYMAKAR_PHOTOS.length];
      const size = Math.round(128 + rand() * 130);
      const padX = (rand() - 0.5) * cellW * 0.72;
      const padY = (rand() - 0.5) * cellH * 0.72;
      const duplicate = seen.has(photo.src);
      seen.add(photo.src);
      tiles.push({
        id: row * COLS + col,
        src: photo.src,
        alt: photo.alt,
        x: col * cellW + cellW / 2 - size / 2 + padX,
        y: row * cellH + cellH / 2 - size / 2 + padY,
        size,
        z: (size - 150) * 0.55,
        duplicate,
      });
    }
  }

  return tiles;
}

const TILES = buildTiles();

function depthToZ(depth: number) {
  const close = 460;
  const deep = -1500;
  return close + (deep - close) * depth;
}

export function PhotoCloud() {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pan = useRef({ x: 0, y: 0 });
  const depth = useRef(START_DEPTH);
  const shownDepth = useRef(START_DEPTH);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    moved: boolean;
    tileId: number | null;
  } | null>(null);
  const openRef = useRef(false);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    openRef.current = selected != null;
  }, [selected]);

  useEffect(() => {
    const stage = stageRef.current;
    const world = worldRef.current;
    if (!stage || !world) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const paint = () => {
      const follow = reduce ? 1 : 0.14;
      shownDepth.current += (depth.current - shownDepth.current) * follow;
      const z = depthToZ(shownDepth.current);
      world.style.transform = `translate3d(${pan.current.x}px, ${pan.current.y}px, ${z}px)`;
      raf = requestAnimationFrame(paint);
    };

    const onWheel = (event: WheelEvent) => {
      if (openRef.current) return;
      event.preventDefault();
      const next = depth.current + event.deltaY * 0.00115;
      depth.current = Math.min(1, Math.max(0, next));
    };

    paint();
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || openRef.current) return;
    const tile = (event.target as HTMLElement).closest<HTMLElement>("[data-tile-id]");
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      tileId: tile ? Number(tile.dataset.tileId) : null,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is unavailable for this event. */
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (!active.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      active.moved = true;
      setDragging(true);
    }
    if (!active.moved) return;

    const z = depthToZ(shownDepth.current);
    const scale = Math.max(0.2, PERSPECTIVE / (PERSPECTIVE - z));
    pan.current.x += (event.clientX - active.lastX) / scale;
    pan.current.y += (event.clientY - active.lastY) / scale;
    active.lastX = event.clientX;
    active.lastY = event.clientY;
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;

    if (!active.moved && active.tileId != null) {
      const tile = TILES.find((item) => item.id === active.tileId);
      if (tile) setSelected(tile);
    }

    drag.current = null;
    setDragging(false);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* Already released. */
    }
  };

  return (
    <section className={styles.page} aria-label="Gallery" data-lenis-prevent>
      <h1 className={styles.title}>Gallery</h1>
      <div
        ref={stageRef}
        className={dragging ? `${styles.stage} ${styles.dragging}` : styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={worldRef}
          className={styles.world}
          style={{
            width: WORLD_W,
            height: WORLD_H,
            marginLeft: -WORLD_W / 2,
            marginTop: -WORLD_H / 2,
          }}
        >
          {TILES.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={styles.tileBtn}
              data-tile-id={tile.id}
              aria-label={tile.duplicate ? undefined : tile.alt}
              aria-hidden={tile.duplicate ? true : undefined}
              tabIndex={tile.duplicate ? -1 : 0}
              style={{
                left: tile.x,
                top: tile.y,
                width: tile.size,
                height: tile.size,
                transform: `translateZ(${tile.z}px)`,
              }}
            >
              <img
                className={styles.tile}
                src={tile.src}
                alt=""
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <button
          type="button"
          className={styles.viewer}
          aria-label={`Close ${selected.alt}`}
          onClick={() => setSelected(null)}
        >
          <img className={styles.viewerImage} src={selected.src} alt={selected.alt} />
        </button>
      ) : null}

      <div className={styles.nav}>
        <StageFrame>
          <SiteHeader />
        </StageFrame>
      </div>
    </section>
  );
}
