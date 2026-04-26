"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function PricingReveal({ children }: { children: React.ReactNode }) {
  const root = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cards = gsap.utils.toArray<HTMLElement>(
        root.current!.querySelectorAll(":scope > *"),
      );
      if (reduce) {
        gsap.set(cards, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.set(cards, { y: 56, autoAlpha: 0 });

      gsap.to(cards, {
        y: 0,
        autoAlpha: 1,
        duration: 1.05,
        ease: "expo.out",
        stagger: 0.14,
        scrollTrigger: {
          trigger: root.current,
          start: "top 82%",
          once: true,
        },
      });

      cards.forEach((card) => {
        const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
        const enter = () => lift(-6);
        const leave = () => lift(0);
        card.addEventListener("pointerenter", enter);
        card.addEventListener("pointerleave", leave);
        return () => {
          card.removeEventListener("pointerenter", enter);
          card.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="grid md:grid-cols-3 gap-5 md:gap-4"
      style={{ perspective: "1200px" }}
    >
      {children}
    </div>
  );
}
