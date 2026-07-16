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

    const attachForm = ({
      formId,
      statusId,
      endpoint,
      idleLabel,
      successMessage,
    }: {
      formId: string;
      statusId: string;
      endpoint: string;
      idleLabel: string;
      successMessage: string;
    }) => {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      const status = document.getElementById(statusId);

      const handleSubmit = async (event: SubmitEvent) => {
        event.preventDefault();
        if (!form) return;

        const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (button) {
          button.disabled = true;
          button.textContent = "Sending…";
        }
        if (status) status.className = "seva-status";

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              Object.fromEntries(
                new FormData(form) as unknown as Iterable<[string, string]>,
              ),
            ),
          });
          const data = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!response.ok) throw new Error(data.error || "Request failed");

          form.reset();
          if (status) {
            status.textContent = successMessage;
            status.className = "seva-status show ok";
          }
        } catch (error) {
          if (status) {
            status.textContent =
              (error instanceof Error && error.message) ||
              "Something went wrong. Please call +91 99647 62267 or email yoganarasimhabaggavalli@gmail.com.";
            status.className = "seva-status show err";
          }
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = idleLabel;
          }
        }
      };

      form?.addEventListener("submit", handleSubmit);
      return () => form?.removeEventListener("submit", handleSubmit);
    };

    const detachSevaForm = attachForm({
      formId: "sevaForm",
      statusId: "sevaStatus",
      endpoint: "/api/seva",
      idleLabel: "Submit Seva Request",
      successMessage:
        "Your seva request has been sent. Please check your email for confirmation and temple contact details. ॐ",
    });
    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
      figureHandlers.forEach(({ figure, handler }) => {
        figure.removeEventListener("click", handler);
      });
      lightboxClose?.removeEventListener("click", closeLightbox);
      lightbox?.removeEventListener("click", handleLightboxClick);
      detachSevaForm();
    };
  }, []);

  return null;
}
