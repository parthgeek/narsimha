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

    const templeViewer = document.getElementById("templeViewer");
    const templeScene = document.getElementById("templeScene");
    const viewControls = Array.from(
      templeViewer?.querySelectorAll<HTMLButtonElement>("[data-view-control]") ?? [],
    );
    let panX = 0;
    let panY = 0;
    let zoom = 1.08;
    let activePointer: number | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPanX = panX;
    let dragStartPanY = panY;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const constrainPan = () => {
      if (!templeScene) return;
      const maxX = (templeScene.clientWidth * (zoom - 1)) / 2;
      const maxY = (templeScene.clientHeight * (zoom - 1)) / 2;
      panX = clamp(panX, -maxX, maxX);
      panY = clamp(panY, -maxY, maxY);
    };

    const updateTempleView = () => {
      constrainPan();
      templeScene?.style.setProperty("--photo-x", `${panX}px`);
      templeScene?.style.setProperty("--photo-y", `${panY}px`);
      templeScene?.style.setProperty("--photo-zoom", String(zoom));
    };

    const markViewerUsed = () => templeViewer?.classList.add("has-interacted");
    const resetTempleView = () => {
      panX = 0;
      panY = 0;
      zoom = 1.08;
      updateTempleView();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!templeScene || event.button !== 0) return;
      activePointer = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
      templeScene.setPointerCapture(event.pointerId);
      templeScene.classList.add("is-dragging");
      markViewerUsed();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return;
      panX = dragStartPanX + event.clientX - dragStartX;
      panY = dragStartPanY + event.clientY - dragStartY;
      updateTempleView();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!templeScene || activePointer !== event.pointerId) return;
      if (templeScene.hasPointerCapture(event.pointerId)) {
        templeScene.releasePointerCapture(event.pointerId);
      }
      activePointer = null;
      templeScene.classList.remove("is-dragging");
    };

    const handleTempleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom = clamp(zoom - event.deltaY * 0.0012, 1, 2.6);
      markViewerUsed();
      updateTempleView();
    };

    const handleTempleKeydown = (event: KeyboardEvent) => {
      const keyActions: Record<string, () => void> = {
        ArrowLeft: () => (panX += 28),
        ArrowRight: () => (panX -= 28),
        ArrowUp: () => (panY += 28),
        ArrowDown: () => (panY -= 28),
        "+": () => (zoom = clamp(zoom + 0.14, 1, 2.6)),
        "=": () => (zoom = clamp(zoom + 0.14, 1, 2.6)),
        "-": () => (zoom = clamp(zoom - 0.14, 1, 2.6)),
        "0": resetTempleView,
      };
      const action = keyActions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
      markViewerUsed();
      updateTempleView();
    };

    const handleViewControl = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const control = button.dataset.viewControl;
      markViewerUsed();
      if (control === "zoom-in") zoom = clamp(zoom + 0.18, 1, 2.6);
      if (control === "zoom-out") zoom = clamp(zoom - 0.18, 1, 2.6);
      if (control === "reset") resetTempleView();
      if (control === "fullscreen" && templeViewer) {
        if (document.fullscreenElement === templeViewer) {
          void document.exitFullscreen().catch(() => undefined);
        } else {
          void templeViewer.requestFullscreen().catch(() => undefined);
        }
      }
      updateTempleView();
    };

    templeScene?.addEventListener("pointerdown", handlePointerDown);
    templeScene?.addEventListener("pointermove", handlePointerMove);
    templeScene?.addEventListener("pointerup", handlePointerUp);
    templeScene?.addEventListener("pointercancel", handlePointerUp);
    templeScene?.addEventListener("wheel", handleTempleWheel, { passive: false });
    templeScene?.addEventListener("keydown", handleTempleKeydown);
    templeScene?.addEventListener("dblclick", resetTempleView);
    viewControls.forEach((button) => button.addEventListener("click", handleViewControl));
    updateTempleView();

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
      templeScene?.removeEventListener("pointerdown", handlePointerDown);
      templeScene?.removeEventListener("pointermove", handlePointerMove);
      templeScene?.removeEventListener("pointerup", handlePointerUp);
      templeScene?.removeEventListener("pointercancel", handlePointerUp);
      templeScene?.removeEventListener("wheel", handleTempleWheel);
      templeScene?.removeEventListener("keydown", handleTempleKeydown);
      templeScene?.removeEventListener("dblclick", resetTempleView);
      viewControls.forEach((button) =>
        button.removeEventListener("click", handleViewControl),
      );
      detachSevaForm();
    };
  }, []);

  return null;
}
