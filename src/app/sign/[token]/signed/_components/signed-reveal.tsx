"use client";

import * as React from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function SignedReveal() {
  const root = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set("[data-sr]", { autoAlpha: 1, y: 0 });
        gsap.set("[data-sr=ring], [data-sr=tick]", { strokeDashoffset: 0 });
        return;
      }

      const ring = root.current?.querySelector<SVGCircleElement>("[data-sr=ring]") ?? null;
      const tick = root.current?.querySelector<SVGPathElement>("[data-sr=tick]") ?? null;
      const halo = root.current?.querySelector<SVGCircleElement>("[data-sr=halo]") ?? null;
      if (!ring || !tick || !halo) return;

      if (ring) {
        const len = ring.getTotalLength();
        gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
      }
      if (tick) {
        const len = tick.getTotalLength();
        gsap.set(tick, { strokeDasharray: len, strokeDashoffset: len });
      }
      if (halo) {
        gsap.set(halo, { transformOrigin: "center", scale: 0.6, opacity: 0 });
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(ring, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" })
        .to(tick, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, "-=0.18")
        .to(
          halo,
          { scale: 1.6, opacity: 0.0, duration: 1.2, ease: "expo.out" },
          "-=0.5",
        )
        .from("[data-sr=label]", { y: 10, autoAlpha: 0, duration: 0.5 }, "-=0.85")
        .from("[data-sr=title]", { y: 24, autoAlpha: 0, duration: 0.7 }, "-=0.45")
        .from("[data-sr=copy]", { y: 16, autoAlpha: 0, duration: 0.55 }, "-=0.45")
        .from(
          "[data-sr=card]",
          { y: 24, autoAlpha: 0, duration: 0.6, ease: "expo.out" },
          "-=0.35",
        )
        .from(
          "[data-sr=card] li",
          { y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.08 },
          "-=0.35",
        );
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <div className="flex justify-center">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          aria-hidden
          className="text-forest-600"
        >
          <circle
            data-sr="halo"
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0"
          />
          <circle
            data-sr="ring"
            cx="48"
            cy="48"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
          <path
            data-sr="tick"
            d="M30 49 L43 62 L66 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div data-sr="label" className="mt-6">
        <span className="block text-center text-[11px] uppercase tracking-[0.2em] text-brass-700 font-medium">
          Wholesail · Signed
        </span>
      </div>

      <h1
        data-sr="title"
        className="text-center font-display text-4xl sm:text-5xl text-ink mt-3 leading-[1.05] tracking-tight"
      >
        Signature recorded.
      </h1>

      <p
        data-sr="copy"
        className="text-center text-ink-soft mt-4 text-base leading-relaxed max-w-prose mx-auto"
      >
        Your signature has been delivered to the party that sent you this link.
        They will follow up with the next step in the transaction. You can
        safely close this window.
      </p>

      <div
        data-sr="card"
        className="mt-10 rounded-[10px] border border-forest-200 bg-forest-50 p-5"
      >
        <p className="text-sm text-forest-700 font-medium">What happens next</p>
        <ul className="mt-2 grid gap-1.5 text-sm text-ink-soft">
          <li>
            • A copy of the signed document will be sent to your email if one
            was provided.
          </li>
          <li>• You may request a paper copy at any time from the sender.</li>
          <li>• An audit record of this signing event has been saved.</li>
        </ul>
      </div>
    </div>
  );
}
