"use client";

import * as React from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, SplitText);

export function HeroReveal() {
  const root = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set("[data-hr]", { autoAlpha: 1, y: 0 });
        return;
      }

      const headline = root.current?.querySelector<HTMLHeadingElement>("[data-hr=headline]");
      if (!headline) return;

      const split = new SplitText(headline, {
        type: "words,chars",
        wordsClass: "inline-block overflow-hidden align-baseline",
        charsClass: "inline-block will-change-transform",
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.set("[data-hr]", { autoAlpha: 1 })
        .from(split.chars, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          stagger: { each: 0.018, from: "start" },
        })
        .from(
          "[data-hr=lede]",
          { y: 24, opacity: 0, duration: 0.8 },
          "-=0.55",
        )
        .from(
          "[data-hr=cta]",
          { y: 18, opacity: 0, duration: 0.6 },
          "-=0.55",
        )
        .from(
          "[data-hr=meta] > *",
          { y: 8, opacity: 0, duration: 0.5, stagger: 0.08 },
          "-=0.4",
        )
        .from(
          "[data-hr=scroll]",
          { y: -12, opacity: 0, duration: 0.6 },
          "-=0.3",
        );

      const fader = gsap.quickTo("[data-hr=scroll]", "opacity", {
        duration: 0.4,
        ease: "power2.out",
      });
      const onScroll = () => {
        const o = Math.max(0, 1 - window.scrollY / 240);
        fader(o);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", onScroll);
        split.revert();
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-48 sm:pt-32"
    >
      <h1
        data-hr="headline"
        style={{
          fontFamily: "'Instrument Serif', serif",
          letterSpacing: "-2.46px",
          opacity: 0,
        }}
        className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] max-w-7xl font-normal text-white"
      >
        Where{" "}
        <em className="not-italic text-muted-fg">dealmakers</em> rise{" "}
        <em className="not-italic text-muted-fg">through the noise.</em>
      </h1>

      <p
        data-hr="lede"
        style={{ opacity: 0 }}
        className="text-muted-fg text-base sm:text-lg max-w-2xl mt-8 leading-relaxed"
      >
        Wholesail is a workshop for sharp investors, careful operators, and
        quiet closers. Underwrite the math, generate the paper, hand it to your
        attorney &mdash; every deal, every state, every time.
      </p>

      <Link
        data-hr="cta"
        href="/signup"
        style={{ opacity: 0 }}
        className="liquid-glass rounded-full px-14 py-5 text-base text-white mt-12 hover:scale-[1.03] active:scale-[0.98] cursor-pointer transition-transform"
      >
        Begin Journey
      </Link>

      <div
        data-hr="meta"
        style={{ opacity: 1 }}
        className="mt-10 flex items-center gap-5 text-xs text-muted-fg uppercase tracking-[0.24em]"
      >
        <span>Free during beta</span>
        <span aria-hidden className="h-3 w-px bg-white/20" />
        <span>15 states</span>
        <span aria-hidden className="h-3 w-px bg-white/20" />
        <span>No card required</span>
      </div>

      <Link
        data-hr="scroll"
        href="#pricing"
        aria-label="Scroll to pricing"
        style={{ opacity: 1 }}
        className="absolute z-10 bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors"
      >
        <svg
          width="22"
          height="32"
          viewBox="0 0 22 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          <rect x="1" y="1" width="20" height="30" rx="10" />
          <circle cx="11" cy="10" r="1.5" fill="currentColor">
            <animate
              attributeName="cy"
              from="10"
              to="22"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="1"
              to="0"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </Link>
    </div>
  );
}
