"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SignaturePadHandle {
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export const SignaturePad = React.forwardRef<
  SignaturePadHandle,
  {
    width?: number;
    height?: number;
    className?: string;
    onChange?: (empty: boolean) => void;
  }
>(function SignaturePad(
  { width = 640, height = 200, className, onChange },
  ref,
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const empty = React.useRef(true);

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = width * dpr;
    c.height = height * dpr;
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1a1f1a";
  }, [width, height]);

  function pointFrom(
    e: React.PointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pointFrom(e);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty.current) {
      empty.current = false;
      onChange?.(false);
    }
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    last.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  React.useImperativeHandle(
    ref,
    () => ({
      toDataURL: () => {
        const c = canvasRef.current;
        if (!c || empty.current) return null;
        return c.toDataURL("image/png");
      },
      clear: () => {
        const c = canvasRef.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return;
        ctx.clearRect(0, 0, c.width, c.height);
        empty.current = true;
        onChange?.(true);
      },
      isEmpty: () => empty.current,
    }),
    [onChange],
  );

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      className={cn(
        "block w-full bg-bone border border-rule rounded-[6px] touch-none cursor-crosshair",
        className,
      )}
      aria-label="Signature pad — sign with your mouse, finger, or stylus"
    />
  );
});
