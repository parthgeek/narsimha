"use client";

import { useEffect, useRef, useState } from "react";

const FESTIVAL_START = "2026-09-14";
const FESTIVAL_END = "2026-09-15";
const VIDEO_DELAY_MS = 5000;

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${value.year}-${value.month}-${value.day}`;
}

export default function FestivalVideoOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const indiaDate = getIndiaDate();
    if (indiaDate < FESTIVAL_START || indiaDate > FESTIVAL_END) return;

    const timer = window.setTimeout(() => setIsVisible(true), VIDEO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.classList.add("has-festival-video-overlay");
    closeButtonRef.current?.focus();

    const video = videoRef.current;
    if (video) {
      const playVideo = async () => {
        video.muted = false;
        video.volume = 1;

        try {
          await video.play();
        } catch {
          video.muted = true;
          await video.play().catch(() => undefined);
        }
      };

      void playVideo();
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsVisible(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("has-festival-video-overlay");
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [isVisible]);

  const closeOverlay = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="festival-video-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="festival-video-title"
    >
      <button
        type="button"
        className="festival-video-backdrop"
        aria-label="Close festival video"
        onClick={closeOverlay}
      />
      <div className="festival-video-panel">
        <div className="festival-video-label" id="festival-video-title">
          <span>Special Darshan</span>
          Gowri Ganesh Festival
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="festival-video-close"
          aria-label="Close festival video"
          onClick={closeOverlay}
        >
          <span aria-hidden="true">×</span>
        </button>
        <video
          ref={videoRef}
          className="festival-video-media"
          src="/media/gowri-ganesh-festival-celebration.mp4"
          poster="/media/gowri-ganesh-festival-yoga-narasimha.png"
          autoPlay
          playsInline
          controls
          preload="auto"
        />
      </div>
    </div>
  );
}
