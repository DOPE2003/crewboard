"use client";

import { useEffect, useRef } from "react";

export default function WhitepaperClient() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Array<{
      x: number; y: number; r: number;
      baseOpacity: number; driftSpeed: number;
      twinkleSpeed: number; twinklePhase: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.1 + 0.15,
          baseOpacity: Math.random() * 0.5 + 0.08,
          driftSpeed: Math.random() * 0.12 + 0.015,
          twinkleSpeed: Math.random() * 0.006 + 0.001,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    let frame = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      for (const s of stars) {
        const twinkle = Math.sin(frame * s.twinkleSpeed + s.twinklePhase) * 0.12;
        const alpha = Math.max(0, Math.min(1, s.baseOpacity + twinkle));
        s.y -= s.driftSpeed;

        if (s.y < -2) {
          s.y = canvas.height + 2;
          s.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    initStars();
    draw();

    const onResize = () => { resize(); initStars(); };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas id="stars-canvas" ref={ref} />;
}