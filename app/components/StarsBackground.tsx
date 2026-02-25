"use client";

import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    type Star = {
      x: number;
      y: number;
      r: number;
      baseOpacity: number;
      driftSpeed: number;
      twinkleSpeed: number;
      twinklePhase: number;
    };

    let stars: Star[] = [];
    let raf = 0;
    let frame = 0;

    const getStarColor = () => {
      const v = getComputedStyle(document.body).getPropertyValue("--star-rgb").trim();
      return v || "255,255,255";
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initStars = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.max(180, Math.floor((w * h) / 9000));
      stars = [];

      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.15 + 0.12,
          baseOpacity: Math.random() * 0.45 + 0.06,
          driftSpeed: Math.random() * 0.14 + 0.02,
          twinkleSpeed: Math.random() * 0.008 + 0.002,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const starRGB = getStarColor();

      ctx.clearRect(0, 0, w, h);
      frame++;

      for (const s of stars) {
        const twinkle = Math.sin(frame * s.twinkleSpeed + s.twinklePhase) * 0.14;
        const alpha = Math.max(0, Math.min(1, s.baseOpacity + twinkle));

        s.y -= s.driftSpeed;
        if (s.y < -2) {
          s.y = h + 2;
          s.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starRGB},${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    initStars();
    draw();

    const onResize = () => {
      resize();
      initStars();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="stars-canvas" ref={ref} />;
}