"use client";

import { useEffect } from "react";

export default function ClientEffects() {
  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(".hero-slide-img"));
    const dotsWrap = document.getElementById("heroDots");
    let current = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const goTo = (index: number) => {
      if (!slides.length || !dotsWrap?.children.length) return;
      slides[current]?.classList.remove("active");
      dotsWrap.children[current]?.classList.remove("active");
      current = index;
      slides[current]?.classList.add("active");
      dotsWrap.children[current]?.classList.add("active");
    };

    if (dotsWrap && slides.length) {
      dotsWrap.replaceChildren();
      slides.forEach((_, index) => {
        const button = document.createElement("button");
        if (index === 0) button.classList.add("active");
        button.addEventListener("click", () => goTo(index));
        dotsWrap.appendChild(button);
      });
      intervalId = setInterval(() => goTo((current + 1) % slides.length), 5200);
    }

    const navEl = document.getElementById("siteNav");
    const handleScroll = () => {
      navEl?.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add("in");
              });
            },
            { threshold: 0.15 },
          )
        : undefined;

    if (observer) {
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("in"));
    }

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg") as HTMLImageElement | null;
    const lightboxClose = document.getElementById("lightboxClose");
    const figures = Array.from(document.querySelectorAll<HTMLElement>("[data-full]"));

    const figureHandlers = figures.map((figure) => {
      const handler = () => {
        if (!lightbox || !lightboxImg) return;
        lightboxImg.src = figure.getAttribute("data-full") ?? "";
        lightboxImg.classList.toggle(
          "crop-from-bottom",
          figure.hasAttribute("data-crop-bottom"),
        );
        lightbox.classList.add("open");
      };
      figure.addEventListener("click", handler);
      return { figure, handler };
    });

    const closeLightbox = () => lightbox?.classList.remove("open");
    const handleLightboxClick = (event: MouseEvent) => {
      if (event.target === lightbox) closeLightbox();
    };

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox?.addEventListener("click", handleLightboxClick);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
      figureHandlers.forEach(({ figure, handler }) => {
        figure.removeEventListener("click", handler);
      });
      lightboxClose?.removeEventListener("click", closeLightbox);
      lightbox?.removeEventListener("click", handleLightboxClick);
    };
  }, []);

  return null;
}

