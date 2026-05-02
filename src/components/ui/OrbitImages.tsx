"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, type MotionValue } from "motion/react";
import styles from "./OrbitImages.module.css";

type OrbitImageItem = string | { src: string; alt?: string };

export type OrbitImagesProps = {
  images: OrbitImageItem[];
  altPrefix?: string;

  // shape + path
  shape?: "ellipse" | "circle";
  baseSize?: number; // internal design size (square)
  radiusX?: number;
  radiusY?: number;
  radius?: number;

  // animation
  rotation?: number;
  duration?: number;
  direction?: "normal" | "reverse";
  easing?: any; // keep flexible for motion
  paused?: boolean;

  // layout
  itemSize?: number;
  fill?: boolean;
  responsive?: boolean;
  className?: string;

  // debug
  showPath?: boolean;
  pathColor?: string;
  pathWidth?: number;

  // center overlay content
  centerContent?: React.ReactNode;
};

function generateEllipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
}

function generateCirclePath(cx: number, cy: number, r: number) {
  return generateEllipsePath(cx, cy, r, r);
}

function OrbitItem(props: {
  item: React.ReactNode;
  index: number;
  totalItems: number;
  path: string;
  itemSize: number;
  rotation: number;
  progress: MotionValue<number>;
  fill: boolean;
}) {
  const { item, index, totalItems, path, itemSize, rotation, progress, fill } = props;

  // spread them evenly when fill = true
  const itemOffset = fill ? (index / totalItems) * 100 : 0;

  const offsetDistance = useTransform(progress, (p: number) => {
    const offset = (((p + itemOffset) % 100) + 100) % 100;
    return `${offset}%`;
  });

  return (
    <motion.div
      className={styles.orbitItem}
      style={{
        width: itemSize,
        height: itemSize,
        offsetPath: `path("${path}")`,
        offsetRotate: "0deg",
        offsetAnchor: "center center",
        offsetDistance,
      }}
    >
      {/* Counter-rotate the content so icons look upright */}
      <div style={{ transform: `rotate(${-rotation}deg)` }}>{item}</div>
    </motion.div>
  );
}

export default function OrbitImages({
  images = [],
  altPrefix = "Orbiting image",

  shape = "ellipse",
  baseSize = 900,
  radiusX = 330,
  radiusY = 120,
  radius = 240,

  rotation = -10,
  duration = 26,
  direction = "normal",
  easing = "linear",
  paused = false,

  itemSize = 86,
  fill = true,
  responsive = true,
  className = "",

  showPath = false,
  pathColor = "rgba(255,255,255,0.12)",
  pathWidth = 2,

  centerContent,
}: OrbitImagesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // design center (square)
  const cx = baseSize / 2;
  const cy = baseSize / 2;

  const path = useMemo(() => {
    if (shape === "circle") return generateCirclePath(cx, cy, radius);
    return generateEllipsePath(cx, cy, radiusX, radiusY);
  }, [shape, cx, cy, radiusX, radiusY, radius]);

  // responsive scaling: fit baseSize into container
  useEffect(() => {
    if (!responsive || !containerRef.current) return;

    const updateScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth || baseSize;
      const h = el.clientHeight || baseSize;
      const s = Math.min(w / baseSize, h / baseSize);
      setScale(Number.isFinite(s) && s > 0 ? s : 1);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [responsive, baseSize]);

  const progress = useMotionValue(0);

  useEffect(() => {
    if (paused) return;

    const to = direction === "reverse" ? -100 : 100;

    const controls = animate(progress, to, {
      duration,
      ease: easing,
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [progress, duration, easing, direction, paused]);

  // build items (string or {src, alt})
  const items = images.map((img, index) => {
    const src = typeof img === "string" ? img : img.src;
    const alt =
      typeof img === "string"
        ? `${altPrefix} ${index + 1}`
        : img.alt ?? `${altPrefix} ${index + 1}`;

    return (
      <img
        key={`${src}-${index}`}
        src={src}
        alt={alt}
        draggable={false}
        className={styles.orbitImage}
      />
    );
  });

  if (!images.length) return null;

  return (
    <div ref={containerRef} className={`${styles.orbitContainer} ${className}`} aria-hidden="true">
      <div
        className={styles.scalingWrap}
        style={{
          width: baseSize,
          height: baseSize,
          transform: responsive ? `translate(-50%, -50%) scale(${scale})` : undefined,
        }}
      >
        <div className={styles.rotationWrap} style={{ transform: `rotate(${rotation}deg)` }}>
          {showPath && (
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${baseSize} ${baseSize}`}
              className={styles.pathSvg}
            >
              <path d={path} fill="none" stroke={pathColor} strokeWidth={pathWidth / scale} />
            </svg>
          )}

          {items.map((node, index) => (
            <OrbitItem
              key={index}
              item={node}
              index={index}
              totalItems={items.length}
              path={path}
              itemSize={itemSize}
              rotation={rotation}
              progress={progress}
              fill={fill}
            />
          ))}
        </div>
      </div>

      {centerContent && <div className={styles.centerContent}>{centerContent}</div>}
    </div>
  );
}
